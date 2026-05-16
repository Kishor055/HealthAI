'use server';

/**
 * @fileOverview Multimodal Genkit flow to analyze prescription images or PDFs.
 * 
 * - analyzePrescription - Extracts medicine info from images/documents.
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
  rawExtractedText: z.string().describe("All text found in the document."),
});

export type AnalyzePrescriptionOutput = z.infer<typeof AnalyzePrescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzePrescriptionPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: AnalyzePrescriptionInputSchema },
  output: { schema: AnalyzePrescriptionOutputSchema },
  prompt: `You are an expert medical OCR and pharmaceutical analyzer. 
Analyze the provided prescription document carefully. 

Extract all medication details including name, dosage, frequency, and instructions. 
Identify the condition or diagnosis if present. 
Categorize each medicine into one of: General, Asthma, BP, Diabetes, Heart, Allergy.

Prescription Document: {{media url=fileDataUri}}`,
});

export async function analyzePrescription(input: AnalyzePrescriptionInput): Promise<AnalyzePrescriptionOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error("Failed to analyze prescription.");
  return output;
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
