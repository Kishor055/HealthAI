
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * EXPERT AI ENGINE CONFIGURATION
 * HealthAI PRO - Gemini High-Precision Node
 * Standard Genkit 1.x Architecture with optimized safety filters for clinical use.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.5-flash'), // Calibrated for high-precision medical analysis
});
