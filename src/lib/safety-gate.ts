/**
 * HealthAI PRO — Deterministic Drug Safety Gate
 * Rule-based clinical interaction decision engine.
 * Cross-references active medications before generative AI is invoked.
 */

import { DrugInteractionWarning } from "@/types/medical";

// Normalization dictionary: common brand/formulation to generic root
const DRUG_NORMALIZATION_MAP: Record<string, string> = {
  coumadin: "warfarin",
  jantoven: "warfarin",
  ecotrin: "aspirin",
  bayer: "aspirin",
  advil: "ibuprofen",
  motrin: "ibuprofen",
  aleve: "naproxen",
  zestril: "lisinopril",
  prinivil: "lisinopril",
  aldactone: "spironolactone",
  glucophage: "metformin",
  lipitor: "atorvastatin",
  zocor: "simvastatin",
  biaxin: "clarithromycin",
  prozac: "fluoxetine",
  ultram: "tramadol",
  lanoxin: "digoxin",
  cordarone: "amiodarone",
  synthroid: "levothyroxine",
};

export const DETERMINISTIC_DDI_RULES: DrugInteractionWarning[] = [
  {
    drugs: ["warfarin", "aspirin"],
    severity: "HIGH",
    mechanism: "Additive antiplatelet and anticoagulant effects significantly amplify internal hemorrhage and gastrointestinal bleeding risk.",
    clinicalAction: "Avoid concurrent use unless specifically titrated under strict PT/INR hematological monitoring.",
    sourceCitation: "American College of Chest Physicians (CHEST) Antithrombotic Guidelines 2021",
    category: "Hematology / Anticoagulation"
  },
  {
    drugs: ["warfarin", "ibuprofen"],
    severity: "HIGH",
    mechanism: "NSAIDs inhibit platelet cyclooxygenase-1 and induce gastric mucosal erosion, creating high-risk bleeding synergism with warfarin.",
    clinicalAction: "Contraindicated. Substitute with acetaminophen for mild-to-moderate analgesia under physician oversight.",
    sourceCitation: "FDA Drug Safety Communication / Beers Criteria",
    category: "Hematology / Rheumatology"
  },
  {
    drugs: ["lisinopril", "spironolactone"],
    severity: "HIGH",
    mechanism: "Dual suppression of aldosterone and renal potassium excretion leads to dangerous hyperkalemia and cardiac arrhythmia.",
    clinicalAction: "Routinely verify serum potassium and renal function within 7 days of co-prescription.",
    sourceCitation: "AHA/ACC Heart Failure Management Guidelines",
    category: "Cardiology / Nephrology"
  },
  {
    drugs: ["atorvastatin", "clarithromycin"],
    severity: "HIGH",
    mechanism: "Clarithromycin strongly inhibits hepatic CYP3A4 metabolism, causing multi-fold elevation in statin concentrations and acute rhabdomyolysis.",
    clinicalAction: "Temporarily withhold atorvastatin during clarithromycin antibiotic therapy, or switch to azithromycin.",
    sourceCitation: "National Lipid Association Clinical Recommendations",
    category: "Cardiology / Infectious Disease"
  },
  {
    drugs: ["fluoxetine", "tramadol"],
    severity: "HIGH",
    mechanism: "Combined serotonergic stimulation can trigger life-threatening Serotonin Syndrome and substantially lower seizure threshold.",
    clinicalAction: "Avoid co-administration. Select an alternative non-serotonergic analgesic.",
    sourceCitation: "World Health Organization Safe Pain Management Guidelines",
    category: "Neurology / Psychiatry"
  },
  {
    drugs: ["digoxin", "amiodarone"],
    severity: "HIGH",
    mechanism: "Amiodarone inhibits P-glycoprotein efflux, increasing serum digoxin levels by 70-100%, causing fatal digitalis toxicity.",
    clinicalAction: "Reduce digoxin dose by 50% upon initiating amiodarone and monitor ECG rhythm.",
    sourceCitation: "ACC/AHA/ESC Guidelines for Management of Arrhythmias",
    category: "Cardiology"
  },
  {
    drugs: ["metformin", "glipizide"],
    severity: "MODERATE",
    mechanism: "Synergistic hypoglycemic effect if caloric intake is reduced or kidney clearance fluctuates.",
    clinicalAction: "Educate patient on hypoglycemia warning signs (tremor, diaphoresis, confusion) and glucose monitoring.",
    sourceCitation: "American Diabetes Association (ADA) Standards of Care",
    category: "Endocrinology"
  },
  {
    drugs: ["levothyroxine", "calcium"],
    severity: "MODERATE",
    mechanism: "Calcium carbonate binds levothyroxine in the gastrointestinal tract, impairing thyroid hormone absorption.",
    clinicalAction: "Space administration by at least 4 hours between levothyroxine and calcium/iron supplements.",
    sourceCitation: "American Thyroid Association Clinical Protocols",
    category: "Endocrinology"
  }
];

export function normalizeDrugName(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const tokens = clean.split(/\s+/);
  for (const token of tokens) {
    if (DRUG_NORMALIZATION_MAP[token]) {
      return DRUG_NORMALIZATION_MAP[token];
    }
    // Check direct matches in DDI rules
    for (const rule of DETERMINISTIC_DDI_RULES) {
      if (rule.drugs.includes(token)) {
        return token;
      }
    }
  }
  return tokens[0] || "unknown";
}

export interface SafetyCheckResult {
  isSafe: boolean;
  overallSeverity: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH';
  safetyScore: number; // 0-100
  conflicts: DrugInteractionWarning[];
  duplicateTherapies: string[];
  deterministicSummary: string;
}

export function evaluateMedicationSafety(medications: string[]): SafetyCheckResult {
  const normalized = medications.map(m => ({ original: m, key: normalizeDrugName(m) })).filter(m => m.key !== "unknown");
  const conflicts: DrugInteractionWarning[] = [];
  const duplicates: string[] = [];

  // Check for duplicates
  const seen = new Set<string>();
  for (const med of normalized) {
    if (seen.has(med.key)) {
      duplicates.push(med.original);
    }
    seen.add(med.key);
  }

  // Check pair interactions
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const drugA = normalized[i].key;
      const drugB = normalized[j].key;

      for (const rule of DETERMINISTIC_DDI_RULES) {
        const hasA = rule.drugs.includes(drugA);
        const hasB = rule.drugs.includes(drugB);
        if (hasA && hasB && drugA !== drugB) {
          conflicts.push(rule);
        }
      }
    }
  }

  const highCount = conflicts.filter(c => c.severity === "HIGH").length;
  const modCount = conflicts.filter(c => c.severity === "MODERATE").length;

  let overallSeverity: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' = 'SAFE';
  if (highCount > 0) overallSeverity = 'HIGH';
  else if (modCount > 0 || duplicates.length > 0) overallSeverity = 'MODERATE';
  else if (conflicts.length > 0) overallSeverity = 'LOW';

  const safetyScore = Math.max(10, 100 - (highCount * 35) - (modCount * 15) - (duplicates.length * 20));

  const summary = conflicts.length > 0
    ? `Deterministic safety engine identified ${highCount} high-risk interaction(s) and ${modCount} moderate interaction(s) across ${medications.length} therapies.`
    : `All ${medications.length} evaluated therapies cleared the deterministic clinical interaction screen with zero severe contraindications.`;

  return {
    isSafe: highCount === 0 && duplicates.length === 0,
    overallSeverity,
    safetyScore,
    conflicts,
    duplicateTherapies: duplicates,
    deterministicSummary: summary,
  };
}
