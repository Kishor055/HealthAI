
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as openAIPlugin from 'genkitx-openai';

/**
 * Robustly resolve the OpenAI plugin function.
 * Some versions of the community plugin export 'openAI' as a named export, 
 * while others use a default export.
 */
const resolveOpenAI = () => {
  const plugin = (openAIPlugin as any).openAI || (openAIPlugin as any).default || openAIPlugin;
  if (typeof plugin === 'function') {
    return plugin();
  }
  console.warn('OpenAI plugin resolution failed: expected a function.');
  return null;
};

const openAIRegistry = resolveOpenAI();

export const ai = genkit({
  plugins: [
    googleAI(),
    ...(openAIRegistry ? [openAIRegistry] : []),
  ],
  // Defaulting to gemini-2.0-flash for high performance and multimodal reliability
  model: 'googleai/gemini-2.0-flash',
});
