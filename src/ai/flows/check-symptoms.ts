
'use server';

/**
 * @fileOverview HealthAI Symptom Checker - AI-powered triage agent.
 *
 * - checkSymptoms - Analyzes user input to provide preliminary health guidance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const CheckSymptomsInputSchema = z.object({
  symptoms: z.string().describe("The user's description of their current symptoms."),
  age: z.number().optional().describe("User's age for context."),
  existingConditions: z.array(z.string()).optional().describe("Known medical history."),
});

export type CheckSymptomsInput = z.infer<typeof CheckSymptomsInputSchema>;

const ConditionSchema = z.object({
  name: z.string().describe("Name of the possible condition."),
  confidence: z.number().min(0).max(100).describe("Confidence score (0-100)."),
  explanation: z.string().describe("Why this condition is a possibility."),
});

const CheckSymptomsOutputSchema = z.object({
  identifiedSymptoms: z.array(z.string()).describe("List of symptoms identified from user input."),
  possibleConditions: z.array(ConditionSchema).describe("List of possible conditions with confidence scores."),
  riskLevel: z.enum(['Low Risk', 'Moderate Risk', 'High Risk', 'Emergency']).describe("Severity assessment."),
  recommendedActions: z.array(z.string()).describe("List of prioritized next steps."),
  followUpQuestions: z.array(z.string()).describe("Intelligent questions to narrow down the triage."),
  emergencyWarning: z.string().optional().describe("High-priority alert if life-threatening symptoms are detected."),
});

export type CheckSymptomsOutput = z.infer<typeof CheckSymptomsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'checkSymptomsPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: CheckSymptomsInputSchema },
  output: { schema: CheckSymptomsOutputSchema },
  prompt: `You are the HealthAI Symptom Checker, an expert AI triage assistant. 
Your goal is to provide preliminary health guidance based on patient symptoms.

USER INPUT:
"{{{symptoms}}}"
{{#if age}}Age: {{age}}{{/if}}
{{#if existingConditions}}History: {{#each existingConditions}}{{this}}, {{/each}}{{/if}}

INSTRUCTIONS:
1. Analyze the provided symptoms with clinical precision.
2. Identify symptoms and classify risk: Low, Moderate, High, or Emergency.
3. If life-threatening signs (e.g. chest pain, stroke signs) are found, set riskLevel to 'Emergency' and provide an 'emergencyWarning'.
4. Provide possible conditions with confidence scores.
5. Suggest 3-5 'recommendedActions'.
6. Ask 'followUpQuestions' to help a doctor or the AI refine the assessment.

RULES:
- Never diagnose with absolute certainty.
- Never prescribe specific medications.
- Always include the standard clinical disclaimer.
- Prioritize patient safety above all else.
- Use simple, empathetic, and professional language.`,
});

export async function checkSymptoms(input: CheckSymptomsInput): Promise<CheckSymptomsOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Clinical triage node timed out.");
    return output;
  } catch (error: any) {
    console.error("Symptom Checker Error:", error);
    // Baseline safety fallback
    return {
      identifiedSymptoms: ["Unable to verify symptoms during current node high-load."],
      possibleConditions: [],
      riskLevel: 'Moderate Risk',
      recommendedActions: ["Please monitor your condition closely.", "If symptoms persist, consult a doctor."],
      followUpQuestions: ["Can you describe the pain in more detail?", "When did this start?"],
      emergencyWarning: "System is operating in offline mode. If you are experiencing severe pain, difficulty breathing, or dizziness, seek emergency care immediately."
    };
  }
}

export const checkSymptomsFlow = ai.defineFlow(
  {
    name: 'checkSymptomsFlow',
    inputSchema: CheckSymptomsInputSchema,
    outputSchema: CheckSymptomsOutputSchema,
  },
  async (input) => {
    return checkSymptoms(input);
  }
);
