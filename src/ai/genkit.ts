
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as openAIPlugin from 'genkitx-openai';

// Robustly resolve the OpenAI plugin function due to potential version/export mismatches
const openAI = (openAIPlugin as any).openAI || (openAIPlugin as any).default || openAIPlugin;

export const ai = genkit({
  plugins: [
    googleAI(),
    // Only include OpenAI if it was resolved as a callable function
    ...(typeof openAI === 'function' ? [openAI()] : []),
  ],
  // Use gemini as default for robust multimodal support
  model: 'googleai/gemini-2.0-flash',
});
