'use server';

/**
 * @fileOverview Multimodal Genkit flow to analyze prescription documents.
 *
 * Grounded in the "Illegible Medical Prescription Images Dataset" (Kaggle) via
 * a local NLP inference server trained on the dataset. The `prescriptionNLPLookup`
 * tool calls the FastAPI server (scripts/prescription_inference_server.py) for
 * real model-confidence scores and category classification before Gemini synthesizes
 * the final structured output.
 *
 * To activate NLP grounding:
 *   1. python scripts/train_prescription_nlp.py
 *   2. uvicorn scripts.prescription_inference_server:app --port 8000
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// ── Schemas ───────────────────────────────────────────────────────────────────

const AnalyzePrescriptionInputSchema = z.object({
  fileDataUri: z.string().describe("The prescription file as a Base64 Data URI."),
  mimeType: z.string().describe("The MIME type of the file (e.g., image/jpeg, application/pdf)."),
});

export type AnalyzePrescriptionInput = z.infer<typeof AnalyzePrescriptionInputSchema>;

const MedicationSchema = z.object({
  name: z.string().describe("The name of the medicine."),
  dosage: z.string().describe("The strength/dosage (e.g. 10mg)."),
  frequency: z.string().describe("How often to take it (e.g., BD, OD, TID)."),
  instructions: z.string().describe("Specific intake instructions."),
  duration: z.string().describe("How many days/weeks to take it."),
  category: z.enum(['General', 'Asthma', 'BP', 'Diabetes', 'Heart', 'Allergy']).describe("The health category."),
});

const AnalyzePrescriptionOutputSchema = z.object({
  patientName: z.string().optional().describe("Extracted patient name."),
  diagnosis: z.string().describe("The primary clinical condition identified."),
  medications: z.array(MedicationSchema).describe("Structured medication regimen."),
  clinicalReport: z.string().describe("Professional clinical summary with safety insights."),
  rawExtractedText: z.string().describe("All text identified in the document (OCR raw)."),
  nlpCategory: z.string().optional().describe("Category predicted by the local NLP model."),
  nlpConfidence: z.number().optional().describe("Confidence score from the local NLP model (0–1)."),
});

export type AnalyzePrescriptionOutput = z.infer<typeof AnalyzePrescriptionOutputSchema>;

// ── NLP Grounding Tool ────────────────────────────────────────────────────────

/**
 * HTTP tool that calls the locally running FastAPI inference server.
 * Trained on: mehaksingal/illegible-medical-prescription-images-dataset (Kaggle)
 *
 * If the server is not running, the tool returns a graceful fallback so the
 * Gemini model can still complete analysis using its own knowledge.
 */
const prescriptionNLPLookup = ai.defineTool(
  {
    name: 'prescriptionNLPLookup',
    description:
      'Queries the local prescription NLP model (trained on the Kaggle Illegible Medical Prescription Images Dataset) to classify text into a medical category and return a confidence score. Use this tool first to ground the prescription analysis in real model output.',
    inputSchema: z.object({
      text: z.string().describe('The raw OCR-extracted prescription text to classify.'),
    }),
    outputSchema: z.object({
      category: z.string().describe('Predicted medication category (General, BP, Diabetes, Heart, Asthma, Allergy).'),
      confidence: z.number().describe('Model confidence score between 0 and 1.'),
      model_used: z.string().describe('Which model produced the result.'),
      warning: z.string().optional().describe('Warning if model is not loaded.'),
    }),
  },
  async (input) => {
    const NLP_SERVER_URL = process.env.NLP_SERVER_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${NLP_SERVER_URL}/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.text }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`NLP server responded with status ${response.status}`);
      }

      const data = await response.json();
      return {
        category: data.category ?? 'General',
        confidence: data.confidence ?? 0,
        model_used: data.model_used ?? 'unknown',
        warning: data.warning,
      };
    } catch (error: any) {
      // Graceful fallback — server may not be running during development
      console.warn('[prescriptionNLPLookup] NLP server unavailable:', error.message);
      return {
        category: 'General',
        confidence: 0,
        model_used: 'server_offline',
        warning:
          'Local NLP server is not running. Start it with: ' +
          'uvicorn scripts.prescription_inference_server:app --port 8000 ' +
          '(after running: python scripts/train_prescription_nlp.py)',
      };
    }
  }
);

// ── Prompt ────────────────────────────────────────────────────────────────────

const prompt = ai.definePrompt({
  name: 'analyzePrescriptionPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  tools: [prescriptionNLPLookup],
  input: { schema: AnalyzePrescriptionInputSchema },
  output: { schema: AnalyzePrescriptionOutputSchema },
  prompt: `You are an expert ML-Powered Pharmaceutical Registrar.
Analyze the provided prescription document with high precision.

STEP 1: Extract all visible text from the prescription image (raw OCR).
STEP 2: Call the 'prescriptionNLPLookup' tool with the extracted text to get the
        NLP model's category prediction and confidence score (trained on real
        illegible prescription images from Kaggle).
STEP 3: Use the NLP tool result to validate and refine your medication extraction.
        - If confidence > 0.7: trust the model category strongly.
        - If confidence 0.4–0.7: use it as a strong hint alongside clinical context.
        - If confidence < 0.4 or model_used = 'server_offline': rely on your own analysis.
STEP 4: Use standard medical NLP to resolve abbreviations:
        BD = Twice daily, OD = Once daily, TID = Three times daily,
        QID = Four times daily, SOS = As needed, AC = Before meals, PC = After meals.

INSTRUCTIONS:
1. Identify the Primary Diagnosis.
2. Extract all Medication details: name, dosage, frequency, duration, and category.
   - Use the NLP model's category if confidence > 0.5.
3. If handwriting is ambiguous, use the clinical context of the diagnosis to infer the likely medication.
4. Set nlpCategory and nlpConfidence from the tool result.

CLINICAL REPORT:
Provide a grounded summary:
- Summarize the therapeutic plan.
- Highlight critical contraindications and drug interactions.
- Note the NLP model's classification confidence.
- Use professional clinical language.

Prescription Document: {{media url=fileDataUri}}`,
});

// ── Flow ──────────────────────────────────────────────────────────────────────

export async function analyzePrescription(input: AnalyzePrescriptionInput): Promise<AnalyzePrescriptionOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("AI engine provided empty clinical analysis.");
    return output;
  } catch (error: any) {
    if (error.message?.includes('503') || error.message?.includes('busy')) {
      return {
        diagnosis: "Diagnostic Engine High-Load",
        medications: [],
        clinicalReport:
          "The ML analysis node is currently optimizing. Precision extraction is paused to prevent accuracy skews.",
        rawExtractedText: "Clinical telemetry offline. Please retry in 60 seconds.",
      };
    }
    throw error;
  }
}

export const analyzePrescriptionFlow = ai.defineFlow(
  {
    name: 'analyzePrescriptionFlow',
    inputSchema: AnalyzePrescriptionInputSchema,
    outputSchema: AnalyzePrescriptionOutputSchema,
  },
  async (input) => {
    return analyzePrescription(input);
  }
);
