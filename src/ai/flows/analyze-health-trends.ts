'use server';

/**
 * @fileOverview Genkit flow to analyze biometric health trends and medication stability.
 * 
 * - analyzeHealthTrends - Evaluates vitals and returns a stability index and clinical insight.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const HealthTrendInputSchema = z.object({
  vitals: z.array(z.object({
    type: z.string(),
    value: z.string(),
    date: z.string(),
  })).describe("The user's recent biometric records."),
  activeMedications: z.array(z.string()).describe("List of medications currently being taken."),
});

export type HealthTrendInput = z.infer<typeof HealthTrendInputSchema>;

const HealthTrendOutputSchema = z.object({
  stabilityIndex: z.number().min(0).max(100).describe("A calculated stability score from 0-100."),
  trendInsight: z.string().describe("A concise clinical insight about the user's health trends."),
  riskLevel: z.enum(['low', 'medium', 'high']).describe("The calculated risk level based on vitals."),
  recommendation: z.string().describe("A professional health recommendation."),
});

export type HealthTrendOutput = z.infer<typeof HealthTrendOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeHealthTrendsPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: HealthTrendInputSchema },
  output: { schema: HealthTrendOutputSchema },
  prompt: `You are a clinical data scientist. Analyze the following health data.

Vitals:
{{#each vitals}}
- {{type}}: {{value}} on {{date}}
{{/each}}

Active Medications:
{{#each activeMedications}}
- {{this}}
{{/each}}

Instructions:
1. Calculate a "Stability Index" (0-100) based on the consistency of the vitals.
2. Provide a concise clinical insight (max 2 sentences).
3. Determine if the current biometric trends pose a risk (low, medium, or high).
4. Provide one actionable recommendation.

Tone: Professional, clinical, and data-driven.`,
});

export async function analyzeHealthTrends(input: HealthTrendInput): Promise<HealthTrendOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error("Failed to analyze health trends.");
  return output;
}

export const analyzeHealthTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeHealthTrendsFlow',
    inputSchema: HealthTrendInputSchema,
    outputSchema: HealthTrendOutputSchema,
  },
  async (input) => {
    return analyzeHealthTrends(input);
  }
);
