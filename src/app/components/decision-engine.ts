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

export type LangText = { en: string; th: string };

export type KpiKey =
  | "recall"
  | "precision"
  | "f1"
  | "auc"
  | "fpr"
  | "psi"
  | "mcc"
  | "accuracy"
  | "latency"
  | "throughput"
  | "cpu"
  | "concept_drift"
  | "data_drift";

export type PendingIntent = "root_cause" | "options" | "scenario";

export type ChatContext = {
  pending?: PendingIntent;
  lastKpi?: KpiKey;
};

export type IntentId =
  | "kpi_status"
  | "quick_status"
  | "root_cause"
  | "remediation"
  | "scenario"
  | "weekly_digest"
  | "retrain"
  | "help";

export type ChatResponse = {
  intent: IntentId;
  title: LangText;
  message: LangText;
  details?: LangText[];
  followups?: LangText[];
  nextContext?: ChatContext;
};

const fmtRatio = (n: number, digits = 2) => n.toFixed(digits);
const inRange = (n: number, min: number, max: number) => n >= min && n <= max;
const fmtPct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

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

type StatusLevel = "ok" | "warn" | "alert" | "na";
type KpiDirection = "high" | "low";
type KpiSpec = { target: number; alert: number; direction: KpiDirection };

const KPI_SPECS: Partial<Record<KpiKey, KpiSpec>> = {
  recall: { target: 0.85, alert: 0.8, direction: "high" },
  precision: { target: 0.7, alert: 0.6, direction: "high" },
  f1: { target: 0.78, alert: 0.7, direction: "high" },
  auc: { target: 0.9, alert: 0.85, direction: "high" },
  fpr: { target: 0.15, alert: 0.2, direction: "low" },
  psi: { target: 0.1, alert: 0.2, direction: "low" },
  mcc: { target: 0.6, alert: 0.5, direction: "high" },
  accuracy: { target: 0.8, alert: 0.75, direction: "high" },
  latency: { target: 300, alert: 1000, direction: "low" },
  throughput: { target: 100, alert: 60, direction: "high" },
  cpu: { target: 0.8, alert: 0.9, direction: "low" },
};

const KPI_LABELS: Record<KpiKey, LangText> = {
  recall: { en: "Recall", th: "Recall" },
  precision: { en: "Precision", th: "Precision" },
  f1: { en: "F1 Score", th: "F1 Score" },
  auc: { en: "AUC-ROC", th: "AUC-ROC" },
  fpr: { en: "FPR", th: "FPR" },
  psi: { en: "Model Drift (PSI)", th: "Model Drift (PSI)" },
  mcc: { en: "MCC", th: "MCC" },
  accuracy: { en: "Accuracy", th: "Accuracy" },
  latency: { en: "Latency", th: "Latency" },
  throughput: { en: "Throughput", th: "Throughput" },
  cpu: { en: "CPU/RAM Usage", th: "CPU/RAM Usage" },
  concept_drift: { en: "Concept Drift", th: "Concept Drift" },
  data_drift: { en: "Data Drift", th: "Data Drift" },
};

const STATUS_BADGES: Record<StatusLevel, LangText> = {
  ok: { en: "NORMAL", th: "ปกติ" },
  warn: { en: "WARNING", th: "WARNING" },
  alert: { en: "ALERT", th: "ALERT" },
  na: { en: "N/A", th: "ไม่มีข้อมูล" },
};

function statusLabel(level: StatusLevel, direction: KpiDirection): LangText {
  if (level === "ok") return { en: "OK", th: "✅ ปกติ" };
  if (level === "warn") return direction === "high"
    ? { en: "Near target", th: "⚠️ ใกล้เป้า" }
    : { en: "Near limit", th: "⚠️ ใกล้เกิน" };
  if (level === "alert") return direction === "high"
    ? { en: "Below target", th: "🔴 ต่ำกว่าเป้า" }
    : { en: "Above limit", th: "🔴 เกินเป้า" };
  return { en: "N/A", th: "ไม่มีข้อมูล" };
}

function getKpiValue(key: KpiKey, signals: AllSignals, trace: RuleTrace): number | null {
  switch (key) {
    case "recall":
      return signals.recall;
    case "precision":
      return signals.precision;
    case "f1":
      return signals.f1;
    case "mcc":
      return signals.mcc;
    case "accuracy":
      return signals.accuracy;
    case "psi":
      return signals.psi;
    case "latency":
      return signals.latencyMs;
    case "throughput":
      return signals.throughput;
    case "cpu":
      return signals.cpuRamUsage;
    case "concept_drift":
      return trace.conceptDrift.result === "Drifted" ? 1 : 0;
    case "data_drift":
      return trace.dataDrift.result === "Drifted" ? 1 : 0;
    default:
      return null;
  }
}

function formatKpiValue(key: KpiKey, value: number | null, trace: RuleTrace): string {
  if (value === null) return "-";
  switch (key) {
    case "recall":
    case "precision":
      return fmtPct(value);
    case "f1":
    case "mcc":
    case "accuracy":
      return fmtRatio(value, 2);
    case "psi":
      return `PSI=${fmtRatio(value, 2)}`;
    case "latency":
      return `${fmtRatio(value, 0)}ms`;
    case "throughput":
      return fmtRatio(value, 0);
    case "cpu":
      return `${Math.round(value * 100)}%`;
    case "concept_drift":
      return trace.conceptDrift.result;
    case "data_drift":
      return trace.dataDrift.result;
    default:
      return "-";
  }
}

function statusForKpi(key: KpiKey, value: number | null): { level: StatusLevel; label: LangText } {
  const spec = KPI_SPECS[key];
  if (!spec || value === null) return { level: "na", label: statusLabel("na", "high") };
  if (spec.direction === "high") {
    if (value < spec.alert) return { level: "alert", label: statusLabel("alert", spec.direction) };
    if (value < spec.target) return { level: "warn", label: statusLabel("warn", spec.direction) };
    return { level: "ok", label: statusLabel("ok", spec.direction) };
  }
  if (value > spec.alert) return { level: "alert", label: statusLabel("alert", spec.direction) };
  if (value > spec.target) return { level: "warn", label: statusLabel("warn", spec.direction) };
  return { level: "ok", label: statusLabel("ok", spec.direction) };
}

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

function buildKpiTable(signals: AllSignals, trace: RuleTrace, locale: "en" | "th") {
  const rows = [
    { key: "recall" as KpiKey, label: "Recall", target: ">=85%" },
    { key: "precision" as KpiKey, label: "Precision", target: ">=70%" },
    { key: "fpr" as KpiKey, label: "FPR", target: "<=15%" },
    { key: "f1" as KpiKey, label: "F1 Score", target: ">=0.78" },
    { key: "auc" as KpiKey, label: "AUC-ROC", target: ">=0.90" },
    { key: "psi" as KpiKey, label: "Model Drift", target: "<0.10" },
  ];
  const col = { name: 12, value: 10, target: 6, status: 12 };
  const pad = (value: string, len: number) => value.padEnd(len, " ");
  const header = locale === "th"
    ? `│ ${pad("KPI", col.name)} │ ${pad("ค่าตอนนี้", col.value)} │ ${pad("เป้า", col.target)} │ ${pad("สถานะ", col.status)} │`
    : `│ ${pad("KPI", col.name)} │ ${pad("Value", col.value)} │ ${pad("Target", col.target)} │ ${pad("Status", col.status)} │`;
  const lines = rows.map((row) => {
    const valueNum = getKpiValue(row.key, signals, trace);
    const valueText = formatKpiValue(row.key, valueNum, trace);
    const status = statusForKpi(row.key, valueNum);
    const statusText = locale === "th" ? status.label.th : status.label.en;
    return `│ ${pad(row.label, col.name)} │ ${pad(valueText, col.value)} │ ${pad(row.target, col.target)} │ ${pad(statusText, col.status)} │`;
  });
  return [
    "┌─────────────────────────────────────────────────┐",
    header,
    "├─────────────────────────────────────────────────┤",
    ...lines,
    "└─────────────────────────────────────────────────┘",
  ].join("\n");
}

function buildKpiStatusMessage(signals: AllSignals, trace: RuleTrace): LangText {
  const tableTh = buildKpiTable(signals, trace, "th");
  const tableEn = buildKpiTable(signals, trace, "en");
  const concernsTh: string[] = [];
  const concernsEn: string[] = [];

  if (signals.psi >= 0.1) {
    concernsTh.push(`Model Drift (PSI ${fmtRatio(signals.psi, 2)}) เกินเป้า 0.10 แล้ว`);
    concernsEn.push(`Model Drift (PSI ${fmtRatio(signals.psi, 2)}) is above the 0.10 target`);
  }
  if (signals.recall < 0.85) {
    concernsTh.push(`Recall ${fmtPct(signals.recall)} ต่ำกว่าเป้า 85%`);
    concernsEn.push(`Recall ${fmtPct(signals.recall)} is below the 85% target`);
  }
  if (trace.conceptDrift.result === "Drifted") {
    concernsTh.push("Concept Drift ถูกตรวจพบจากชุดกฎ");
    concernsEn.push("Concept Drift was detected by the rule chain");
  }
  if (getKpiValue("fpr", signals, trace) === null || getKpiValue("auc", signals, trace) === null) {
    concernsTh.push("FPR/AUC ยังไม่มีข้อมูลในชุดนี้");
    concernsEn.push("FPR/AUC data is not available in this context");
  }
  if (concernsTh.length === 0) {
    concernsTh.push("KPI หลักยังอยู่ในเป้า");
    concernsEn.push("Primary KPIs are within target");
  }

  return {
    th: [
      "---",
      "📊 สถานะ KPI ล่าสุด",
      "",
      tableTh,
      "",
      "สิ่งที่ต้องดูตอนนี้:",
      ...concernsTh,
      "",
      "อยากให้เจาะลึกตัวไหนเป็นพิเศษไหมครับ?",
      "---",
    ].join("\n"),
    en: [
      "---",
      "📊 KPI Status (Latest)",
      "",
      tableEn,
      "",
      "What to watch:",
      ...concernsEn,
      "",
      "Anything you want to dig into next?",
      "---",
    ].join("\n"),
  };
}

function buildQuickKpiStatus(key: KpiKey, signals: AllSignals, trace: RuleTrace): LangText {
  const valueNum = getKpiValue(key, signals, trace);
  const valueText = formatKpiValue(key, valueNum, trace);
  const status = statusForKpi(key, valueNum);
  const label = KPI_LABELS[key];
  const trendTh = "ยังไม่มีข้อมูลเทรนด์ 7 วัน";
  const trendEn = "No 7d trend data";
  const noteTh = valueNum === null
    ? "ตอนนี้ยังไม่มีข้อมูล KPI ตัวนี้"
    : `${label.th} อยู่ที่ ${valueText}`;
  const noteEn = valueNum === null
    ? "No data available for this KPI"
    : `${label.en} is at ${valueText}`;
  return {
    th: [
      "---",
      `KPI: ${label.th} | ค่าตอนนี้: ${valueText} | สถานะ: ${status.label.th} | ทิศทาง: ${trendTh}`,
      `Note: ${noteTh}`,
      "ถ้าต้องการดูว่าเกิดอะไรขึ้น พิมพ์ \"ทำไม\" ได้เลย",
      "---",
    ].join("\n"),
    en: [
      "---",
      `KPI: ${label.en} | Value: ${valueText} | Status: ${status.label.en} | Trend: ${trendEn}`,
      `Note: ${noteEn}`,
      "Ask \"why\" for a full root cause breakdown.",
      "---",
    ].join("\n"),
  };
}

function buildRootCauseMessage(key: KpiKey, signals: AllSignals, trace: RuleTrace): LangText {
  const label = KPI_LABELS[key];
  const valueNum = getKpiValue(key, signals, trace);
  const valueText = formatKpiValue(key, valueNum, trace);
  const status = statusForKpi(key, valueNum);
  const statusBadge = STATUS_BADGES[status.level];
  const trendTh = "ยังไม่มีข้อมูลเทรนด์ 7 วัน";
  const trendEn = "No 7d trend data";

  const metricEvidenceTh: string[] = [];
  const metricEvidenceEn: string[] = [];
  if (signals.mcc < 0.6) {
    metricEvidenceTh.push(`MCC ${fmtRatio(signals.mcc)} ต่ำกว่าเป้า 0.60`);
    metricEvidenceEn.push(`MCC ${fmtRatio(signals.mcc)} is below 0.60`);
  }
  if (signals.recall < 0.85) {
    metricEvidenceTh.push(`Recall ${fmtPct(signals.recall)} ต่ำกว่าเป้า 85%`);
    metricEvidenceEn.push(`Recall ${fmtPct(signals.recall)} is below 85%`);
  }
  if (signals.f1 < 0.78) {
    metricEvidenceTh.push(`F1 ${fmtRatio(signals.f1)} ต่ำกว่าเป้า 0.78`);
    metricEvidenceEn.push(`F1 ${fmtRatio(signals.f1)} is below 0.78`);
  }
  if (signals.precision < 0.7) {
    metricEvidenceTh.push(`Precision ${fmtPct(signals.precision)} ต่ำกว่าเป้า 70%`);
    metricEvidenceEn.push(`Precision ${fmtPct(signals.precision)} is below 70%`);
  }

  const isMetric = ["recall", "precision", "f1", "mcc", "accuracy"].includes(key);
  const isSystem = ["latency", "throughput", "cpu"].includes(key);
  let primaryCauseTh = "";
  let primaryCauseEn = "";
  let confidenceTh = "กลาง";
  let confidenceEn = "Medium";

  if (key === "psi" || key === "data_drift") {
    primaryCauseTh = "การกระจายข้อมูลใหม่เปลี่ยน ทำให้ Model Drift สูงขึ้น";
    primaryCauseEn = "Data distribution shifted, pushing Model Drift higher";
    confidenceTh = signals.psi >= 0.2 ? "สูง" : "กลาง";
    confidenceEn = signals.psi >= 0.2 ? "High" : "Medium";
  } else if (key === "concept_drift" || (isMetric && trace.conceptDrift.result === "Drifted")) {
    primaryCauseTh = "Concept Drift ทำให้ KPI หลุดเป้า";
    primaryCauseEn = "Concept Drift is pulling KPIs below target";
    confidenceTh = "สูง";
    confidenceEn = "High";
  } else if (isSystem) {
    primaryCauseTh = "System Efficiency มีจุดที่ต้องดู ทำให้ระบบช้าหรือโหลดสูง";
    primaryCauseEn = "System efficiency issues are driving the slowdown";
    confidenceTh = trace.systemEfficiency.result === "Critical" ? "สูง" : "กลาง";
    confidenceEn = trace.systemEfficiency.result === "Critical" ? "High" : "Medium";
  } else {
    primaryCauseTh = "Metric Stability หลุดเป้า";
    primaryCauseEn = "Metric stability fell below target";
  }

  const evidenceTh = metricEvidenceTh.length > 0 ? metricEvidenceTh.join(", ") : "ยังไม่มีข้อมูลพอ";
  const evidenceEn = metricEvidenceEn.length > 0 ? metricEvidenceEn.join(", ") : "Insufficient evidence so far";
  const secondaryTh = trace.dataDrift.result === "Drifted" ? "Data Drift เริ่มขยับ" : "System Efficiency มีผลบางส่วน";
  const secondaryEn = trace.dataDrift.result === "Drifted" ? "Data Drift is moving" : "System efficiency contributes";
  const ruledOutTh = trace.dataQuality.result === "Good" ? "คุณภาพข้อมูลยังปกติ" : "คุณภาพข้อมูลยังไม่นิ่ง ตัดออกไม่ได้";
  const ruledOutEn = trace.dataQuality.result === "Good" ? "Data quality looks stable" : "Data quality is unstable";

  const summaryTh = isSystem
    ? `ระบบตอนนี้มีค่า ${label.th} ${valueText} ซึ่งส่งผลต่อความเร็วและ SLA โดยตรง`
    : `ตอนนี้ ${label.th} อยู่ที่ ${valueText} และชุดกฎแสดงให้เห็นว่า KPI เริ่มหลุดเป้า`;
  const summaryEn = isSystem
    ? `${label.en} is at ${valueText}, which directly impacts latency/SLA`
    : `${label.en} is at ${valueText}, and the rule chain shows KPI pressure`;

  return {
    th: [
      "---",
      `🔍 ดูว่าเกิดอะไรขึ้นกับ ${label.th}`,
      "",
      `สถานะ: ${valueText} — ${statusBadge.th}`,
      `ทิศทาง: ${trendTh}`,
      "",
      "สิ่งที่ข้อมูลบอก:",
      summaryTh,
      "",
      "สาเหตุที่น่าจะเป็น:",
      `-> หลัก  : ${primaryCauseTh} — ความมั่นใจ: ${confidenceTh}`,
      `   หลักฐาน: ${evidenceTh}`,
      `-> รอง   : ${secondaryTh}`,
      `-> ตัดออก: ${ruledOutTh}`,
      "",
      "ผลกระทบถ้าไม่จัดการ:",
      "ใน 7 วัน  -> KPI มีโอกาสแกว่งและหลุดเป้าเพิ่ม (ความมั่นใจ: กลาง)",
      "ใน 30 วัน -> เสี่ยงให้ผลตรวจจับผิดพลาดมากขึ้น (ความมั่นใจ: กลาง)",
      "ด้านธุรกิจ -> เสี่ยง false negative/false positive และภาระงานเพิ่ม",
      "",
      "อยากดูทางออกไหมครับ?",
      "---",
    ].join("\n"),
    en: [
      "---",
      `🔍 What is happening with ${label.en}`,
      "",
      `Status: ${valueText} — ${statusBadge.en}`,
      `Trend: ${trendEn}`,
      "",
      "What the data shows:",
      summaryEn,
      "",
      "Most likely causes:",
      `-> Primary : ${primaryCauseEn} — Confidence: ${confidenceEn}`,
      `   Evidence: ${evidenceEn}`,
      `-> Secondary: ${secondaryEn}`,
      `-> Ruled out: ${ruledOutEn}`,
      "",
      "Impact if not addressed:",
      "In 7d  -> KPIs may drift further (Confidence: Medium)",
      "In 30d -> Higher risk of detection errors (Confidence: Medium)",
      "Business -> False negatives/positives and higher ops load",
      "",
      "Do you want remediation options?",
      "---",
    ].join("\n"),
  };
}

function buildRemediationMessage(key: KpiKey, signals: AllSignals, trace: RuleTrace, decision: Decision): LangText {
  const label = KPI_LABELS[key];
  let optionATh = "";
  let optionAEn = "";
  let optionBTh = "";
  let optionBEn = "";
  let optionCTh = "";
  let optionCEn = "";
  let recommended = "A";
  let confidenceTh = "กลาง";
  let confidenceEn = "Medium";
  let rationaleTh = "เหมาะกับสถานการณ์ตอนนี้และทำได้เร็ว";
  let rationaleEn = "Best fit for current urgency and effort";
  let introTh = "เลือกทางออกที่เหมาะกับสถานการณ์ตอนนี้";
  let introEn = "Pick the option that fits the current situation best";

  if (decision.action === "Retrain_Model") {
    optionATh = "1. ทางออก A: Retrain ทันทีด้วยข้อมูลปัจจุบัน\n   ทำอะไร   : ใช้ข้อมูลล่าสุด 6 เดือน retrain Champion model\n   ผลที่คาด  : KPI หลักกลับเข้าเป้าใน 1-2 สัปดาห์\n   ใช้เวลา   : 3-5 วันทำการ\n   ความเสี่ยง: กลาง\n   ข้อแลก    : ต้อง validate ก่อน deploy\n   ผู้รับผิดชอบ: Data Science Team";
    optionAEn = "1. Option A: Retrain now with recent data\n   Action: Retrain on the latest 6 months\n   Expected: KPIs return to target in 1-2 weeks\n   Time: 3-5 working days\n   Risk: Medium\n   Trade-off: Must validate before deploy\n   Owner: Data Science Team";
    optionBTh = "2. ทางออก B: Retrain พร้อมปรับ Feature\n   ทำอะไร   : ทบทวน feature importance ก่อนปรับแล้วค่อย retrain\n   ผลที่คาด  : เสถียรขึ้นระยะยาว\n   ใช้เวลา   : 2-3 สัปดาห์\n   ความเสี่ยง: กลาง-สูง\n   ข้อแลก    : ใช้เวลานานกว่าและต้องมี business input\n   ผู้รับผิดชอบ: Data Science + Business Analyst";
    optionBEn = "2. Option B: Retrain with feature update\n   Action: Review feature importance then retrain\n   Expected: Better long-term stability\n   Time: 2-3 weeks\n   Risk: Medium-High\n   Trade-off: Longer cycle + business input needed\n   Owner: Data Science + Business Analyst";
    optionCTh = "3. ทางออก C: จับตาดูก่อนแล้วค่อยตัดสินใจ\n   ทำอะไร   : ติดตาม PSI/Recall ทุกวัน ถ้า PSI > 0.20 ให้ retrain\n   ผลที่คาด  : เสี่ยง performance แย่ลงถ้า drift ยังขยับ\n   ใช้เวลา   : 1-2 สัปดาห์\n   ความเสี่ยง: สูง\n   ข้อแลก    : ประหยัด resource แต่เสี่ยงสะสมปัญหา";
    optionCEn = "3. Option C: Monitor first, then decide\n   Action: Track PSI/Recall daily; retrain if PSI > 0.20\n   Expected: Risk of further drift if trend continues\n   Time: 1-2 weeks\n   Risk: High\n   Trade-off: Saves resources but risks bigger degradation";
    introTh = "Model Drift ชัดเจน จึงควรเริ่มจากทางออกที่ลงมือได้เร็ว";
    introEn = "Model Drift is clear, so start with the fastest actionable path";
    recommended = "A";
    confidenceTh = "สูง";
    confidenceEn = "High";
    rationaleTh = "Drift อยู่ระดับที่ควรทำทันทีและมีข้อมูลพอ";
    rationaleEn = "Drift level is actionable with enough data on hand";
  } else if (decision.action === "Tune_Model") {
    optionATh = "1. ทางออก A: ปรับ Threshold ทันที\n   ทำอะไร   : ปรับค่า threshold เพื่อบาลานซ์ Precision/Recall\n   ผลที่คาด  : KPI กลับเข้าเป้าเร็วขึ้น\n   ใช้เวลา   : ชั่วโมง-1 วัน\n   ความเสี่ยง: กลาง\n   ข้อแลก    : อาจทำให้ KPI อีกตัวตกชั่วคราว\n   ผู้รับผิดชอบ: Model Ops";
    optionAEn = "1. Option A: Tune threshold now\n   Action: Adjust threshold to balance Precision/Recall\n   Expected: Faster KPI recovery\n   Time: Hours-1 day\n   Risk: Medium\n   Trade-off: May hurt the other KPI temporarily\n   Owner: Model Ops";
    optionBTh = "2. ทางออก B: Retrain โมเดล\n   ทำอะไร   : retrain ด้วยข้อมูลล่าสุด\n   ผลที่คาด  : ลด drift ระยะกลาง\n   ใช้เวลา   : 3-5 วันทำการ\n   ความเสี่ยง: กลาง\n   ข้อแลก    : ใช้เวลามากกว่า\n   ผู้รับผิดชอบ: Data Science Team";
    optionBEn = "2. Option B: Retrain the model\n   Action: Retrain with recent data\n   Expected: Reduce drift mid-term\n   Time: 3-5 working days\n   Risk: Medium\n   Trade-off: Slower than tuning\n   Owner: Data Science Team";
    optionCTh = "3. ทางออก C: Monitor ต่อและตั้ง trigger ชัดเจน\n   ทำอะไร   : monitor KPI รายวัน และมี trigger ชัดเจน\n   ผลที่คาด  : ถ้า drift ยังเพิ่ม จะต้องทำทันที\n   ใช้เวลา   : 1-2 สัปดาห์\n   ความเสี่ยง: สูง\n   ข้อแลก    : เสี่ยงสะสมปัญหา";
    optionCEn = "3. Option C: Keep monitoring with clear triggers\n   Action: Daily KPI checks with clear triggers\n   Expected: Act fast if drift accelerates\n   Time: 1-2 weeks\n   Risk: High\n   Trade-off: Risk of delayed action";
    introTh = "ตอนนี้ควรแก้ความไม่สมดุลของ Precision/Recall ให้เร็วที่สุด";
    introEn = "The current issue is Precision/Recall imbalance, so act quickly";
    recommended = "A";
    confidenceTh = "กลาง";
    confidenceEn = "Medium";
    rationaleTh = "แก้ได้เร็วและต้นทุนต่ำกว่า retrain";
    rationaleEn = "Fastest correction with lower cost than retraining";
  } else if (decision.action === "Optimize_System") {
    optionATh = "1. ทางออก A: Optimize ระบบทันที\n   ทำอะไร   : ลด latency/ปรับ queue/เพิ่ม resource\n   ผลที่คาด  : SLA กลับมาปกติ\n   ใช้เวลา   : ชั่วโมง-2 วัน\n   ความเสี่ยง: กลาง\n   ข้อแลก    : ใช้ resource เพิ่ม\n   ผู้รับผิดชอบ: Platform/Infra";
    optionAEn = "1. Option A: Optimize the system now\n   Action: Reduce latency, tune queue, add resources\n   Expected: SLA back to normal\n   Time: Hours-2 days\n   Risk: Medium\n   Trade-off: Higher resource cost\n   Owner: Platform/Infra";
    optionBTh = "2. ทางออก B: ปรับแบบ off-peak\n   ทำอะไร   : ทำ optimization ช่วงโหลดต่ำ\n   ผลที่คาด  : ลด impact ต่อ production\n   ใช้เวลา   : 2-5 วัน\n   ความเสี่ยง: กลาง\n   ข้อแลก    : ช้ากว่า\n   ผู้รับผิดชอบ: Platform/Infra";
    optionBEn = "2. Option B: Optimize off-peak\n   Action: Changes during low-traffic window\n   Expected: Less production impact\n   Time: 2-5 days\n   Risk: Medium\n   Trade-off: Slower recovery\n   Owner: Platform/Infra";
    optionCTh = "3. ทางออก C: Monitor ต่อ\n   ทำอะไร   : monitor latency รายชั่วโมง\n   ผลที่คาด  : เสี่ยง SLA หลุดถ้าโหลดเพิ่ม\n   ใช้เวลา   : 1-2 สัปดาห์\n   ความเสี่ยง: สูง\n   ข้อแลก    : เสี่ยงสูงกว่า";
    optionCEn = "3. Option C: Keep monitoring\n   Action: Hourly latency checks\n   Expected: SLA risk if load spikes\n   Time: 1-2 weeks\n   Risk: High\n   Trade-off: Higher operational risk";
    introTh = "ประเด็นนี้กระทบ SLA โดยตรง จึงควรแก้ระบบก่อน";
    introEn = "This directly affects SLA, so fix the system first";
    recommended = "A";
    confidenceTh = "กลาง";
    confidenceEn = "Medium";
    rationaleTh = "ส่งผลต่อ SLA ตรง จึงควรทำทันที";
    rationaleEn = "Direct SLA impact needs quick action";
  } else {
    optionATh = "1. ทางออก A: ปรับ Threshold เล็กน้อย\n   ทำอะไร   : ปรับ threshold เล็กน้อยเพื่อกันความเสี่ยง\n   ผลที่คาด  : ลดความผันผวนเล็กน้อย\n   ใช้เวลา   : ชั่วโมง-1 วัน\n   ความเสี่ยง: ต่ำ\n   ข้อแลก    : อาจกระทบ KPI อื่นเล็กน้อย\n   ผู้รับผิดชอบ: Model Ops";
    optionAEn = "1. Option A: Minor threshold tune\n   Action: Small threshold adjustment\n   Expected: Slightly lower volatility\n   Time: Hours-1 day\n   Risk: Low\n   Trade-off: Small KPI trade-offs\n   Owner: Model Ops";
    optionBTh = "2. ทางออก B: ทำ shadow test\n   ทำอะไร   : ทดสอบ model challenger แบบเงียบ\n   ผลที่คาด  : ได้ข้อมูลเพิ่มก่อนเปลี่ยนจริง\n   ใช้เวลา   : 3-7 วัน\n   ความเสี่ยง: ต่ำ\n   ข้อแลก    : ยังไม่แก้ปัญหาจริงทันที\n   ผู้รับผิดชอบ: Data Science";
    optionBEn = "2. Option B: Run a shadow test\n   Action: Run challenger in shadow mode\n   Expected: More evidence before changes\n   Time: 3-7 days\n   Risk: Low\n   Trade-off: No immediate change\n   Owner: Data Science";
    optionCTh = "3. ทางออก C: จับตาดูต่อ\n   ทำอะไร   : monitor KPI รายสัปดาห์\n   ผลที่คาด  : ถ้า KPI เริ่มหลุดเป้า จะค่อยทำ\n   ใช้เวลา   : ต่อเนื่อง\n   ความเสี่ยง: ต่ำ\n   ข้อแลก    : อาจช้าเกินถ้าเทรนด์เปลี่ยนเร็ว";
    optionCEn = "3. Option C: Keep monitoring\n   Action: Weekly KPI checks\n   Expected: Act if KPIs drift below target\n   Time: Ongoing\n   Risk: Low\n   Trade-off: Slower response if trend shifts fast";
    introTh = "KPI ส่วนใหญ่ยังอยู่ในเกณฑ์ จึงเน้นทางเลือกที่ปลอดภัยก่อน";
    introEn = "Most KPIs are still in range, so prefer safer options first";
    recommended = "C";
    confidenceTh = "กลาง";
    confidenceEn = "Medium";
    rationaleTh = "KPI ส่วนใหญ่ยังอยู่ในเป้า";
    rationaleEn = "Most KPIs are still within target";
  }

  return {
    th: [
      "---",
      `🛠️ ทางออกสำหรับ ${label.th}`,
      "",
      introTh,
      "",
      `ARIA แนะนำ: ทางออก ${recommended}`,
      `เหตุผล    : ${rationaleTh}`,
      `ความมั่นใจ : ${confidenceTh}`,
      "",
      optionATh,
      "",
      optionBTh,
      "",
      optionCTh,
      "",
      "ข้อควรระวัง: ถ้า pattern หรือ KPI เปลี่ยนเร็ว ให้ยกระดับทันที",
      "",
      "ขั้นตอนต่อไป:",
      "1. ทำทันที -- ภายใน 24 ชั่วโมง",
      "2. ระยะสั้น -- ภายใน 1 สัปดาห์",
      "3. จุดที่ต้องกลับมาประเมินใหม่ -- เมื่อ KPI ขยับ 5-10%",
      "4. เงื่อนไขที่ต้อง escalate ให้คนตัดสิน -- หาก KPI หลุดเป้าแจ้งเตือน",
      "---",
    ].join("\n"),
    en: [
      "---",
      `🛠️ Remediation options for ${label.en}`,
      "",
      introEn,
      "",
      `ARIA recommends: Option ${recommended}`,
      `Rationale: ${rationaleEn}`,
      `Confidence: ${confidenceEn}`,
      "",
      optionAEn,
      "",
      optionBEn,
      "",
      optionCEn,
      "",
      "Caveat: Escalate if KPI shifts sharply",
      "",
      "Next steps:",
      "1. Immediate -- within 24 hours",
      "2. Short-term -- within 1 week",
      "3. Re-evaluate when KPI moves 5-10%",
      "4. Escalate if KPI crosses alert threshold",
      "---",
    ].join("\n"),
  };
}

function buildScenarioMessage(change: string, signals: AllSignals): LangText {
  const baseline = `Recall ${fmtPct(signals.recall)}, Precision ${fmtPct(signals.precision)}, F1 ${fmtRatio(signals.f1, 2)}, PSI ${fmtRatio(signals.psi, 2)}`;
  return {
    th: [
      "---",
      `🔭 จำลองสถานการณ์: ${change}`,
      "",
      `ค่าตอนนี้   : ${baseline}`,
      "",
      "ถ้าทำตามนี้จะเกิดอะไร:",
      "  ดีที่สุด   : KPI ดีขึ้นเล็กน้อย แต่ต้องมีข้อมูลเพิ่มเพื่อยืนยัน — โอกาส: ต้องมีข้อมูลเพิ่ม",
      "  ที่น่าจะเป็น: KPI แกว่งเล็กน้อยและต้อง monitor ใกล้ชิด — โอกาส: ต้องมีข้อมูลเพิ่ม",
      "  แย่ที่สุด  : KPI หลุดเป้าเพิ่มถ้าข้อมูลเปลี่ยนแรง — โอกาส: ต้องมีข้อมูลเพิ่ม",
      "",
      "ตัวแปรที่มีผลมากที่สุด: distribution shift, class imbalance, threshold",
      "เคยเกิดแบบนี้ไหม: ยังไม่มีข้อมูลเทียบเคียงในรอบนี้",
      "ARIA ประเมิน: ระวังก่อน -- ความมั่นใจ: ต่ำ (ต้องมีผลทดสอบเพิ่ม)",
      "---",
    ].join("\n"),
    en: [
      "---",
      `🔭 Scenario: ${change}`,
      "",
      `Baseline: ${baseline}`,
      "",
      "Projected impact:",
      "  Best case : Small KPI lift (needs more data) — Probability: needs data",
      "  Base case : Minor KPI volatility — Probability: needs data",
      "  Worst case: KPI slips below target — Probability: needs data",
      "",
      "Key sensitivities: distribution shift, class imbalance, threshold",
      "Historical analog: no comparable window yet",
      "ARIA assessment: Caution — Confidence: Low (needs more testing)",
      "---",
    ].join("\n"),
  };
}

function buildWeeklyDigest(signals: AllSignals, trace: RuleTrace): LangText {
  const tableTh = buildKpiTable(signals, trace, "th");
  const tableEn = buildKpiTable(signals, trace, "en");
  const concernsTh: string[] = [];
  const concernsEn: string[] = [];
  if (signals.psi >= 0.1) {
    concernsTh.push(`Model Drift (PSI ${fmtRatio(signals.psi, 2)}) เกินเป้า`);
    concernsEn.push(`Model Drift (PSI ${fmtRatio(signals.psi, 2)}) above target`);
  }
  if (signals.recall < 0.85) {
    concernsTh.push(`Recall ${fmtPct(signals.recall)} ต่ำกว่าเป้า`);
    concernsEn.push(`Recall ${fmtPct(signals.recall)} below target`);
  }
  if (trace.systemEfficiency.result === "Critical") {
    concernsTh.push("System Efficiency อยู่ในระดับ Critical");
    concernsEn.push("System efficiency is Critical");
  }
  if (concernsTh.length === 0) {
    concernsTh.push("ยังไม่เห็นปัญหาใหญ่ในสัปดาห์นี้");
    concernsEn.push("No major issues flagged this week");
  }

  const winsTh = [
    signals.precision >= 0.7 ? "Precision ยังอยู่ในเป้า" : "Precision ต้องจับตา",
    signals.f1 >= 0.78 ? "F1 Score อยู่ในเป้า" : "F1 Score ต่ำกว่าเป้า",
    trace.dataDrift.result === "Stable" ? "Data Drift ยังนิ่ง" : "Data Drift มีการเปลี่ยน",
  ];
  const winsEn = [
    signals.precision >= 0.7 ? "Precision is within target" : "Precision needs attention",
    signals.f1 >= 0.78 ? "F1 Score is within target" : "F1 Score below target",
    trace.dataDrift.result === "Stable" ? "Data Drift is stable" : "Data Drift is moving",
  ];

  return {
    th: [
      "---",
      "📋 สรุปสัปดาห์ -- สัปดาห์นี้",
      "",
      "ภาพรวม KPI ทั้งหมด:",
      tableTh,
      "",
      "3 เรื่องที่น่าเป็นห่วงที่สุด:",
      `1. ${concernsTh[0] ?? "-"}`,
      `2. ${concernsTh[1] ?? "-"}`,
      `3. ${concernsTh[2] ?? "-"}`,
      "",
      "3 เรื่องที่ดีหรือคงที่:",
      `1. ${winsTh[0]}`,
      `2. ${winsTh[1]}`,
      `3. ${winsTh[2]}`,
      "",
      "สิ่งที่ควรโฟกัสใน 7 วันข้างหน้า:",
      "-> ติดตาม Model Drift รายวัน",
      "-> ตรวจ KPI ที่หลุดเป้าและสาเหตุ",
      "-> เตรียมแผน retrain หาก drift ขยับต่อ",
      "---",
    ].join("\n"),
    en: [
      "---",
      "📋 Weekly digest -- This week",
      "",
      "KPI overview:",
      tableEn,
      "",
      "Top 3 concerns:",
      `1. ${concernsEn[0] ?? "-"}`,
      `2. ${concernsEn[1] ?? "-"}`,
      `3. ${concernsEn[2] ?? "-"}`,
      "",
      "Top 3 stable/wins:",
      `1. ${winsEn[0]}`,
      `2. ${winsEn[1]}`,
      `3. ${winsEn[2]}`,
      "",
      "Focus for the next 7 days:",
      "-> Track Model Drift daily",
      "-> Investigate KPIs below target",
      "-> Prepare retrain plan if drift persists",
      "---",
    ].join("\n"),
  };
}

function buildRetrainMessage(signals: AllSignals, trace: RuleTrace): LangText {
  const driftLineTh = signals.psi >= 0.1
    ? `Model Drift (PSI ${fmtRatio(signals.psi, 2)}) เกินเป้า 0.10 แล้ว`
    : `Concept Drift ถูกตรวจพบ (Metric Stability = ${trace.metricStability.result})`;
  const driftLineEn = signals.psi >= 0.1
    ? `Model Drift (PSI ${fmtRatio(signals.psi, 2)}) is above the 0.10 target`
    : `Concept Drift detected (Metric Stability = ${trace.metricStability.result})`;
  return {
    th: [
      "---",
      "🔁 คำแนะนำ: Retrain โมเดล",
      "",
      "ทำไมถึงแนะนำตอนนี้:",
      driftLineTh,
      "ถ้าปล่อยไว้ Recall และ Precision มีโอกาสลดลงใน 2-4 สัปดาห์ข้างหน้า",
      "",
      "ทางออก A -- Retrain ทันทีด้วยข้อมูลปัจจุบัน",
      "  ทำอะไร   : นำข้อมูล 6 เดือนล่าสุดมา retrain Champion model",
      "  ผลที่คาด  : KPI กลับเข้าเป้าใน 1-2 สัปดาห์",
      "  ใช้เวลา   : 3-5 วันทำการ",
      "  ความเสี่ยง: กลาง (ต้อง validate ก่อน deploy)",
      "  ข้อแลก    : ต้องหยุด Champion ชั่วคราว ใช้ Challenger ระหว่างนั้น",
      "  ผู้รับผิดชอบ: Data Science Team",
      "",
      "ทางออก B -- Retrain พร้อมปรับ Feature ใหม่",
      "  ทำอะไร   : Review feature importance ก่อน เพิ่ม/ลด features แล้วค่อย retrain",
      "  ผลที่คาด  : โมเดลดีขึ้นระยะยาว ไม่ใช่แค่แก้ drift",
      "  ใช้เวลา   : 2-3 สัปดาห์",
      "  ความเสี่ยง: กลาง-สูง",
      "  ข้อแลก    : ใช้เวลานานกว่า ต้องมี business input",
      "  ผู้รับผิดชอบ: Data Science + Business Analyst",
      "",
      "ทางออก C -- จับตาดูก่อน อีก 1-2 สัปดาห์",
      "  ทำอะไร   : ติดตาม PSI และ Recall ทุกวัน ถ้า PSI > 0.20 ให้ retrain ทันที",
      "  ผลที่คาด  : เสี่ยง performance แย่ลงถ้า drift ยังขยับ",
      "  ความเสี่ยง: สูง",
      "  ข้อแลก    : ไม่ต้องใช้ resource ทันที แต่เสี่ยงสะสมปัญหา",
      "",
      "ARIA แนะนำ: ทางออก A",
      "เหตุผล    : Drift อยู่ระดับที่ควรทำทันทีและมีข้อมูลพอ",
      "ความมั่นใจ : สูง",
      "ข้อควรระวัง: ถ้า pattern เปลี่ยนมาก ให้พิจารณาทางออก B",
      "",
      "ขั้นตอนต่อไป:",
      "1. ทันที   -> Pull ข้อมูล 6 เดือนล่าสุด เตรียม training pipeline",
      "2. วันที่ 2 -> เปิด Challenger model รับ production traffic ระหว่าง retrain",
      "3. วันที่ 5 -> Validate ผล retrain บน holdout set ก่อน deploy",
      "4. Trigger -> ถ้า Recall ลดต่ำกว่า 80% ให้ escalate ทันที",
      "---",
    ].join("\n"),
    en: [
      "---",
      "🔁 Recommendation: Retrain the model",
      "",
      "Why now:",
      driftLineEn,
      "If left alone, Recall and Precision may drop in 2-4 weeks",
      "",
      "Option A -- Retrain now with recent data",
      "  Action: Retrain on the latest 6 months",
      "  Expected: KPIs back to target in 1-2 weeks",
      "  Time: 3-5 working days",
      "  Risk: Medium (validate before deploy)",
      "  Trade-off: Use Challenger while retraining",
      "  Owner: Data Science Team",
      "",
      "Option B -- Retrain with feature updates",
      "  Action: Review feature importance, then retrain",
      "  Expected: Better long-term stability",
      "  Time: 2-3 weeks",
      "  Risk: Medium-High",
      "  Trade-off: Longer cycle + business input",
      "  Owner: Data Science + Business Analyst",
      "",
      "Option C -- Monitor 1-2 weeks",
      "  Action: Track PSI/Recall daily; retrain if PSI > 0.20",
      "  Expected: Risk of continued drift",
      "  Risk: High",
      "  Trade-off: Saves resources but risks degradation",
      "",
      "ARIA recommends: Option A",
      "Rationale: Drift is actionable and data is sufficient",
      "Confidence: High",
      "Caveat: If patterns shift sharply, consider Option B",
      "",
      "Next steps:",
      "1. Immediately pull the last 6 months of data",
      "2. Day 2: Route traffic to Challenger during retrain",
      "3. Day 5: Validate on holdout before deploy",
      "4. Trigger: Escalate if Recall < 80%",
      "---",
    ].join("\n"),
  };
}

function buildHelpMessage(): LangText {
  return {
    th: [
      "---",
      "ช่วยอะไรได้บ้างครับ:",
      "1. ดูสถานะ KPI (พิมพ์ 1)",
      "2. หาสาเหตุ (พิมพ์ 2)",
      "3. ทางออก (พิมพ์ 3)",
      "4. จำลองสถานการณ์ (พิมพ์ 4)",
      "5. สรุปรายสัปดาห์ (พิมพ์ 5)",
      "พิมพ์ \"retrain\" เพื่อดูแผน retrain แบบเต็ม",
      "เริ่มจากข้อไหนครับ?",
      "---",
    ].join("\n"),
    en: [
      "---",
      "What I can help with:",
      "1. KPI status (type 1)",
      "2. Root cause (type 2)",
      "3. Remediation options (type 3)",
      "4. Scenario analysis (type 4)",
      "5. Weekly digest (type 5)",
      "Type \"retrain\" for the retrain plan",
      "Which one should we start with?",
      "---",
    ].join("\n"),
  };
}

function detectKpiKey(input: string): KpiKey | null {
  const matchers: Array<[KpiKey, string[]]> = [
    ["recall", ["recall", "รีคอล", "อัตราการตรวจจับ"]],
    ["precision", ["precision", "พรีซิชัน", "ความแม่นยำ"]],
    ["f1", ["f1", "f1-score", "f1 score", "เอฟวัน"]],
    ["auc", ["auc", "auc-roc"]],
    ["fpr", ["fpr", "false positive", "false-positive", "fp rate", "อัตรา false positive"]],
    ["psi", ["psi", "model drift", "โมเดลดริฟต์", "ดริฟต์โมเดล"]],
    ["concept_drift", ["concept drift", "คอนเซปต์ดริฟต์", "คอนเซ็ปต์ดริฟต์"]],
    ["data_drift", ["data drift", "ดาต้าดริฟต์", "ดริฟต์ข้อมูล"]],
    ["latency", ["latency", "ความหน่วง", "ดีเลย์"]],
    ["throughput", ["throughput", "tps", "อัตราผ่าน"]],
    ["cpu", ["cpu", "ram", "ซีพียู", "แรม", "cpu/ram"]],
    ["mcc", ["mcc"]],
    ["accuracy", ["accuracy", "ความถูกต้อง"]],
  ];
  for (const [key, words] of matchers) {
    if (words.some((w) => input.includes(w))) return key;
  }
  return null;
}

function collectAlerts(signals: AllSignals): LangText[] {
  const alerts: LangText[] = [];
  if (signals.recall < 0.8) {
    alerts.push({
      th: `⚠️ ALERT: Recall อยู่ที่ ${fmtPct(signals.recall)} ต่ำกว่าเป้าเตือน 80%`,
      en: `⚠️ ALERT: Recall is ${fmtPct(signals.recall)} below the 80% alert`,
    });
  }
  if (signals.precision < 0.6) {
    alerts.push({
      th: `⚠️ ALERT: Precision อยู่ที่ ${fmtPct(signals.precision)} ต่ำกว่าเป้าเตือน 60%`,
      en: `⚠️ ALERT: Precision is ${fmtPct(signals.precision)} below the 60% alert`,
    });
  }
  if (signals.f1 < 0.7) {
    alerts.push({
      th: `⚠️ ALERT: F1 อยู่ที่ ${fmtRatio(signals.f1, 2)} ต่ำกว่าเป้าเตือน 0.70`,
      en: `⚠️ ALERT: F1 is ${fmtRatio(signals.f1, 2)} below 0.70`,
    });
  }
  if (signals.psi > 0.2) {
    alerts.push({
      th: `⚠️ ALERT: PSI ${fmtRatio(signals.psi, 2)} เกินเป้าเตือน 0.20`,
      en: `⚠️ ALERT: PSI ${fmtRatio(signals.psi, 2)} above 0.20`,
    });
  }
  if (signals.latencyMs > 1000) {
    alerts.push({
      th: `⚠️ ALERT: Latency ${fmtRatio(signals.latencyMs, 0)}ms สูงกว่าเป้าเตือน 1000ms`,
      en: `⚠️ ALERT: Latency ${fmtRatio(signals.latencyMs, 0)}ms above 1000ms`,
    });
  }
  return alerts;
}

function applyAlertHeader(message: LangText, alerts: LangText[]): LangText {
  if (alerts.length === 0) return message;
  const alertTh = alerts.map((a) => a.th).join("\n");
  const alertEn = alerts.map((a) => a.en).join("\n");
  return {
    th: `${alertTh}\n\n${message.th}`,
    en: `${alertEn}\n\n${message.en}`,
  };
}

function pickFocusKpi(signals: AllSignals, trace: RuleTrace): KpiKey {
  if (signals.psi >= 0.1) return "psi";
  if (signals.recall < 0.85) return "recall";
  if (signals.precision < 0.7) return "precision";
  if (signals.f1 < 0.78) return "f1";
  if (trace.conceptDrift.result === "Drifted") return "concept_drift";
  return "recall";
}

const KPI_FOLLOWUPS: LangText[] = [
  { en: "Recall", th: "Recall" },
  { en: "Precision", th: "Precision" },
  { en: "F1 Score", th: "F1 Score" },
  { en: "Model Drift", th: "Model Drift" },
  { en: "Latency", th: "Latency" },
];

export function matchIntent(
  input: string,
  signals: AllSignals,
  trace: RuleTrace,
  decision: Decision,
  context: ChatContext = {},
): ChatResponse {
  const normalized = input.trim().toLowerCase();
  const has = (words: string[]) => words.some((w) => normalized.includes(w));
  const kpiKey = detectKpiKey(normalized);
  const alerts = collectAlerts(signals);

  const respond = (payload: ChatResponse): ChatResponse => {
    const message = applyAlertHeader(payload.message, alerts);
    return { ...payload, message };
  };

  if (context.pending === "root_cause") {
    if (kpiKey) {
      return respond({
        intent: "root_cause",
        title: { en: "Root Cause", th: "ดูว่าเกิดอะไรขึ้น" },
        message: buildRootCauseMessage(kpiKey, signals, trace),
        nextContext: { pending: undefined, lastKpi: kpiKey },
      });
    }
    return respond({
      intent: "root_cause",
      title: { en: "Which KPI?", th: "อยากดูสาเหตุของ KPI ไหนครับ?" },
      message: { en: "Pick a KPI to analyze.", th: "เลือก KPI ที่อยากเจาะลึกได้เลยครับ" },
      followups: KPI_FOLLOWUPS,
      nextContext: { pending: "root_cause", lastKpi: context.lastKpi },
    });
  }

  if (context.pending === "options") {
    if (kpiKey || context.lastKpi) {
      const target = kpiKey ?? context.lastKpi ?? "recall";
      return respond({
        intent: "remediation",
        title: { en: "Remediation options", th: "ทางออก" },
        message: buildRemediationMessage(target, signals, trace, decision),
        nextContext: { pending: undefined, lastKpi: target },
      });
    }
    return respond({
      intent: "remediation",
      title: { en: "Which KPI?", th: "อยากดูทางออกของ KPI ไหนครับ?" },
      message: { en: "Pick a KPI to build options.", th: "เลือก KPI ที่อยากดูทางออกได้เลยครับ" },
      followups: KPI_FOLLOWUPS,
      nextContext: { pending: "options", lastKpi: context.lastKpi },
    });
  }

  if (context.pending === "scenario") {
    const change = normalized || "(unspecified change)";
    return respond({
      intent: "scenario",
      title: { en: "Scenario analysis", th: "จำลองสถานการณ์" },
      message: buildScenarioMessage(change, signals),
      nextContext: { pending: undefined, lastKpi: context.lastKpi },
    });
  }

  if (normalized === "1" || has(["kpi status", "ตรวจสอบสถานะ kpi"])) {
    const message = buildKpiStatusMessage(signals, trace);
    return respond({
      intent: "kpi_status",
      title: { en: "KPI status", th: "สถานะ KPI" },
      message,
      nextContext: { pending: undefined, lastKpi: pickFocusKpi(signals, trace) },
    });
  }

  if (normalized === "2" || has(["root cause", "วิเคราะห์สาเหตุ", "ทำไม", "why"])) {
    if (kpiKey) {
      return respond({
        intent: "root_cause",
        title: { en: "Root Cause", th: "ดูว่าเกิดอะไรขึ้น" },
        message: buildRootCauseMessage(kpiKey, signals, trace),
        nextContext: { pending: undefined, lastKpi: kpiKey },
      });
    }
    return respond({
      intent: "root_cause",
      title: { en: "Which KPI?", th: "อยากดูสาเหตุของ KPI ไหนครับ?" },
      message: { en: "Pick a KPI to analyze.", th: "เลือก KPI ที่อยากเจาะลึกได้เลยครับ" },
      followups: KPI_FOLLOWUPS,
      nextContext: { pending: "root_cause", lastKpi: context.lastKpi },
    });
  }

  if (normalized === "3" || has(["ทางออก", "แผน", "remediation", "options"])) {
    if (kpiKey || context.lastKpi) {
      const target = kpiKey ?? context.lastKpi ?? "recall";
      return respond({
        intent: "remediation",
        title: { en: "Remediation options", th: "ทางออก" },
        message: buildRemediationMessage(target, signals, trace, decision),
        nextContext: { pending: undefined, lastKpi: target },
      });
    }
    return respond({
      intent: "remediation",
      title: { en: "Which KPI?", th: "อยากดูทางออกของ KPI ไหนครับ?" },
      message: { en: "Pick a KPI to build options.", th: "เลือก KPI ที่อยากดูทางออกได้เลยครับ" },
      followups: KPI_FOLLOWUPS,
      nextContext: { pending: "options", lastKpi: context.lastKpi },
    });
  }

  if (normalized === "4" || has(["สถานการณ์จำลอง", "what if", "scenario"])) {
    return respond({
      intent: "scenario",
      title: { en: "Scenario analysis", th: "จำลองสถานการณ์" },
      message: { en: "What change do you want to simulate?", th: "อยากจำลองการเปลี่ยนอะไรครับ?" },
      nextContext: { pending: "scenario", lastKpi: context.lastKpi },
    });
  }

  if (normalized === "5" || has(["สรุปรายสัปดาห์", "weekly", "digest", "summary"])) {
    return respond({
      intent: "weekly_digest",
      title: { en: "Weekly digest", th: "สรุปรายสัปดาห์" },
      message: buildWeeklyDigest(signals, trace),
      nextContext: { pending: undefined, lastKpi: pickFocusKpi(signals, trace) },
    });
  }

  if (has(["retrain", "train model", "retrain model"])) {
    return respond({
      intent: "retrain",
      title: { en: "Retrain model", th: "Retrain โมเดล" },
      message: buildRetrainMessage(signals, trace),
      nextContext: { pending: undefined, lastKpi: "psi" },
    });
  }

  if (!normalized || has(["help", "ช่วยด้วย", "ทำอะไรได้บ้าง", "?"])) {
    return respond({
      intent: "help",
      title: { en: "Help", th: "เมนูช่วยเหลือ" },
      message: buildHelpMessage(),
      followups: [
        { en: "1", th: "1" },
        { en: "2", th: "2" },
        { en: "3", th: "3" },
        { en: "4", th: "4" },
        { en: "5", th: "5" },
        { en: "retrain", th: "retrain" },
      ],
      nextContext: { pending: undefined, lastKpi: context.lastKpi },
    });
  }

  if (kpiKey) {
    return respond({
      intent: "quick_status",
      title: { en: "KPI status", th: "สถานะ KPI" },
      message: buildQuickKpiStatus(kpiKey, signals, trace),
      nextContext: { pending: undefined, lastKpi: kpiKey },
    });
  }

  return respond({
    intent: "help",
    title: { en: "Help", th: "เมนูช่วยเหลือ" },
    message: buildHelpMessage(),
    followups: [
      { en: "1", th: "1" },
      { en: "2", th: "2" },
      { en: "3", th: "3" },
      { en: "4", th: "4" },
      { en: "5", th: "5" },
      { en: "retrain", th: "retrain" },
    ],
    nextContext: { pending: undefined, lastKpi: context.lastKpi },
  });
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