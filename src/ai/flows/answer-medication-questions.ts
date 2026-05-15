
'use server';

/**
 * @fileOverview A professional medication assistant AI agent.
 *
 * - answerMedicationQuestions - A function that handles answering questions about a user's medications.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerMedicationQuestionsInputSchema = z.object({
  medicationList: z.string().describe('A list of the user\'s current medications.'),
  question: z.string().describe('The question the user has about their medications.'),
});
export type AnswerMedicationQuestionsInput = z.infer<typeof AnswerMedicationQuestionsInputSchema>;

const AnswerMedicationQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question.'),
  guidance: z.string().optional().describe('Additional health guidance or precautions.'),
});
export type AnswerMedicationQuestionsOutput = z.infer<typeof AnswerMedicationQuestionsOutputSchema>;

export async function answerMedicationQuestions(input: AnswerMedicationQuestionsInput): Promise<AnswerMedicationQuestionsOutput> {
  return answerMedicationQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerMedicationQuestionsPrompt',
  input: {schema: AnswerMedicationQuestionsInputSchema},
  output: {schema: AnswerMedicationQuestionsOutputSchema},
  prompt: `You are a professional medical AI assistant. 
Your goal is to help patients understand their medications based on their provided list.

Medication List: {{{medicationList}}}
User Question: {{{question}}}

Instructions:
1. Provide accurate, evidence-based answers in simple, compassionate language.
2. If asked about side effects, list the most common ones clearly.
3. If asked about dosage, refer to the provided list strictly.
4. ALWAYS include a disclaimer that you are an AI and they should consult their doctor for clinical decisions.
5. If the question is about a disease not related to their meds, provide general medical information but avoid specific diagnoses.

Guidelines:
- Tone: Professional, empathetic, clear.
- Scope: Medication management, general health queries, disease explanation.`,
});

const answerMedicationQuestionsFlow = ai.defineFlow(
  {
    name: 'answerMedicationQuestionsFlow',
    inputSchema: AnswerMedicationQuestionsInputSchema,
    outputSchema: AnswerMedicationQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
