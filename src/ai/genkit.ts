import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Standard Genkit 1.x Initialization.
 * Using gemini-2.0-flash for high-performance medical analysis.
 * Explicitly exported for consistent application-wide usage.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.0-flash'),
});
