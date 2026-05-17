
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Standard Genkit 1.x Initialization.
 * Updated to gemini-2.5-flash for optimized medical analysis and higher rate limits.
 * Explicitly exported for consistent application-wide usage.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.5-flash'),
});
