
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI(),
  ],
  // Use gemini as default for robust multimodal support
  model: 'googleai/gemini-2.0-flash',
});
