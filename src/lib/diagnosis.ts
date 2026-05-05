import { safeJSON } from "./utils";

export type DiagnosisInput = {
  age: number;
  gender: string;
  bodyPart: string;
  durationDays: number;
  symptoms: string[];
  extraNotes?: string;
};

export type DiagnosisResult = {
  predicted_condition: string;
  confidence: number;
  description: string;
  possible_effects: string[];
  prevention: string[];
  solutions: string[];
  disclaimer: string;
  safety_flag: boolean;
};

type ConditionRow = {
  name: string;
  tags: string;
  typicalSymptoms: string;
  typicalLocations: string;
  chronic: boolean;
  longDescription: string;
  effects: string;
  prevention: string;
  treatmentsGeneral: string;
};

const DISCLAIMER =
  "AI-assisted suggestion only, not a medical diagnosis. Please consult a qualified dermatologist for proper evaluation.";

const DANGER_KEYWORDS = [
  "cancer",
  "melanoma",
  "tumor",
  "carcinoma",
  "spreading fast",
  "growing rapidly",
  "black spot growing",
  "bleeding mole",
  "fever with rash",
];

const SCARY_NOTE_TRIGGERS = [
  "spreading fast",
  "black spot growing",
  "growing rapidly",
  "bleeding",
  "very painful",
  "fever",
];

export function diagnose(input: DiagnosisInput, conditions: ConditionRow[]): DiagnosisResult {
  const symptomSet = new Set(input.symptoms.map((s) => s.toLowerCase()));
  const bodyPart = input.bodyPart.toLowerCase();
  const notes = (input.extraNotes || "").toLowerCase();

  let best: { row: ConditionRow; score: number } | null = null;

  for (const row of conditions) {
    const symList = safeJSON<string[]>(row.typicalSymptoms, []).map((x) => x.toLowerCase());
    const locList = safeJSON<string[]>(row.typicalLocations, []).map((x) => x.toLowerCase());

    let score = 0;
    for (const s of symList) if (symptomSet.has(s)) score += 3;
    if (locList.some((l) => bodyPart.includes(l) || l.includes(bodyPart))) score += 2;

    if (row.chronic && input.durationDays > 30) score += 2;
    if (!row.chronic && input.durationDays <= 14) score += 1;

    if (input.age < 25 && row.tags.toLowerCase().includes("acne")) score += 1;

    if (score > (best?.score ?? 0)) best = { row, score };
  }

  const fallback = conditions[0];
  const picked = best?.row ?? fallback;

  // Normalize confidence to 0.3 - 0.85
  const rawScore = best?.score ?? 0;
  const maxPossible = 12;
  let confidence = 0.3 + (Math.min(rawScore, maxPossible) / maxPossible) * 0.55;
  confidence = Math.max(0.3, Math.min(0.85, confidence));

  let predictedCondition = picked.name;
  let safetyFlag = false;

  // Safety overrides
  const nameLower = predictedCondition.toLowerCase();
  if (DANGER_KEYWORDS.some((kw) => nameLower.includes(kw))) {
    predictedCondition = "Undetermined — See Doctor";
    safetyFlag = true;
  }
  if (
    (input.durationDays > 21 && (symptomSet.has("bleeding") || symptomSet.has("ulcer"))) ||
    SCARY_NOTE_TRIGGERS.some((kw) => notes.includes(kw))
  ) {
    predictedCondition = "Undetermined — See Doctor";
    safetyFlag = true;
  }

  return {
    predicted_condition: predictedCondition,
    confidence: Number(confidence.toFixed(2)),
    description: safetyFlag
      ? "Based on what you described, we recommend consulting a dermatologist promptly. Some symptoms warrant in-person evaluation."
      : picked.longDescription,
    possible_effects: safeJSON<string[]>(picked.effects, []),
    prevention: safeJSON<string[]>(picked.prevention, []),
    solutions: safeJSON<string[]>(picked.treatmentsGeneral, []),
    disclaimer: DISCLAIMER,
    safety_flag: safetyFlag,
  };
}

export function generateRoutine(skinType: string | null | undefined, condition: string) {
  const base = (skinType || "normal").toLowerCase();
  const cond = condition.toLowerCase();

  const morning = [
    {
      step_number: 1,
      step_type: "cleanser",
      description:
        base === "oily" || cond.includes("acne")
          ? "Gentle salicylic acid cleanser"
          : "Mild hydrating cleanser",
    },
    {
      step_number: 2,
      step_type: "treatment",
      description: cond.includes("acne")
        ? "2% salicylic acid serum, thin layer"
        : cond.includes("pigment")
          ? "Vitamin C serum"
          : "Hydrating niacinamide serum",
    },
    {
      step_number: 3,
      step_type: "moisturizer",
      description: base === "dry" ? "Rich ceramide moisturizer" : "Lightweight gel moisturizer",
    },
    { step_number: 4, step_type: "sunscreen", description: "Broad-spectrum SPF 50, applied generously" },
  ];

  const night = [
    { step_number: 1, step_type: "cleanser", description: "Same gentle cleanser" },
    {
      step_number: 2,
      step_type: "treatment",
      description: cond.includes("acne")
        ? "Adapalene 0.1% (every other night to start)"
        : cond.includes("pigment")
          ? "Azelaic acid 10%"
          : "Retinol 0.25% (build up gradually)",
    },
    { step_number: 3, step_type: "moisturizer", description: "Same moisturizer, slightly thicker layer" },
  ];

  if (cond.includes("dandruff") || cond.includes("scalp")) {
    night.push({
      step_number: 4,
      step_type: "scalp_care",
      description: "Anti-dandruff shampoo (ketoconazole 1%) 2x per week",
    });
  }

  return { morning, night };
}
