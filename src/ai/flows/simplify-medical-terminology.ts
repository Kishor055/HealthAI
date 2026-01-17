'use server';

/**
 * @fileOverview A flow to simplify medical terminology into plain language.
 *
 * - simplifyMedicalTerminology - A function that simplifies medical terms.
 * - SimplifyMedicalTerminologyInput - The input type for the simplifyMedicalTerminology function.
 * - SimplifyMedicalTerminologyOutput - The return type for the simplifyMedicalTerminology function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimplifyMedicalTerminologyInputSchema = z.object({
  medicalText: z
    .string()
    .describe("The medical terminology text to simplify, extracted from the prescription."),
  activeMedicines: z.array(z.string()).optional().describe("List of the user's active medicines for context."),
});
export type SimplifyMedicalTerminologyInput = z.infer<typeof SimplifyMedicalTerminologyInputSchema>;

const SimplifyMedicalTerminologyOutputSchema = z.object({
  simplifiedText: z
    .string()
    .describe('The simplified explanation of the medical terminology.'),
  dosageTiming: z.string().describe('Simplified explanation of dosage timing.'),
  foodInstructions: z.string().describe('Simplified instructions regarding food intake.'),
  precautions: z.string().describe('Simplified precautions related to the medication.'),
  safetyNotes: z.string().describe('Concise safety notes for the medication.'),
});
export type SimplifyMedicalTerminologyOutput = z.infer<typeof SimplifyMedicalTerminologyOutputSchema>;

export async function simplifyMedicalTerminology(
  input: SimplifyMedicalTerminologyInput
): Promise<SimplifyMedicalTerminologyOutput> {
  return simplifyMedicalTerminologyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simplifyMedicalTerminologyPrompt',
  input: {schema: SimplifyMedicalTerminologyInputSchema},
  output: {schema: SimplifyMedicalTerminologyOutputSchema},
  prompt: `You are a helpful assistant that simplifies medical terminology for patients.

  Please simplify the following medical text into plain language:
  {{medicalText}}

  Consider the following list of active medicines the patient is currently taking to provide better context:
  {{#if activeMedicines}}
  {{#each activeMedicines}}- {{{this}}}\n{{/each}}
  {{else}}
  None
  {{/if}}

  Specifically, extract and simplify the following information:
  - Dosage timing
  - Food instructions
  - Precautions
  - Concise safety notes

  Ensure the simplified text is easy to understand and provides clear instructions for the patient.
  Output must be in JSON format.
  Remember to fill out all fields of the JSON object.
  `,
});

const simplifyMedicalTerminologyFlow = ai.defineFlow(
  {
    name: 'simplifyMedicalTerminologyFlow',
    inputSchema: SimplifyMedicalTerminologyInputSchema,
    outputSchema: SimplifyMedicalTerminologyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
