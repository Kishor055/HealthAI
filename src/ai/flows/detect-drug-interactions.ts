'use server';

/**
 * @fileOverview This flow detects potential drug interactions and duplicate therapies
 *  based on a user's current and new medications.
 *
 * - detectDrugInteractions - A function that handles the drug interaction detection process.
 * - DetectDrugInteractionsInput - The input type for the detectDrugInteractions function.
 * - DetectDrugInteractionsOutput - The return type for the detectDrugInteractions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectDrugInteractionsInputSchema = z.object({
  newMedications: z.array(
    z.string().describe('List of newly added medications (drug names).')
  ).describe('The list of new medications to check for interactions.'),
  currentMedications: z.array(
    z.string().describe('List of currently active medications (drug names).')
  ).describe('The list of current medications.'),
});
export type DetectDrugInteractionsInput = z.infer<typeof DetectDrugInteractionsInputSchema>;

const SafetyAlertSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']).describe('The priority level of the alert.'),
  message: z.string().describe('A detailed description of the safety alert.'),
});

const DetectDrugInteractionsOutputSchema = z.object({
  alerts: z.array(
    SafetyAlertSchema
  ).describe('A list of safety alerts based on potential drug interactions and duplicate therapies.'),
});
export type DetectDrugInteractionsOutput = z.infer<typeof DetectDrugInteractionsOutputSchema>;

export async function detectDrugInteractions(input: DetectDrugInteractionsInput): Promise<DetectDrugInteractionsOutput> {
  return detectDrugInteractionsFlow(input);
}

const detectDrugInteractionsPrompt = ai.definePrompt({
  name: 'detectDrugInteractionsPrompt',
  input: {schema: DetectDrugInteractionsInputSchema},
  output: {schema: DetectDrugInteractionsOutputSchema},
  prompt: `You are a highly skilled pharmacist responsible for identifying potential drug interactions and duplicate therapies.

  Analyze the following medication lists to identify any significant risks or duplicate therapies.
  Prioritize alerts based on the severity of the interaction or risk.

  Current Medications:
  {{#each currentMedications}}- {{this}}\n{{/each}}

  New Medications:
  {{#each newMedications}}- {{this}}\n{{/each}}

  Generate a list of safety alerts, including a priority (high, medium, low) and a detailed message explaining the risk.
  Be specific about potential side effects, overdose risks, and known interaction patterns.
  Do not be conversational. Only return the JSON. Example:
  {
    "alerts": [
      {
        "priority": "high",
        "message": "Combining [Drug A] and [Drug B] can lead to severe [Side Effect]. Monitor closely."
      },
      {
        "priority": "medium",
        "message": "[Drug C] may reduce the effectiveness of [Drug D]. Consider alternative medications."
      }
    ]
  }`,
});

const detectDrugInteractionsFlow = ai.defineFlow(
  {
    name: 'detectDrugInteractionsFlow',
    inputSchema: DetectDrugInteractionsInputSchema,
    outputSchema: DetectDrugInteractionsOutputSchema,
  },
  async input => {
    const {output} = await detectDrugInteractionsPrompt(input);
    return output!;
  }
);
