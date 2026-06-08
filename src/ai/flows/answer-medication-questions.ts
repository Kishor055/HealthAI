
'use server';

/**
 * @fileOverview A professional medication assistant AI agent with Voice Synthesis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const AnswerMedicationQuestionsInputSchema = z.object({
  medicationList: z.string().describe('A list of the user\'s current medications.'),
  question: z.string().describe('The question the user has about their medications.'),
  generateAudio: z.boolean().optional().default(false).describe('Whether to generate voice response.'),
});

export type AnswerMedicationQuestionsInput = z.infer<typeof AnswerMedicationQuestionsInputSchema>;

const AnswerMedicationQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question.'),
  guidance: z.string().optional().describe('Additional health guidance or precautions.'),
  audioDataUri: z.string().optional().describe('Base64 WAV audio data URI of the response.'),
});

export type AnswerMedicationQuestionsOutput = z.infer<typeof AnswerMedicationQuestionsOutputSchema>;

const textPrompt = ai.definePrompt({
  name: 'answerMedicationQuestionsPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: AnswerMedicationQuestionsInputSchema },
  output: { schema: z.object({ answer: z.string(), guidance: z.string().optional() }) },
  prompt: `You are a professional medical AI assistant. 
Your goal is to help patients understand their medications based on their provided list.

Medication List: {{{medicationList}}}
User Question: {{{question}}}

Instructions:
1. Provide accurate, evidence-based answers in simple, compassionate language.
2. ALWAYS include a disclaimer that you are an AI and they should consult their doctor.
3. Keep the response concise enough for voice readout if needed.`,
});

async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', d => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

export async function answerMedicationQuestions(input: AnswerMedicationQuestionsInput): Promise<AnswerMedicationQuestionsOutput> {
  const { output } = await textPrompt(input);
  if (!output) throw new Error("Assistant failed to generate response.");

  let audioDataUri: string | undefined;

  if (input.generateAudio) {
    try {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
          },
        },
        prompt: output.answer,
      });

      if (media?.url) {
        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
      }
    } catch (e) {
      console.warn("TTS Generation failed, returning text only.", e);
    }
  }

  return {
    answer: output.answer,
    guidance: output.guidance,
    audioDataUri,
  };
}

export const answerMedicationQuestionsFlow = ai.defineFlow(
  {
    name: 'answerMedicationQuestionsFlow',
    inputSchema: AnswerMedicationQuestionsInputSchema,
    outputSchema: AnswerMedicationQuestionsOutputSchema,
  },
  async (input) => {
    return answerMedicationQuestions(input);
  }
);
