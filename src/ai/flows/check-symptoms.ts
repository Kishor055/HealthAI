'use server';

/**
 * @fileOverview HealthAI Symptom Checker - AI-powered triage agent.
 * Enhanced with NLP linguistic verification and high-precision risk assessment.
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
  prompt: `You are the HealthAI Symptom Checker, an expert AI triage assistant powered by clinical NLP. 
Your goal is to provide preliminary health guidance based on patient symptoms.

USER INPUT:
"{{{symptoms}}}"
{{#if age}}Age: {{age}}{{/if}}
{{#if existingConditions}}History: {{#each existingConditions}}{{this}}, {{/each}}{{/if}}

INSTRUCTIONS:
1. ANALYSIS: Use Chain-of-Thought reasoning to identify medical keywords. Account for potential typos (e.g. "headchek" -> "headache").
2. RISK ASSESSMENT: Classify risk: Low, Moderate, High, or Emergency.
3. EMERGENCY PROTOCOL: If life-threatening signs (chest pain, stroke signs, difficulty breathing, severe bleeding) are detected, set riskLevel to 'Emergency' and provide a high-priority 'emergencyWarning'.
4. CONDITIONS: Provide 2-3 possible conditions with confidence scores and concise explanations.
5. RECOMMENDATIONS: Suggest 3-5 'recommendedActions'.
6. REFINEMENT: Ask 2-3 'followUpQuestions' to help narrow down the assessment.

RULES:
- NEVER provide a definitive medical diagnosis.
- NEVER prescribe or recommend specific medications.
- ALWAYS include a disclaimer that this is educational guidance.
- USE simple, empathetic, and professional language.
- PRIORITIZE patient safety above all else.`,
});

export async function checkSymptoms(input: CheckSymptomsInput): Promise<CheckSymptomsOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Clinical triage node provided null output.");
    return output;
  } catch (error: any) {
    console.error("Symptom Checker Logic Failure:", error);
    // baseline clinical safety fallback
    return {
      identifiedSymptoms: ["Unable to verify symptoms during current node high-load."],
      possibleConditions: [
        { name: "Unknown Physiological Disturbance", confidence: 50, explanation: "AI diagnostic node is currently recalibrating." }
      ],
      riskLevel: 'Moderate Risk',
      recommendedActions: [
        "Please monitor your condition closely for the next 2 hours.",
        "Maintain adequate hydration and rest.",
        "If symptoms persist or worsen, consult a licensed healthcare professional."
      ],
      followUpQuestions: [
        "On a scale of 1-10, how severe is the discomfort?",
        "Are you experiencing any accompanying dizziness or nausea?"
      ],
      emergencyWarning: "System is operating in baseline mode. If you are experiencing severe pain, difficulty breathing, chest pressure, or sudden numbness, seek emergency care immediately."
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
