export type Signals = {
  recall: number;
  fpr: number;
  flaggedRate: number;
  patternCoverage: number;
  precision: number;
  drift: "Yes" | "No";
  system: "OK" | "Not OK";
};

export type DecisionTag =
  | "STILL VALID (GO)"
  | "RE-TRAIN MODEL"
  | "TUNE THRESHOLD / SENSITIVITY"
  | "OPTIMIZE SYSTEM / RESOURCE"
  | "EMERGENCY ROLLBACK";

export type DecisionTone = "green" | "yellow" | "orange" | "red";
export type Confidence = "High" | "Medium" | "Low";

export type RuleId = "Rule 1" | "Rule 2" | "Rule 3" | "Rule 4" | "Rule 5";

export type Condition = {
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export type Decision = {
  tag: DecisionTag;
  tone: DecisionTone;
  rule: RuleId;
  confidence: Confidence;
  explanation: string;
  plain: string;
  conditions: Condition[];
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export function evaluate(s: Signals): Decision {
  const conditions: Condition[] = [
    { label: "Recall ≥ 85%", expected: "≥ 85%", actual: fmtPct(s.recall), passed: s.recall >= 85 },
    { label: "FPR ≤ 20%", expected: "≤ 20%", actual: fmtPct(s.fpr), passed: s.fpr <= 20 },
    { label: "Flagged Rate ≤ 5%", expected: "≤ 5%", actual: fmtPct(s.flaggedRate), passed: s.flaggedRate <= 5 },
    { label: "Pattern Coverage ≥ 80%", expected: "≥ 80%", actual: fmtPct(s.patternCoverage), passed: s.patternCoverage >= 80 },
    { label: "Precision ≥ 30%", expected: "≥ 30%", actual: fmtPct(s.precision), passed: s.precision >= 30 },
    { label: "Drift = No", expected: "No", actual: s.drift, passed: s.drift === "No" },
    { label: "System = OK", expected: "OK", actual: s.system, passed: s.system === "OK" },
  ];

  // Rule 5 — Emergency Rollback
  if (s.drift === "Yes" && (s.recall < 50 || s.patternCoverage < 50 || s.precision < 10)) {
    return {
      tag: "EMERGENCY ROLLBACK",
      tone: "red",
      rule: "Rule 5",
      confidence: "High",
      explanation:
        "The model is drifting and a core capability has collapsed. Roll back to the last known-good model immediately.",
      plain:
        "The model is no longer reliable enough to keep running. Switch back to the previous version while the team investigates.",
      conditions,
    };
  }

  // Rule 2 — Retrain
  if (s.drift === "Yes" && (s.recall < 85 || s.patternCoverage < 80 || s.precision < 30)) {
    const offenders: string[] = [];
    if (s.recall < 85) offenders.push("detection has slipped");
    if (s.patternCoverage < 80) offenders.push("we are missing known patterns");
    if (s.precision < 30) offenders.push("too many alerts are not real risks");
    const offendersCount = [s.recall < 85, s.patternCoverage < 80, s.precision < 30].filter(Boolean).length;
    return {
      tag: "RE-TRAIN MODEL",
      tone: "orange",
      rule: "Rule 2",
      confidence: offendersCount >= 2 ? "High" : "Medium",
      explanation:
        "Drift is present and at least one detection KPI has dropped below its target — retraining is required to restore coverage.",
      plain:
        `Patterns of laundering have shifted and ${offenders.join(" and ")}. Retrain the model on recent data to recover.`,
      conditions,
    };
  }

  // Rule 3 — Tune threshold / sensitivity
  if (
    s.drift === "No" &&
    s.recall >= 85 &&
    s.patternCoverage >= 80 &&
    s.fpr > 20 &&
    s.flaggedRate > 5 &&
    s.precision < 30
  ) {
    return {
      tag: "TUNE THRESHOLD / SENSITIVITY",
      tone: "yellow",
      rule: "Rule 3",
      confidence: "High",
      explanation:
        "Detection and coverage are healthy, but workload and alert quality are off — tune the decision threshold before any model change.",
      plain:
        "The model is finding the right things, but it is also flagging too much normal traffic. Raising the threshold should fix that without retraining.",
      conditions,
    };
  }

  // Rule 4 — Optimize system / resource
  if (
    s.drift === "No" &&
    s.recall >= 85 &&
    s.fpr <= 20 &&
    s.flaggedRate <= 5 &&
    s.patternCoverage >= 80 &&
    s.precision >= 30 &&
    s.system === "Not OK"
  ) {
    return {
      tag: "OPTIMIZE SYSTEM / RESOURCE",
      tone: "yellow",
      rule: "Rule 4",
      confidence: "Medium",
      explanation:
        "All model KPIs are within target, but the operational system is degraded — investigate infrastructure and resource utilization.",
      plain:
        "The model is fine, but the system running it is struggling. Check infra, queues, and resource limits.",
      conditions,
    };
  }

  // Rule 1 — Still valid
  if (
    s.recall >= 85 &&
    s.fpr <= 20 &&
    s.flaggedRate <= 5 &&
    s.patternCoverage >= 80 &&
    s.precision >= 30 &&
    s.drift === "No" &&
    s.system === "OK"
  ) {
    return {
      tag: "STILL VALID (GO)",
      tone: "green",
      rule: "Rule 1",
      confidence: "High",
      explanation: "All KPIs are within target. The current model and threshold remain acceptable for production use.",
      plain: "Everything is in the green. Keep using the model as-is.",
      conditions,
    };
  }

  // Fallback — default to retraining recommendation if no clean rule matched
  return {
    tag: "TUNE THRESHOLD / SENSITIVITY",
    tone: "yellow",
    rule: "Rule 3",
    confidence: "Low",
    explanation: "KPI signals are mixed and do not match a clean rule — start with a threshold adjustment and re-evaluate.",
    plain:
      "The signals are mixed. Start by adjusting the threshold and watch how the KPIs respond before doing anything bigger.",
    conditions,
  };
}

export const toneClasses: Record<DecisionTone, { badge: string; ring: string; bg: string; text: string; bar: string; soft: string }> = {
  green: {
    badge: "bg-emerald-600 text-white",
    ring: "ring-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    soft: "border-emerald-200",
  },
  yellow: {
    badge: "bg-amber-500 text-white",
    ring: "ring-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    bar: "bg-amber-500",
    soft: "border-amber-200",
  },
  orange: {
    badge: "bg-orange-600 text-white",
    ring: "ring-orange-200",
    bg: "bg-orange-50",
    text: "text-orange-700",
    bar: "bg-orange-500",
    soft: "border-orange-200",
  },
  red: {
    badge: "bg-rose-600 text-white",
    ring: "ring-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-700",
    bar: "bg-rose-500",
    soft: "border-rose-200",
  },
};
