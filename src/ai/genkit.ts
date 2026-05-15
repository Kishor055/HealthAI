import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Standard Genkit 1.x Initialization.
 * We use the stable googleAI plugin for high-performance medical analysis.
 * Explicitly using gemini-2.0-flash for speed and multimodal capabilities.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.0-flash'),
});
