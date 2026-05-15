import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Standard Genkit 1.x Initialization.
 * Using the stable googleAI plugin to ensure high-performance medical analysis.
 * Explicitly using gemini-2.0-flash for speed and accuracy.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.0-flash'),
});
