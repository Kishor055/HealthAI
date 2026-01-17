import { config } from 'dotenv';
config();

import '@/ai/flows/detect-drug-interactions.ts';
import '@/ai/flows/simplify-medical-terminology.ts';
import '@/ai/flows/answer-medication-questions.ts';
import '@/ai/flows/generate-safety-notes.ts';