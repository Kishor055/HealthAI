
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as openAIPlugin from 'genkitx-openai';

/**
 * Robustly resolve the OpenAI plugin function.
 * Some versions of the community plugin export 'openAI' as a named export, 
 * while others use a default export.
 */
const openAI = (openAIPlugin as any).openAI || (openAIPlugin as any).default || openAIPlugin;

export const ai = genkit({
  plugins: [
    googleAI(),
    // Only register OpenAI if it's successfully resolved as a function
    ...(typeof openAI === 'function' ? [openAI()] : []),
  ],
  // Defaulting to gemini-2.0-flash for high performance and multimodal reliability
  model: 'googleai/gemini-2.0-flash',
});
