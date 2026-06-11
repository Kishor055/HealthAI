
'use server';

/**
 * @fileOverview HealthAI Report Analyzer - Advanced medical report interpretation agent.
 *
 * - analyzeLabReport - Handles extraction, abnormal detection, and scoring of lab results.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AnalyzeLabReportInputSchema = z.object({
  fileDataUri: z.string().describe("The lab report file as a Base64 Data URI."),
  mimeType: z.string().describe("The MIME type of the file (e.g., image/jpeg, application/pdf)."),
});

export type AnalyzeLabReportInput = z.infer<typeof AnalyzeLabReportInputSchema>;

const BiomarkerSchema = z.object({
  name: z.string().describe("Name of the biomarker (e.g. HbA1c, Cholesterol)."),
  value: z.string().describe("The measured value."),
  unit: z.string().describe("The unit of measurement."),
  referenceRange: z.string().describe("The standard reference range for comparison."),
  isAbnormal: z.boolean().describe("Whether this value is outside the normal range."),
});

const AnalyzeLabReportOutputSchema = z.object({
  reportSummary: z.string().describe("A simple, patient-friendly explanation of the report."),
  abnormalFindings: z.array(z.string()).describe("A list of detected abnormal results with context."),
  healthScore: z.number().min(0).max(100).describe("An overall health score based on findings (0-100)."),
  riskAssessment: z.enum(['Low', 'Medium', 'High']).describe("Risk level assessment."),
  healthStatus: z.enum(['Excellent', 'Good', 'Needs Attention', 'High Risk']).describe("Overall categorization."),
  recommendations: z.array(z.string()).describe("Personalized, safe suggestions for lifestyle or follow-up."),
  doctorSummary: z.string().describe("A professional, doctor-ready clinical summary."),
  biomarkers: z.array(BiomarkerSchema).describe("Extracted biomarker data."),
});

export type AnalyzeLabReportOutput = z.infer<typeof AnalyzeLabReportOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeLabReportPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: AnalyzeLabReportInputSchema },
  output: { schema: AnalyzeLabReportOutputSchema },
  prompt: `You are the HealthAI Report Analyzer, an advanced medical report interpretation AI. 
Your primary responsibility is to analyze the provided medical report and convert complex data into clear insights.

SUPPORTED TYPES: Blood Tests (CBC, Lipid, LFT, KFT), Thyroid, Diabetes, ECG, Vitamins.

TASKS:
1. Extract biomarkers, values, units, and reference ranges.
2. Detect abnormal values by comparing them against the standard ranges provided in the report.
3. Calculate an overall Health Score (0-100) where 100 is perfectly healthy.
4. Provide a 'reportSummary' for a patient (simple terms).
5. Provide a 'doctorSummary' for a physician (clinical terms).
6. Categorize status: Excellent, Good, Needs Attention, or High Risk.

RULES:
- Never provide a definitive diagnosis.
- Never prescribe medications.
- ALWAYS recommend consulting a qualified healthcare professional.
- Prioritize patient safety and use empathetic but professional language.

Report Document: {{media url=fileDataUri}}`,
});

export async function analyzeLabReport(input: AnalyzeLabReportInput): Promise<AnalyzeLabReportOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Diagnostic engine returned empty analysis.");
    return output;
  } catch (error: any) {
    console.error("Lab Report Analysis Error:", error);
    // Safety baseline fallback for errors
    return {
      reportSummary: "The AI analyzer encountered an interpretation conflict with this specific scan format.",
      abnormalFindings: ["System unable to verify ranges with 100% precision."],
      healthScore: 50,
      riskAssessment: 'Medium',
      healthStatus: 'Needs Attention',
      recommendations: ["Please rescan with higher clarity.", "Provide the physical copy to your doctor."],
      doctorSummary: "Manual audit required. Automated biomarker extraction node timed out.",
      biomarkers: [],
    };
  }
}

export const analyzeLabReportFlow = ai.defineFlow(
  {
    name: 'analyzeLabReportFlow',
    inputSchema: AnalyzeLabReportInputSchema,
    outputSchema: AnalyzeLabReportOutputSchema,
  },
  async (input) => {
    return analyzeLabReport(input);
  }
);
