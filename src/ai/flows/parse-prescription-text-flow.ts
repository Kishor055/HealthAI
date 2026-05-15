'use server';

/**
 * @fileOverview Genkit flow to parse and structure prescription details from raw text.
 * 
 * - parsePrescriptionText - Extracts medicine info from clinical notes or typed text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParsePrescriptionTextInputSchema = z.object({
  text: z.string().describe("The raw prescription text or clinical notes to analyze."),
});

export type ParsePrescriptionTextInput = z.infer<typeof ParsePrescriptionTextInputSchema>;

const MedicationSchema = z.object({
  name: z.string().describe("The name of the medicine."),
  dosage: z.string().describe("The strength/dosage (e.g. 10mg)."),
  frequency: z.string().describe("How often to take it."),
  instructions: z.string().describe("Specific intake instructions."),
  duration: z.string().describe("How many days/weeks to take it."),
  category: z.enum(['General', 'Asthma', 'BP', 'Diabetes', 'Heart', 'Allergy']).describe("The health category of this medication."),
});

const ParsePrescriptionTextOutputSchema = z.object({
  patientName: z.string().optional(),
  diagnosis: z.string().describe("The extracted diagnosis or condition mentioned."),
  medications: z.array(MedicationSchema),
});

export type ParsePrescriptionTextOutput = z.infer<typeof ParsePrescriptionTextOutputSchema>;

const prompt = ai.definePrompt({
  name: 'parsePrescriptionTextPrompt',
  input: { schema: ParsePrescriptionTextInputSchema },
  output: { schema: ParsePrescriptionTextOutputSchema },
  prompt: `You are an expert pharmaceutical analyst. 
Analyze the following prescription text or clinical notes.

Extract all medication details including name, dosage, frequency, and instructions. 
Identify the condition or diagnosis if mentioned. 
Categorize each medicine into one of: General, Asthma, BP, Diabetes, Heart, Allergy.

Prescription Text:
{{{text}}}`,
});

export async function parsePrescriptionText(input: ParsePrescriptionTextInput): Promise<ParsePrescriptionTextOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error("Failed to parse prescription text.");
  return output;
}

export const parsePrescriptionTextFlow = ai.defineFlow(
  {
    name: 'parsePrescriptionTextFlow',
    inputSchema: ParsePrescriptionTextInputSchema,
    outputSchema: ParsePrescriptionTextOutputSchema,
  },
  async (input) => {
    return parsePrescriptionText(input);
  }
);
