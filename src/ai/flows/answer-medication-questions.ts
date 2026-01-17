'use server';

/**
 * @fileOverview A medication question answering AI agent.
 *
 * - answerMedicationQuestions - A function that handles answering questions about a user's medications.
 * - AnswerMedicationQuestionsInput - The input type for the answerMedicationQuestions function.
 * - AnswerMedicationQuestionsOutput - The return type for the answerMedicationQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerMedicationQuestionsInputSchema = z.object({
  medicationList: z.string().describe('A list of the user\'s current medications.'),
  question: z.string().describe('The question the user has about their medications.'),
});
export type AnswerMedicationQuestionsInput = z.infer<typeof AnswerMedicationQuestionsInputSchema>;

const AnswerMedicationQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question about their medications.'),
});
export type AnswerMedicationQuestionsOutput = z.infer<typeof AnswerMedicationQuestionsOutputSchema>;

export async function answerMedicationQuestions(input: AnswerMedicationQuestionsInput): Promise<AnswerMedicationQuestionsOutput> {
  return answerMedicationQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerMedicationQuestionsPrompt',
  input: {schema: AnswerMedicationQuestionsInputSchema},
  output: {schema: AnswerMedicationQuestionsOutputSchema},
  prompt: `You are a helpful AI assistant that answers questions about medications.

  You will be given a list of the user\'s current medications and a question about their medications.

  Use the medication list to answer the question as accurately and concisely as possible.  Avoid diagnosis and only provide medication guidance.

  Medication List: {{{medicationList}}}
  Question: {{{question}}}
  `,
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
