'use server';

/**
 * @fileOverview Genkit flow to orchestrate AI-powered OTP dispatch.
 * 
 * - dispatchOTP - Handles the logic for sending secure codes via SMS or Email.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const DispatchOTPInputSchema = z.object({
  identifier: z.string().describe("The email address or phone number to send the OTP to."),
  type: z.enum(['email', 'phone']).describe("The delivery channel."),
  otp: z.string().describe("The 6-digit verification code."),
});

export type DispatchOTPInput = z.infer<typeof DispatchOTPInputSchema>;

const DispatchOTPOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().describe("Confirmation message for the UI."),
  timestamp: z.string(),
});

export type DispatchOTPOutput = z.infer<typeof DispatchOTPOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateOTPMessagePrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: DispatchOTPInputSchema },
  output: { schema: z.object({ body: z.string() }) },
  prompt: `You are a clinical security assistant for HealthAI. 
Generate a short, professional, and clear message for a verification code.

Identifier: {{identifier}}
Code: {{otp}}
Channel: {{type}}

Instructions:
- If SMS: Keep it under 160 characters. Professional tone.
- If Email: Include a subject-line style heading.
- Focus on security and clinical trust.
- Do not add conversational filler.`,
});

export async function dispatchOTP(input: DispatchOTPInput): Promise<DispatchOTPOutput> {
  try {
    const { output } = await prompt(input);
    
    // In a real production system, you would call Twilio/Resend/SendGrid here.
    // For this prototype, we simulate the high-fidelity dispatch.
    console.log(`[AI DISPATCH] Channel: ${input.type}, To: ${input.identifier}, Message: ${output?.body}`);

    return {
      success: true,
      message: `Verification code dispatched to ${input.identifier} via AI-secured ${input.type} channel.`,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("AI OTP Dispatch failed", error);
    throw new Error("Clinical communication error. Please retry.");
  }
}

export const dispatchOTPFlow = ai.defineFlow(
  {
    name: 'dispatchOTPFlow',
    inputSchema: DispatchOTPInputSchema,
    outputSchema: DispatchOTPOutputSchema,
  },
  async (input) => {
    return dispatchOTP(input);
  }
);
