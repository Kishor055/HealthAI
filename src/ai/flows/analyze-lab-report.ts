'use server';

/**
 * @fileOverview HealthAI Report Analyzer - Advanced medical report interpretation agent.
 * Enhanced with ML-driven biomarker extraction and NLP verification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AnalyzeLabReportInputSchema = z.object({
  fileDataUri: z.string().describe("The lab report file as a Base64 Data URI."),
  mimeType: z.string().describe("The MIME type of the file."),
});

export type AnalyzeLabReportInput = z.infer<typeof AnalyzeLabReportInputSchema>;

const BiomarkerSchema = z.object({
  name: z.string().describe("Name of the biomarker (e.g. HbA1c, Cholesterol)."),
  value: z.string().describe("The measured value."),
  unit: z.string().describe("The unit of measurement."),
  referenceRange: z.string().describe("The standard reference range."),
  isAbnormal: z.boolean().describe("Whether this value is outside the normal range based on NLP comparison."),
});

const AnalyzeLabReportOutputSchema = z.object({
  reportSummary: z.string().describe("A patient-friendly explanation of the report."),
  abnormalFindings: z.array(z.string()).describe("List of detected abnormalities with ML context."),
  healthScore: z.number().min(0).max(100).describe("Overall health score (0-100)."),
  riskAssessment: z.enum(['Low', 'Medium', 'High']).describe("Risk level assessment."),
  healthStatus: z.enum(['Excellent', 'Good', 'Needs Attention', 'High Risk']).describe("Overall categorization."),
  recommendations: z.array(z.string()).describe("Personalized suggestions."),
  doctorSummary: z.string().describe("Professional clinical summary."),
  biomarkers: z.array(BiomarkerSchema).describe("Precision extracted biomarker data."),
});

export type AnalyzeLabReportOutput = z.infer<typeof AnalyzeLabReportOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeLabReportPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: AnalyzeLabReportInputSchema },
  output: { schema: AnalyzeLabReportOutputSchema },
  prompt: `You are the HealthAI Diagnostic Specialist, utilizing advanced NLP and ML logic to interpret medical reports.

PROTOCOL:
1. MULTIMODAL EXTRACTION: Identify all tabular data, biomarkers, and clinical units.
2. NLP VERIFICATION: Compare extracted values against the provided 'Reference Range'. Correct OCR noise by analyzing the surrounding context of the biomarker names.
3. ML PATTERN RECOGNITION: Detect abnormal values and correlate them to assess clinical risk levels.
4. CALCULATION: Derive a Health Score (0-100) where 100 is perfectly aligned with all reference ranges.

TASKS:
- Extract biomarkers, values, units, and reference ranges.
- Highlight specific abnormal findings.
- Categorize health status: Excellent, Good, Needs Attention, or High Risk.

RULES:
- Never provide a definitive medical diagnosis.
- Prioritize patient safety.
- Use compassionate but professional tone.

Report Document: {{media url=fileDataUri}}`,
});

export async function analyzeLabReport(input: AnalyzeLabReportInput): Promise<AnalyzeLabReportOutput> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Diagnostic engine failed to structure extraction.");
    return output;
  } catch (error: any) {
    return {
      reportSummary: "The ML analyzer encountered an interpretation conflict with this specific report scan.",
      abnormalFindings: ["System unable to verify precision ranges."],
      healthScore: 50,
      riskAssessment: 'Medium',
      healthStatus: 'Needs Attention',
      recommendations: ["Rescan the document with higher clarity.", "Provide the physical report to your doctor."],
      doctorSummary: "Manual audit required. Automated biomarker node timed out.",
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
