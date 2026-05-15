
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Optimized Genkit initialization.
 * Using the standard 1.x pattern to ensure plugin compatibility.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.0-flash'),
});
