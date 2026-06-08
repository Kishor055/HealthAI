'use server';

/**
 * @fileOverview Multimodal Genkit flow to analyze prescription images or PDFs.
 * Updated to include structured clinical reports for RAG-based downloads.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AnalyzePrescriptionInputSchema = z.object({
  fileDataUri: z.string().describe("The prescription file as a Base64 Data URI."),
  mimeType: z.string().describe("The MIME type of the file (e.g., image/jpeg, application/pdf)."),
});

export type AnalyzePrescriptionInput = z.infer<typeof AnalyzePrescriptionInputSchema>;

const MedicationSchema = z.object({
  name: z.string().describe("The name of the medicine."),
  dosage: z.string().describe("The strength/dosage (e.g. 10mg)."),
  frequency: z.string().describe("How often to take it."),
  instructions: z.string().describe("Specific intake instructions."),
  duration: z.string().describe("How many days/weeks to take it."),
  category: z.enum(['General', 'Asthma', 'BP', 'Diabetes', 'Heart', 'Allergy']).describe("The health category of this medication."),
});

const AnalyzePrescriptionOutputSchema = z.object({
  patientName: z.string().optional(),
  diagnosis: z.string().describe("The extracted diagnosis or condition mentioned."),
  medications: z.array(MedicationSchema),
  clinicalReport: z.string().describe("A grounded, detailed clinical summary for the patient report."),
  rawExtractedText: z.string().describe("All text found in the document."),
});

export type AnalyzePrescriptionOutput = z.infer<typeof AnalyzePrescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzePrescriptionPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: AnalyzePrescriptionInputSchema },
  output: { schema: AnalyzePrescriptionOutputSchema },
  prompt: `You are an expert medical OCR and pharmaceutical analyst. 
Analyze the provided prescription document carefully. 

Extract all medication details including name, dosage, frequency, and instructions. 
Identify the condition or diagnosis if present. 

In the 'clinicalReport' section, provide a comprehensive summary:
1. Summarize the treatment plan.
2. Highlight any primary concerns or specific interactions (simulating RAG context from pharmaceutical databases).
3. Provide patient-friendly advice for adherence.

Prescription Document: {{media url=fileDataUri}}`,
});

export async function analyzePrescription(input: AnalyzePrescriptionInput): Promise<AnalyzePrescriptionOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Failed to extract clinical data.");
    return output;
  } catch (error: any) {
    if (error.message?.includes('503')) {
      return {
        diagnosis: "Service Temporarily Unavailable (503)",
        medications: [],
        clinicalReport: "The report engine is currently busy. Please retry in a few moments.",
        rawExtractedText: "The clinical AI engine is currently experiencing high demand."
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
