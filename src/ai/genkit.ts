
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Optimized Genkit initialization.
 * We prioritize Google AI for healthcare workloads due to superior multimodal 
 * reliability and medical extraction performance.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Gemini 2.0 Flash offers the best balance of speed and complex medical reasoning
  model: 'googleai/gemini-2.0-flash',
});
