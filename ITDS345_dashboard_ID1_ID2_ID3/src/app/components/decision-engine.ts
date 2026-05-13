export type MetricInputs = {
  mcc: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
};

export type PatternInputs = {
  graphDensity: number;
  nodeCentrality: number;
  motifSimilarity: number;
};

export type FeatureInputs = {
  featureImportance: number;
  edgeWeights: number;
  learningRate: number;
  treeDepth: number;
};

export type DataQualityInputs = {
  missingPct: number;
  labelImbalance: number;
  psi: number;
};

export type SystemInputs = {
  throughput: number;
  latencyMs: number;
  cpuRamUsage: number;
};

export type AllSignals = MetricInputs &
  PatternInputs &
  FeatureInputs &
  DataQualityInputs &
  SystemInputs;

export type DecisionAction =
  | "Still_Valid_GO"
  | "Retrain_Model"
  | "Tune_Model"
  | "Optimize_System";

export type DecisionTone = "green" | "yellow" | "orange" | "red";
export type Confidence = "High" | "Medium" | "Low";
export type RuleId =
  | "Rule 1"
  | "Rule 2"
  | "Rule 3"
  | "Rule 4"
  | "Rule 5"
  | "Rule 6"
  | "Rule 7"
  | "Rule 8";

export type Condition = {
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export type RuleTrace = {
  metricStability: { result: "Pass" | "Fail"; triggeredRule: string; details: string };
  patternLogic: { result: "Normal" | "Changed"; triggeredRule: string; details: string };
  featurePower: { result: "Good" | "Bad"; triggeredRule: string; details: string };
  dataQuality: { result: "Good" | "Bad"; triggeredRule: string; details: string };
  systemEfficiency: { result: "OK" | "Critical"; triggeredRule: string; details: string };
  conceptDrift: { result: "Stable" | "Drifted"; triggeredRule: string; details: string };
  dataDrift: { result: "Stable" | "Drifted"; triggeredRule: string; details: string };
};

export type Decision = {
  action: DecisionAction;
  tag: string;
  tone: DecisionTone;
  rule: RuleId;
  ruleId: string;
  confidence: Confidence;
  explanation: string;
  plain: string;
  conditions: Condition[];
};

export type Evaluation = { decision: Decision; trace: RuleTrace };

export type IntentId =
  | "metric_status"
  | "pattern_check"
  | "feature_check"
  | "data_quality"
  | "system_check"
  | "concept_drift"
  | "data_drift"
  | "recommendation"
  | "explain"
  | "help"
  | "fallback";

export type ChatResponse = {
  intent: IntentId;
  title: string;
  message: string;
  details?: string[];
  followups?: string[];
};

const fmtRatio = (n: number, digits = 2) => n.toFixed(digits);
const inRange = (n: number, min: number, max: number) => n >= min && n <= max;

const ACTION_LABELS: Record<DecisionAction, string> = {
  Still_Valid_GO: "STILL VALID (GO)",
  Retrain_Model: "RETRAIN MODEL",
  Tune_Model: "TUNE MODEL",
  Optimize_System: "OPTIMIZE SYSTEM",
};

const ACTION_TONE: Record<DecisionAction, DecisionTone> = {
  Still_Valid_GO: "green",
  Retrain_Model: "orange",
  Tune_Model: "yellow",
  Optimize_System: "yellow",
};

function metricStabilityTrace(s: AllSignals): RuleTrace["metricStability"] {
  const failures: string[] = [];
  if (s.mcc < 0.6) failures.push(`MCC ${fmtRatio(s.mcc)} < 0.60`);
  if (s.precision < 0.86) failures.push(`Precision ${fmtRatio(s.precision)} < 0.86`);
  if (s.recall < 0.85) failures.push(`Recall ${fmtRatio(s.recall)} < 0.85`);
  if (s.f1 < 0.82) failures.push(`F1 ${fmtRatio(s.f1)} < 0.82`);
  if (s.accuracy < 0.8) failures.push(`Accuracy ${fmtRatio(s.accuracy)} < 0.80`);

  if (failures.length === 0) {
    return {
      result: "Pass",
      triggeredRule: "rule-1-1",
      details: "All metric thresholds met.",
    };
  }

  if (s.mcc < 0.6) {
    return { result: "Fail", triggeredRule: "rule-1-2", details: failures.join("; ") };
  }
  if (s.precision < 0.86) {
    return { result: "Fail", triggeredRule: "rule-1-3", details: failures.join("; ") };
  }
  if (s.recall < 0.85) {
    return { result: "Fail", triggeredRule: "rule-1-4", details: failures.join("; ") };
  }
  if (s.f1 < 0.82) {
    return { result: "Fail", triggeredRule: "rule-1-5", details: failures.join("; ") };
  }
  return { result: "Fail", triggeredRule: "rule-1-6", details: failures.join("; ") };
}

function patternLogicTrace(s: AllSignals): RuleTrace["patternLogic"] {
  const densityOk = inRange(s.graphDensity, 0.1, 0.6);
  const centralityOk = s.nodeCentrality > 0.4;
  const motifOk = s.motifSimilarity > 0.6;
  const details = [
    `Graph Density ${fmtRatio(s.graphDensity)} ${densityOk ? "in" : "out of"} range 0.10-0.60`,
    `Node Centrality ${fmtRatio(s.nodeCentrality)} ${centralityOk ? ">" : "<="} 0.40`,
    `Motif Similarity ${fmtRatio(s.motifSimilarity)} ${motifOk ? ">" : "<="} 0.60`,
  ].join("; ");

  if (densityOk && centralityOk && motifOk) {
    return { result: "Normal", triggeredRule: "rule-2-1", details };
  }
  if (!densityOk) {
    return { result: "Changed", triggeredRule: "rule-2-2", details };
  }
  if (!centralityOk) {
    return { result: "Changed", triggeredRule: "rule-2-3", details };
  }
  return { result: "Changed", triggeredRule: "rule-2-4", details };
}

function featurePowerTrace(s: AllSignals): RuleTrace["featurePower"] {
  const importanceOk = s.featureImportance > 0.05;
  const edgeOk = s.edgeWeights > 0.3;
  const lrOk = inRange(s.learningRate, 0.001, 0.01);
  const depthOk = inRange(s.treeDepth, 3, 8);
  const details = [
    `Feature Importance ${fmtRatio(s.featureImportance)} ${importanceOk ? ">" : "<="} 0.05`,
    `Edge Weights ${fmtRatio(s.edgeWeights)} ${edgeOk ? ">" : "<="} 0.30`,
    `Learning Rate ${fmtRatio(s.learningRate, 4)} ${lrOk ? "in" : "out of"} 0.001-0.01`,
    `Tree Depth ${fmtRatio(s.treeDepth)} ${depthOk ? "in" : "out of"} 3-8`,
  ].join("; ");

  if (importanceOk && edgeOk && lrOk && depthOk) {
    return { result: "Good", triggeredRule: "rule-3-1", details };
  }
  if (!importanceOk) {
    return { result: "Bad", triggeredRule: "rule-3-2", details };
  }
  if (!edgeOk) {
    return { result: "Bad", triggeredRule: "rule-3-3", details };
  }
  if (!lrOk) {
    return { result: "Bad", triggeredRule: "rule-3-4", details };
  }
  return { result: "Bad", triggeredRule: "rule-3-5", details };
}

function dataQualityTrace(s: AllSignals): RuleTrace["dataQuality"] {
  const missingOk = s.missingPct < 0.05;
  const imbalanceOk = s.labelImbalance < 10;
  const psiOk = s.psi < 0.1;
  const details = [
    `Missing % ${fmtRatio(s.missingPct)} ${missingOk ? "<" : ">="} 0.05`,
    `Label Imbalance ${fmtRatio(s.labelImbalance)} ${imbalanceOk ? "<" : ">="} 10`,
    `PSI ${fmtRatio(s.psi)} ${psiOk ? "<" : ">="} 0.10`,
  ].join("; ");

  if (missingOk && imbalanceOk && psiOk) {
    return { result: "Good", triggeredRule: "rule-4-1", details };
  }
  if (!missingOk) {
    return { result: "Bad", triggeredRule: "rule-4-2", details };
  }
  if (!imbalanceOk) {
    return { result: "Bad", triggeredRule: "rule-4-3", details };
  }
  return { result: "Bad", triggeredRule: "rule-4-4", details };
}

function systemEfficiencyTrace(s: AllSignals): RuleTrace["systemEfficiency"] {
  const throughputOk = s.throughput >= 100;
  const latencyOk = s.latencyMs <= 300;
  const cpuOk = s.cpuRamUsage <= 0.8;
  const details = [
    `Throughput ${fmtRatio(s.throughput)} ${throughputOk ? ">=" : "<"} 100`,
    `Latency ${fmtRatio(s.latencyMs)}ms ${latencyOk ? "<=" : ">"} 300ms`,
    `CPU/RAM ${fmtRatio(s.cpuRamUsage)} ${cpuOk ? "<=" : ">"} 0.80`,
  ].join("; ");

  if (throughputOk && latencyOk && cpuOk) {
    return { result: "OK", triggeredRule: "rule-5-1", details };
  }
  if (!throughputOk && !latencyOk) {
    return { result: "Critical", triggeredRule: "rule-5-2", details };
  }
  if (!throughputOk && !cpuOk) {
    return { result: "Critical", triggeredRule: "rule-5-3", details };
  }
  if (throughputOk && !latencyOk) {
    return { result: "Critical", triggeredRule: "rule-5-4", details };
  }
  if (throughputOk && latencyOk && !cpuOk) {
    return { result: "Critical", triggeredRule: "rule-5-5", details };
  }
  if (!throughputOk && latencyOk && cpuOk) {
    return { result: "OK", triggeredRule: "rule-5-6", details };
  }
  return { result: "Critical", triggeredRule: "rule-5-5", details };
}

function conceptDriftTrace(metric: RuleTrace["metricStability"], pattern: RuleTrace["patternLogic"]): RuleTrace["conceptDrift"] {
  if (metric.result === "Pass" && pattern.result === "Normal") {
    return { result: "Stable", triggeredRule: "rule-6-1", details: "Metric stability and pattern logic are normal." };
  }
  if (metric.result === "Fail") {
    return { result: "Drifted", triggeredRule: "rule-6-2", details: "Metric stability failed." };
  }
  return { result: "Drifted", triggeredRule: "rule-6-3", details: "Pattern logic changed despite stable metrics." };
}

function dataDriftTrace(feature: RuleTrace["featurePower"], quality: RuleTrace["dataQuality"]): RuleTrace["dataDrift"] {
  if (feature.result === "Good" && quality.result === "Good") {
    return { result: "Stable", triggeredRule: "rule-7-1", details: "Feature power and data quality are good." };
  }
  if (feature.result === "Bad") {
    return { result: "Drifted", triggeredRule: "rule-7-2", details: "Feature power degraded." };
  }
  return { result: "Drifted", triggeredRule: "rule-7-3", details: "Data quality degraded." };
}

function finalAction(
  concept: RuleTrace["conceptDrift"],
  data: RuleTrace["dataDrift"],
  system: RuleTrace["systemEfficiency"],
): { action: DecisionAction; ruleId: string; details: string } {
  if (concept.result === "Stable" && data.result === "Stable" && system.result === "OK") {
    return { action: "Still_Valid_GO", ruleId: "rule-8-1", details: "All drift signals stable and system adequate." };
  }
  if (concept.result === "Drifted") {
    return { action: "Retrain_Model", ruleId: "rule-8-2", details: "Concept drift detected." };
  }
  if (concept.result === "Stable" && data.result === "Drifted") {
    return { action: "Tune_Model", ruleId: "rule-8-3", details: "Data drift detected while concept is stable." };
  }
  if (concept.result === "Stable" && data.result === "Stable" && system.result === "Critical") {
    return { action: "Optimize_System", ruleId: "rule-8-4", details: "System efficiency degraded while model is stable." };
  }
  return { action: "Tune_Model", ruleId: "rule-8-3", details: "Defaulted to tuning based on mixed signals." };
}

function buildConditions(s: AllSignals, trace: RuleTrace): Condition[] {
  return [
    { label: "MCC >= 0.60", expected: ">= 0.60", actual: fmtRatio(s.mcc), passed: s.mcc >= 0.6 },
    { label: "Precision >= 0.86", expected: ">= 0.86", actual: fmtRatio(s.precision), passed: s.precision >= 0.86 },
    { label: "Recall >= 0.85", expected: ">= 0.85", actual: fmtRatio(s.recall), passed: s.recall >= 0.85 },
    { label: "F1 >= 0.82", expected: ">= 0.82", actual: fmtRatio(s.f1), passed: s.f1 >= 0.82 },
    { label: "Accuracy >= 0.80", expected: ">= 0.80", actual: fmtRatio(s.accuracy), passed: s.accuracy >= 0.8 },
    { label: "Pattern Logic = Normal", expected: "Normal", actual: trace.patternLogic.result, passed: trace.patternLogic.result === "Normal" },
    { label: "Feature Power = Good", expected: "Good", actual: trace.featurePower.result, passed: trace.featurePower.result === "Good" },
    { label: "Data Quality = Good", expected: "Good", actual: trace.dataQuality.result, passed: trace.dataQuality.result === "Good" },
    { label: "System Efficiency = OK", expected: "OK", actual: trace.systemEfficiency.result, passed: trace.systemEfficiency.result === "OK" },
    { label: "Concept Drift = Stable", expected: "Stable", actual: trace.conceptDrift.result, passed: trace.conceptDrift.result === "Stable" },
    { label: "Data Drift = Stable", expected: "Stable", actual: trace.dataDrift.result, passed: trace.dataDrift.result === "Stable" },
  ];
}

function decisionExplanation(action: DecisionAction, trace: RuleTrace): { explanation: string; plain: string } {
  if (action === "Still_Valid_GO") {
    return {
      explanation: "Metric stability and pattern logic are stable, data drift is clear, and system efficiency is OK.",
      plain: "All rule sets are within target. Keep the current model in production.",
    };
  }
  if (action === "Retrain_Model") {
    return {
      explanation: `Concept drift detected (${trace.conceptDrift.triggeredRule}). Retraining is required to restore model validity.`,
      plain: "Patterns or metrics shifted enough that the safest response is retraining on recent data.",
    };
  }
  if (action === "Tune_Model") {
    return {
      explanation: `Data drift detected (${trace.dataDrift.triggeredRule}) while concept drift remains stable.`,
      plain: "Tune thresholds, features, or sampling to recover KPI balance before retraining.",
    };
  }
  return {
    explanation: "Model signals are stable but system efficiency is degraded.",
    plain: "Optimize system resources, queues, or infrastructure before touching the model.",
  };
}

function decisionConfidence(action: DecisionAction, trace: RuleTrace): Confidence {
  if (action === "Still_Valid_GO") return "High";
  if (action === "Retrain_Model") {
    return trace.conceptDrift.triggeredRule === "rule-6-2" ? "High" : "Medium";
  }
  if (action === "Tune_Model") return "Medium";
  return "Medium";
}

export function evaluate(signals: AllSignals): Evaluation {
  const metricStability = metricStabilityTrace(signals);
  const patternLogic = patternLogicTrace(signals);
  const featurePower = featurePowerTrace(signals);
  const dataQuality = dataQualityTrace(signals);
  const systemEfficiency = systemEfficiencyTrace(signals);
  const conceptDrift = conceptDriftTrace(metricStability, patternLogic);
  const dataDrift = dataDriftTrace(featurePower, dataQuality);

  const trace: RuleTrace = {
    metricStability,
    patternLogic,
    featurePower,
    dataQuality,
    systemEfficiency,
    conceptDrift,
    dataDrift,
  };

  const final = finalAction(conceptDrift, dataDrift, systemEfficiency);
  const explanation = decisionExplanation(final.action, trace);

  const decision: Decision = {
    action: final.action,
    tag: ACTION_LABELS[final.action],
    tone: ACTION_TONE[final.action],
    rule: "Rule 8",
    ruleId: final.ruleId,
    confidence: decisionConfidence(final.action, trace),
    explanation: explanation.explanation,
    plain: explanation.plain,
    conditions: buildConditions(signals, trace),
  };

  return { decision, trace };
}

export function matchIntent(
  input: string,
  signals: AllSignals,
  trace: RuleTrace,
  decision: Decision,
): ChatResponse {
  const normalized = input.trim().toLowerCase();
  const has = (words: string[]) => words.some((w) => normalized.includes(w));

  if (!normalized || has(["help", "ช่วย", "คำสั่ง", "คำถาม"])) {
    return {
      intent: "help",
      title: "Available queries",
      message: "Ask about specific rule sets or drift states.",
      details: [
        "metrics (recall, precision, f1, accuracy, mcc)",
        "pattern logic (graph, motif, centrality)",
        "feature power (feature, edge, learning rate, tree depth)",
        "data quality (missing, imbalance, psi)",
        "system efficiency (throughput, latency, cpu)",
        "concept drift / data drift",
        "recommendation / action / why",
      ],
    };
  }

  if (has(["data drift", "drift data", "ดาต้าดริฟต์", "ดริฟต์ข้อมูล"])) {
    return {
      intent: "data_drift",
      title: `Data Drift: ${trace.dataDrift.result}`,
      message: trace.dataDrift.details,
      details: [
        `Feature Power: ${trace.featurePower.result} (${trace.featurePower.triggeredRule})`,
        `Data Quality: ${trace.dataQuality.result} (${trace.dataQuality.triggeredRule})`,
      ],
    };
  }

  if (has(["concept drift", "concept", "คอนเซปต์", "คอนเซ็ปต์"])) {
    return {
      intent: "concept_drift",
      title: `Concept Drift: ${trace.conceptDrift.result}`,
      message: trace.conceptDrift.details,
      details: [
        `Metric Stability: ${trace.metricStability.result} (${trace.metricStability.triggeredRule})`,
        `Pattern Logic: ${trace.patternLogic.result} (${trace.patternLogic.triggeredRule})`,
      ],
    };
  }

  if (has(["recommend", "action", "what should", "ควร", "ทำอะไร", "แนะนำ"])) {
    return {
      intent: "recommendation",
      title: `Recommendation: ${decision.tag}`,
      message: decision.explanation,
      details: [decision.plain, `Triggered: ${decision.ruleId}`],
      followups: ["Ask for explanation", "Ask about drift status"],
    };
  }

  if (has(["explain", "why", "ทำไม", "เพราะอะไร"])) {
    return {
      intent: "explain",
      title: "Decision Trace",
      message: "Rule chain from metrics to final action.",
      details: [
        `Rule 1 Metric Stability: ${trace.metricStability.result} (${trace.metricStability.triggeredRule})`,
        `Rule 2 Pattern Logic: ${trace.patternLogic.result} (${trace.patternLogic.triggeredRule})`,
        `Rule 3 Feature Power: ${trace.featurePower.result} (${trace.featurePower.triggeredRule})`,
        `Rule 4 Data Quality: ${trace.dataQuality.result} (${trace.dataQuality.triggeredRule})`,
        `Rule 5 System Efficiency: ${trace.systemEfficiency.result} (${trace.systemEfficiency.triggeredRule})`,
        `Rule 6 Concept Drift: ${trace.conceptDrift.result} (${trace.conceptDrift.triggeredRule})`,
        `Rule 7 Data Drift: ${trace.dataDrift.result} (${trace.dataDrift.triggeredRule})`,
        `Rule 8 Final Action: ${decision.tag} (${decision.ruleId})`,
      ],
    };
  }

  if (has(["recall", "precision", "f1", "accuracy", "mcc", "metric", "metrics", "เมตริก", "ค่าวัด"])) {
    return {
      intent: "metric_status",
      title: `Metric Stability: ${trace.metricStability.result}`,
      message: trace.metricStability.details,
      details: [
        `MCC ${fmtRatio(signals.mcc)} (>= 0.60)`,
        `Precision ${fmtRatio(signals.precision)} (>= 0.86)`,
        `Recall ${fmtRatio(signals.recall)} (>= 0.85)`,
        `F1 ${fmtRatio(signals.f1)} (>= 0.82)`,
        `Accuracy ${fmtRatio(signals.accuracy)} (>= 0.80)`,
      ],
    };
  }

  if (has(["pattern", "graph", "motif", "centrality", "แพทเทิร์น", "กราฟ", "โหนด", "motif"])) {
    return {
      intent: "pattern_check",
      title: `Pattern Logic: ${trace.patternLogic.result}`,
      message: trace.patternLogic.details,
      details: [
        `Graph Density ${fmtRatio(signals.graphDensity)} (0.10-0.60)`,
        `Node Centrality ${fmtRatio(signals.nodeCentrality)} (> 0.40)`,
        `Motif Similarity ${fmtRatio(signals.motifSimilarity)} (> 0.60)`,
      ],
    };
  }

  if (has(["feature", "edge", "learning rate", "tree", "feature power", "ฟีเจอร์", "อัตราเรียนรู้", "ความลึก"])) {
    return {
      intent: "feature_check",
      title: `Feature Power: ${trace.featurePower.result}`,
      message: trace.featurePower.details,
      details: [
        `Feature Importance ${fmtRatio(signals.featureImportance)} (> 0.05)`,
        `Edge Weights ${fmtRatio(signals.edgeWeights)} (> 0.30)`,
        `Learning Rate ${fmtRatio(signals.learningRate, 4)} (0.001-0.01)`,
        `Tree Depth ${fmtRatio(signals.treeDepth)} (3-8)`,
      ],
    };
  }

  if (has(["data", "missing", "imbalance", "psi", "คุณภาพข้อมูล", "missing value", "label imbalance"])) {
    return {
      intent: "data_quality",
      title: `Data Quality: ${trace.dataQuality.result}`,
      message: trace.dataQuality.details,
      details: [
        `Missing % ${fmtRatio(signals.missingPct)} (< 0.05)`,
        `Label Imbalance ${fmtRatio(signals.labelImbalance)} (< 10)`,
        `PSI ${fmtRatio(signals.psi)} (< 0.10)`,
      ],
    };
  }

  if (has(["system", "latency", "cpu", "throughput", "ram", "system efficiency", "ระบบ"])) {
    return {
      intent: "system_check",
      title: `System Efficiency: ${trace.systemEfficiency.result}`,
      message: trace.systemEfficiency.details,
      details: [
        `Throughput ${fmtRatio(signals.throughput)} (>= 100)`,
        `Latency ${fmtRatio(signals.latencyMs)}ms (<= 300ms)`,
        `CPU/RAM ${fmtRatio(signals.cpuRamUsage)} (<= 0.80)`,
      ],
    };
  }

  return {
    intent: "fallback",
    title: "Not sure yet",
    message: "Try asking about metrics, drift, or recommendation.",
    followups: ["help"],
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