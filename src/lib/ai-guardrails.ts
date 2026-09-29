/**
 * HealthAI PRO — Enterprise AI Safety Guardrails & Emergency Detection Engine
 * Ensures prompt integrity, PII protection, and deterministic emergency triage.
 */

export interface EmergencySafetyResult {
  isEmergency: boolean;
  category?: 'CARDIAC' | 'STROKE' | 'RESPIRATORY' | 'ANAPHYLAXIS' | 'CRITICAL_TRAUMA';
  matchedKeywords: string[];
  recommendedAction: string;
  emergencyNumbers: { country: string; number: string }[];
  clinicalDisclaimer: string;
}

const EMERGENCY_PATTERNS = [
  {
    category: 'CARDIAC' as const,
    regex: /\b(crushing chest pain|chest pressure radiating|pain radiating to (left )?arm|pain radiating to jaw|heart attack|cardiac arrest)\b/i,
    action: "Call Emergency Services (911 / 112 / 108) immediately. Chew and swallow an adult aspirin (325 mg) if not allergic, sit upright, and remain calm.",
  },
  {
    category: 'STROKE' as const,
    regex: /\b(face drooping|arm weakness|slurred speech|sudden facial numbness|cannot speak clearly|sudden paralysis one side|stroke)\b/i,
    action: "Call Emergency Services (911 / 112 / 108) immediately. Note the exact time symptoms started (FAST protocol: Face, Arms, Speech, Time).",
  },
  {
    category: 'RESPIRATORY' as const,
    regex: /\b(cannot breathe|unable to breathe|gasping for air|blue lips|severe stridor|respiratory arrest|choking severely)\b/i,
    action: "Call Emergency Services immediately. Use rescue bronchodilator (inhaler) if prescribed. Sit upright with chest open.",
  },
  {
    category: 'ANAPHYLAXIS' as const,
    regex: /\b(throat closing|throat swelling up|severe allergic reaction|anaphylaxis|swollen tongue cannot breathe)\b/i,
    action: "Administer Epinephrine autoinjector (EpiPen) immediately into outer thigh and call Emergency Services immediately.",
  },
  {
    category: 'CRITICAL_TRAUMA' as const,
    regex: /\b(uncontrolled arterial bleeding|coughing up large amounts of blood|loss of consciousness|unresponsive patient|suicidal ideation|want to end my life)\b/i,
    action: "Immediate emergency or crisis intervention required. Call 911 / 112 / 988 Suicide & Crisis Lifeline immediately.",
  }
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(the\s+)?(system|safety|clinical)\s+(prompt|rules|guidelines)/i,
  /you\s+are\s+now\s+(in\s+)?(unrestricted|jailbroken|developer)\s+mode/i,
  /act\s+as\s+a\s+(licensed\s+)?doctor\s+and\s+prescribe/i,
  /override\s+all\s+(medical\s+)?safety\s+filters/i,
  /bypass\s+hipaa/i,
];

export function detectPromptInjection(prompt: string): { isMalicious: boolean; reason?: string } {
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isMalicious: true,
        reason: "Request violates medical safety guardrails and prompt integrity policies.",
      };
    }
  }
  return { isMalicious: false };
}

export function maskPII(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN REDACTED]") // US SSN
    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE REDACTED]") // Phone
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL REDACTED]"); // Email
}

export function scanForMedicalEmergency(userInput: string): EmergencySafetyResult {
  const matchedKeywords: string[] = [];

  for (const item of EMERGENCY_PATTERNS) {
    const match = userInput.match(item.regex);
    if (match) {
      matchedKeywords.push(match[0]);
      return {
        isEmergency: true,
        category: item.category,
        matchedKeywords,
        recommendedAction: item.action,
        emergencyNumbers: [
          { country: "United States / Canada", number: "911" },
          { country: "European Union / UK", number: "112 / 999" },
          { country: "India", number: "112 / 108" },
        ],
        clinicalDisclaimer: "EMERGENCY INTERVENTION REQUIRED: HealthAI PRO detected life-threatening physiological indicators. Automated conversational AI is suspended. Seek professional emergency services immediately.",
      };
    }
  }

  return {
    isEmergency: false,
    matchedKeywords: [],
    recommendedAction: "Continue regular clinical inquiry.",
    emergencyNumbers: [],
    clinicalDisclaimer: "HealthAI PRO is an assistive clinical intelligence platform and does not replace evaluation by a licensed physician.",
  };
}
