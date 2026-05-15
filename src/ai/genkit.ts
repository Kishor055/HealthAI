import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Standard Genkit 1.x Initialization.
 * Using gemini-2.0-flash for high-performance medical analysis.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.0-flash'),
});
