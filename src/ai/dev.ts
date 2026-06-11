
import { config } from 'dotenv';
config();

import '@/ai/flows/detect-drug-interactions.ts';
import '@/ai/flows/simplify-medical-terminology.ts';
import '@/ai/flows/answer-medication-questions.ts';
import '@/ai/flows/generate-safety-notes.ts';
import '@/ai/flows/analyze-prescription-flow.ts';
import '@/ai/flows/parse-prescription-text-flow.ts';
import '@/ai/flows/analyze-health-trends.ts';
import '@/ai/flows/dispatch-otp-flow.ts';
