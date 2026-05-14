import { useMemo, useRef, useState } from "react";
// theme refresh
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  RefreshCcw,
  Undo2,
  SlidersHorizontal,
  Play,
  Activity,
  Target,
  Filter,
  Layers,
  Crosshair,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CircuitBoard,
  Search,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { evaluate, toneClasses, type AllSignals, type Confidence, type DecisionAction } from "./decision-engine";
import { ModalButton, ModalShell, pushToast } from "./aml-interactions";

type Status = "green" | "yellow" | "red";
type Trend = "up" | "down" | "flat";

type Kpi = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  human: string;
  target: string;
  targetValue: number;
  comparison: "≥" | "≤";
  current: number;
  unit: "%" | "ratio";
  formula: string;
  note?: string;
  hint: string;
  trend: Trend;
  trendDelta: string;
  status: Status;
};

type SuspiciousAlert = {
  transactionId: string;
  amount: string;
  riskScore: number;
  corridor: string;
  status: "Flagged" | "Under Review" | "Cleared";
  pattern: string;
  review: string;
};

const ALERT_ROWS: SuspiciousAlert[] = [
  { transactionId: "TX-8842193", amount: "$1.25M", riskScore: 0.97, corridor: "TH → SG", status: "Flagged", pattern: "BIPARTITE", review: "Review →" },
  { transactionId: "TX-8841502", amount: "$1.70M", riskScore: 0.95, corridor: "TH → HK", status: "Flagged", pattern: "GATHER-SCATTER", review: "Review →" },
  { transactionId: "TX-8842155", amount: "$842.3K", riskScore: 0.93, corridor: "TH → HK", status: "Flagged", pattern: "FAN-OUT", review: "Review →" },
  { transactionId: "TX-8842090", amount: "$512.8K", riskScore: 0.88, corridor: "Domestic", status: "Under Review", pattern: "CYCLE", review: "Review →" },
  { transactionId: "TX-8841977", amount: "$298.4K", riskScore: 0.84, corridor: "TH → AE", status: "Flagged", pattern: "SCATTER-GATHER", review: "Review →" },
  { transactionId: "TX-8841377", amount: "$421.0K", riskScore: 0.82, corridor: "TH → US", status: "Under Review", pattern: "FAN-OUT", review: "Review →" },
  { transactionId: "TX-8841842", amount: "$188.1K", riskScore: 0.79, corridor: "Domestic", status: "Under Review", pattern: "STACK", review: "Review →" },
  { transactionId: "TX-8841710", amount: "$96.5K", riskScore: 0.74, corridor: "TH → SG", status: "Under Review", pattern: "FAN-IN", review: "Review →" },
  { transactionId: "TX-8841655", amount: "$72.2K", riskScore: 0.68, corridor: "Domestic", status: "Cleared", pattern: "RANDOM", review: "Review →" },
];

const BUSINESS_METRICS = {
  detectedValue: "$54.72M",
  totalAlerts: 134024,
  suspiciousGrowth: "+9.6% / 10d",
  crossBorderRatio: "73.1%",
  crossBorderTone: "Critical",
  queue: 12408,
  escalated: 4982,
  cleared: 116634,
};

const kpis: Kpi[] = [
  {
    id: "recall",
    name: "Recall",
    icon: <Crosshair className="w-4 h-4" />,
    description: "Detection rate of true suspicious transactions",
    human: "System detects ~83 of every 100 suspicious transactions",
    target: "≥ 85%",
    targetValue: 85,
    comparison: "≥",
    current: 83.0,
    unit: "%",
    formula: "TP / (TP + FN)",
    hint: "Below target — retraining or tuning is required to recover detection.",
    trend: "down",
    trendDelta: "−1.2 pts vs last week",
    status: "red",
  },
  {
    id: "precision",
    name: "Precision",
    icon: <Target className="w-4 h-4" />,
    description: "Share of flagged transactions that are true suspicious cases",
    human: "~88 of every 100 alerts are confirmed as real risks",
    target: "≥ 86%",
    targetValue: 86,
    comparison: "≥",
    current: 88.0,
    unit: "%",
    formula: "TP / (TP + FP)",
    hint: "Within target — alert quality is acceptable.",
    trend: "flat",
    trendDelta: "+0.3 pts vs last week",
    status: "green",
  },
  {
    id: "f1",
    name: "F1-Score",
    icon: <Activity className="w-4 h-4" />,
    description: "Harmonic mean of Precision and Recall",
    human: "Balanced score sits below target, signaling uneven performance",
    target: "≥ 82%",
    targetValue: 82,
    comparison: "≥",
    current: 78.0,
    unit: "%",
    formula: "2 * (Precision * Recall) / (Precision + Recall)",
    hint: "Below target — tune thresholds or refresh training data.",
    trend: "down",
    trendDelta: "−0.9 pts vs last week",
    status: "red",
  },
  {
    id: "accuracy",
    name: "Accuracy",
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: "Share of all transactions correctly classified",
    human: "Overall classification accuracy remains stable",
    target: "≥ 80%",
    targetValue: 80,
    comparison: "≥",
    current: 81.0,
    unit: "%",
    formula: "(TP + TN) / (TP + TN + FP + FN)",
    hint: "Within target — overall correctness is acceptable.",
    trend: "flat",
    trendDelta: "+0.1 pts vs last week",
    status: "green",
  },
  {
    id: "mcc",
    name: "Matthews Correlation Coefficient (MCC)",
    icon: <ShieldCheck className="w-4 h-4" />,
    description: "Balanced correlation across TP, TN, FP, and FN",
    human: "MCC captures all four outcomes in one score (-1 to 1)",
    target: "≥ 0.60",
    targetValue: 0.6,
    comparison: "≥",
    current: 0.55,
    unit: "ratio",
    formula: "((TP*TN)-(FP*FN)) / sqrt((TP+FP)(TP+FN)(TN+FP)(TN+FN))",
    note: "MCC is robust to class imbalance and uses all four confusion-matrix terms.",
    hint: "Below target — model stability is weakening and requires investigation.",
    trend: "down",
    trendDelta: "−0.04 vs last week",
    status: "red",
  },
];

const statusMeta: Record<Status, {
  label: string;
  badge: string;
  bar: string;
  dot: string;
  ring: string;
}> = {
  green: {
    label: "Meets target",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  yellow: {
    label: "Near threshold",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  red: {
    label: "Violation",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    ring: "ring-rose-200",
  },
};

function StatusPill({ status }: { status: Status }) {
  const m = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${m.badge}`} style={{ fontSize: 11, fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function TrendIcon({ trend, delta }: { trend: Trend; delta: string }) {
  const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const color = trend === "up" ? "text-rose-600" : trend === "down" ? "text-amber-600" : "text-slate-400";
  return (
    <span className={`inline-flex items-center gap-1 ${color}`} style={{ fontSize: 11 }}>
      <Icon className="w-3.5 h-3.5" />
      {delta}
    </span>
  );
}

function GaugeBar({ kpi }: { kpi: Kpi }) {
  // Normalize: for ≥ comparisons, fill = current / 100. For ≤ comparisons, fill = current / (target * 2.5) capped.
  const m = statusMeta[kpi.status];
  const min = kpi.unit === "ratio" ? -1 : 0;
  const max =
    kpi.unit === "ratio"
      ? 1
      : kpi.comparison === "≥"
        ? 100
        : Math.max(kpi.targetValue * 2.5, kpi.current * 1.1);
  const clamped = Math.min(max, Math.max(min, kpi.current));
  const pct = Math.min(100, ((clamped - min) / (max - min)) * 100);
  const targetPct = Math.min(100, ((kpi.targetValue - min) / (max - min)) * 100);
  const unitLabel = kpi.unit === "ratio" ? "" : kpi.unit;
  const minLabel = kpi.unit === "ratio" ? "-1" : "0";
  const maxLabel = kpi.unit === "ratio" ? "1" : `${Math.round(max)}`;
  return (
    <div className="w-full">
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`absolute left-0 top-0 h-full ${m.bar} rounded-full`} style={{ width: `${pct}%` }} />
        <div
          className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-slate-700"
          style={{ left: `${targetPct}%` }}
          title={`Target ${kpi.target}`}
        />
      </div>
      <div className="flex items-center justify-between mt-1 text-slate-500 tabular-nums" style={{ fontSize: 10 }}>
        <span>{minLabel}{unitLabel}</span>
        <span>Target {kpi.target}</span>
        <span>{maxLabel}{unitLabel}</span>
      </div>
    </div>
  );
}

type SystemStatus = "Stable" | "Warning" | "Critical";

function deriveSystemStatus(items: Kpi[]): { status: SystemStatus; reasoning: string } {
  const offenders = items.filter((k) => k.status !== "green");
  const criticalKpiViolated = items.some(
    (k) => (k.id === "recall" || k.id === "mcc") && k.status === "red"
  );
  if (criticalKpiViolated) {
    return {
      status: "Critical",
      reasoning: "A critical KPI (Recall or MCC) is in violation. Immediate decision required.",
    };
  }
  if (offenders.length === 0) {
    return { status: "Stable", reasoning: "All KPIs are within their strategic thresholds." };
  }
  return {
    status: "Warning",
    reasoning: `${offenders.length} KPI${offenders.length > 1 ? "s" : ""} drifting near or beyond target.`,
  };
}

function deriveActions(
  items: Kpi[],
  decisionAction: DecisionAction,
): {
  primary: { label: string; action: "retrain" | "threshold" | "optimize" | "continue"; tone: "danger" | "warn" | "ok"; reason: string };
  secondary: { label: string; reason: string }[];
} {
  const recall = items.find((k) => k.id === "recall")!;
  const precision = items.find((k) => k.id === "precision")!;
  const f1 = items.find((k) => k.id === "f1")!;
  const accuracy = items.find((k) => k.id === "accuracy")!;
  const mcc = items.find((k) => k.id === "mcc")!;
  const offenders = items.filter((k) => k.status !== "green").length;

  const recs: { label: string; reason: string }[] = [];
  if (recall.status !== "green") recs.push({ label: "Recover Recall", reason: `Recall ${recall.current}% is below the ${recall.target} target.` });
  if (precision.status !== "green") recs.push({ label: "Improve Precision", reason: `Precision ${precision.current}% is below ${precision.target}.` });
  if (f1.status !== "green") recs.push({ label: "Balance F1", reason: `F1-Score ${f1.current}% is below ${f1.target}.` });
  if (accuracy.status !== "green") recs.push({ label: "Verify Accuracy", reason: `Accuracy ${accuracy.current}% is below ${accuracy.target}.` });
  if (mcc.status !== "green") recs.push({ label: "Audit MCC", reason: `MCC ${mcc.current} is below ${mcc.target}.` });
  if (offenders >= 3) recs.push({ label: "Review model stability", reason: `${offenders} KPIs are simultaneously degrading.` });

  let primary: ReturnType<typeof deriveActions>["primary"];
  if (decisionAction === "Retrain_Model") {
    primary = {
      label: "Retrain model",
      action: "retrain",
      tone: "danger",
      reason: "Concept drift detected — retraining is required to restore model validity.",
    };
  } else if (decisionAction === "Tune_Model") {
    primary = {
      label: "Tune model",
      action: "threshold",
      tone: "warn",
      reason: "Data drift detected — tune thresholds or features before retraining.",
    };
  } else if (decisionAction === "Optimize_System") {
    primary = {
      label: "Optimize system",
      action: "optimize",
      tone: "warn",
      reason: "System efficiency is degraded — optimize resources and latency first.",
    };
  } else {
    primary = {
      label: "Continue current model",
      action: "continue",
      tone: "ok",
      reason: "All KPIs within target — no model intervention required.",
    };
  }

  return { primary, secondary: recs };
}

export function DetectionOverviewScreen() {
  const signals: AllSignals = useMemo(
    () => ({
      mcc: 0.55,
      precision: 0.88,
      recall: 0.83,
      f1: 0.78,
      accuracy: 0.81,
      graphDensity: 0.35,
      nodeCentrality: 0.52,
      motifSimilarity: 0.72,
      featureImportance: 0.08,
      edgeWeights: 0.45,
      learningRate: 0.005,
      treeDepth: 6,
      missingPct: 0.02,
      labelImbalance: 8.5,
      psi: 0.07,
      throughput: 145,
      latencyMs: 220,
      cpuRamUsage: 0.65,
    }),
    [],
  );
  const { decision, trace } = useMemo(() => evaluate(signals), [signals]);
  const system = useMemo(() => deriveSystemStatus(kpis), []);
  const actions = useMemo(() => deriveActions(kpis, decision.action), [decision.action]);
  const tone = toneClasses[decision.tone];
  const [transactionSearch, setTransactionSearch] = useState("");

  const [traceOpen, setTraceOpen] = useState(false);
  const traceRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<null | "threshold" | "retrain" | "rollback">(null);
  const [thresholdDraft, setThresholdDraft] = useState(0.5);
  const [rollbackInput, setRollbackInput] = useState("");

  const previewRecall = Math.max(70, 96 - thresholdDraft * 30).toFixed(1);
  const previewPrecision = Math.min(98, 50 + thresholdDraft * 45).toFixed(1);

  const handleContinue = () => {
    pushToast({
      tone: "green",
      title: "Model continues monitoring / โมเดลดำเนินการต่อ",
      sub: "Rule 8-1 Active — no intervention required",
    });
  };
  const handleApplyThreshold = () => {
    setModal(null);
    pushToast({
      tone: "amber",
      title: `Threshold updated to τ = ${thresholdDraft.toFixed(2)}`,
      sub: `Recall ${previewRecall}% · Precision ${previewPrecision}%`,
    });
  };
  const handleOptimize = () => {
    pushToast({
      tone: "amber",
      title: "Optimizing system resources",
      sub: "Scaling queues and rebalancing CPU/RAM allocation.",
    });
  };
  const handleRetrainConfirm = (label: string) => {
    setModal(null);
    pushToast({ tone: "red", title: "Initiating re-train…", sub: "กำลังเริ่มต้นฝึกโมเดล…" }, 2000);
    setTimeout(
      () => pushToast({ tone: "amber", title: `Training in progress · ${label}`, sub: "กำลังฝึก…" }, 2500),
      1800,
    );
    setTimeout(
      () => pushToast({ tone: "green", title: "Re-train complete", sub: "ฝึกโมเดลเสร็จแล้ว" }),
      4400,
    );
  };
  const handleRollback = () => {
    setModal(null);
    setRollbackInput("");
    pushToast({
      tone: "red",
      title: "Emergency rollback executed",
      sub: "ย้อนกลับเป็นโมเดลก่อนหน้า — Rule Engine refreshed",
    }, 4000);
  };

  const expandTrace = () => {
    setTraceOpen(true);
    setTimeout(() => traceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const confidenceMeta: Record<Confidence, { dot: string; text: string; bar: string; pct: number }> = {
    High: { dot: "bg-emerald-500", text: "text-emerald-700", bar: "bg-emerald-500", pct: 92 },
    Medium: { dot: "bg-amber-500", text: "text-amber-700", bar: "bg-amber-500", pct: 65 },
    Low: { dot: "bg-rose-500", text: "text-rose-700", bar: "bg-rose-500", pct: 35 },
  };
  const conf = confidenceMeta[decision.confidence];

  const systemTone =
    system.status === "Critical"
      ? { ring: "ring-rose-200", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: <AlertOctagon className="w-5 h-5" /> }
      : system.status === "Warning"
        ? { ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <AlertTriangle className="w-5 h-5" /> }
        : { ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: <ShieldCheck className="w-5 h-5" /> };

  const primaryToneClasses =
    actions.primary.tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white"
      : actions.primary.tone === "warn"
        ? "bg-amber-500 hover:bg-amber-600 text-white"
        : "bg-emerald-600 hover:bg-emerald-700 text-white";

  const primaryActionThai =
    actions.primary.action === "retrain"
      ? "ฝึกโมเดลใหม่"
      : actions.primary.action === "threshold"
        ? "ปรับแต่งโมเดล"
        : actions.primary.action === "optimize"
          ? "ปรับปรุงระบบ"
          : "ดำเนินการต่อ";

  const primaryActionSubThai =
    actions.primary.action === "retrain"
      ? "ควรฝึกโมเดลใหม่เพื่อแก้ Concept Drift"
      : actions.primary.action === "threshold"
        ? "ปรับค่าเพื่อให้ Precision และ Recall สมดุล"
        : actions.primary.action === "optimize"
          ? "เพิ่มประสิทธิภาพระบบก่อนปรับโมเดล"
          : "ทุกค่าอยู่ในเกณฑ์ที่ยอมรับได้";

      const filteredAlerts = useMemo(
        () => ALERT_ROWS.filter((row) => {
          const query = transactionSearch.trim().toLowerCase();
          if (!query) return true;
          return [row.transactionId, row.amount, row.corridor, row.pattern, row.status]
            .join(" ")
            .toLowerCase()
            .includes(query);
        }),
        [transactionSearch],
      );

  return (
    <div className="space-y-6">
      {/* Business value overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5 rounded-2xl shadow-sm bg-white border-slate-200 overflow-hidden">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600 }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="lang-en">Step 1 · Detection Overview</span>
                  <span className="lang-bi-sep text-slate-300">·</span>
                  <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ขั้นตอน 1 · ภาพรวมการตรวจจับ</span>
                </div>
                <h1 className="text-slate-900 mt-1" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
                  <span className="lang-en">Detected Suspicious Value</span>
                  <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>มูลค่าต้องสงสัยที่ตรวจพบ</span>
                </h1>
                <p className="text-slate-500 mt-2 max-w-2xl" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  <span className="lang-en">This screen translates model output into business value: how much suspicious value was intercepted, how much review pressure remains, and where to prioritize compliance effort.</span>
                  <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>หน้านี้แปลงผลโมเดลเป็นมูลค่าทางธุรกิจ: ตรวจพบมูลค่าต้องสงสัยเท่าไร ยังมีภาระงานค้างเท่าไร และควรจัดลำดับการตรวจสอบตรงไหนก่อน</span>
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700" style={{ fontSize: 11, fontWeight: 700 }}>
                <ShieldCheck className="w-3.5 h-3.5" /> AML-P-04 §3.2
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-slate-500 uppercase tracking-[0.5px]" style={{ fontSize: 11, fontWeight: 600 }}>Info / ข้อมูล</div>
                <div className="mt-2 text-slate-900" style={{ fontSize: 34, lineHeight: 1, fontWeight: 800, letterSpacing: -0.8 }}>
                  {BUSINESS_METRICS.detectedValue}
                </div>
                <div className="mt-2 text-slate-600" style={{ fontSize: 13 }}>
                  <span className="lang-en">Estimated</span>
                  <span className="lang-bi-sep"> / </span>
                  <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ประมาณการ</span>
                  <span className="text-slate-400"> — </span>
                  <span className="lang-en">Scenario upper bound — not realized loss</span>
                  <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ขอบบนตามสถานการณ์ — ยังไม่ใช่ความสูญเสียที่เกิดขึ้นจริง</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-slate-400 uppercase" style={{ fontSize: 10, fontWeight: 600 }}>30D</div>
                    <div className="mt-1 text-slate-900" style={{ fontSize: 18, fontWeight: 800 }}>{BUSINESS_METRICS.totalAlerts.toLocaleString()}</div>
                    <div className="text-slate-500" style={{ fontSize: 11 }}>Total alerts</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-slate-400 uppercase" style={{ fontSize: 10, fontWeight: 600 }}>Trend</div>
                    <div className="mt-1 text-slate-900" style={{ fontSize: 18, fontWeight: 800 }}>{BUSINESS_METRICS.suspiciousGrowth}</div>
                    <div className="text-slate-500" style={{ fontSize: 11 }}>Suspicious tx growth</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-slate-400 uppercase" style={{ fontSize: 10, fontWeight: 600 }}>Policy</div>
                    <div className="mt-1 text-slate-900" style={{ fontSize: 18, fontWeight: 800 }}>60%</div>
                    <div className="text-slate-500" style={{ fontSize: 11 }}>Tolerance threshold</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-slate-500 uppercase tracking-[0.5px]" style={{ fontSize: 11, fontWeight: 600 }}>Operational signals</div>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2">
                    <div>
                      <div className="text-slate-500" style={{ fontSize: 11 }}>Total Alerts</div>
                      <div className="text-slate-900" style={{ fontSize: 18, fontWeight: 800 }}>134,024</div>
                    </div>
                    <div className="text-right text-slate-500" style={{ fontSize: 12, lineHeight: 1.4 }}>
                      <div className="font-semibold text-slate-700">Flagged transactions</div>
                      <div>30d window</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="text-slate-500" style={{ fontSize: 11 }}>Cross-Border Ratio</div>
                        <div className="text-rose-600" style={{ fontSize: 18, fontWeight: 800 }}>{BUSINESS_METRICS.crossBorderRatio}</div>
                      </div>
                      <div className="text-right" style={{ fontSize: 12 }}>
                        <div className="font-semibold text-rose-600">Critical / วิกฤต</div>
                        <div className="text-slate-500">Above 60% limit</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className="h-full bg-rose-500"
                          style={{ width: "73.1%" }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-slate-600">Cross-border: 73.1%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-slate-300" />
                          <span className="text-slate-600">Domestic: 26.9%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2">
                    <div>
                      <div className="text-slate-500" style={{ fontSize: 11 }}>Queue status</div>
                      <div className="text-slate-900" style={{ fontSize: 18, fontWeight: 800 }}>Pending review</div>
                    </div>
                    <div className="text-right text-slate-500" style={{ fontSize: 12 }}>
                      <div className="font-semibold text-slate-700">Queue / Escalated / Cleared</div>
                      <div>12,408 / 4,982 / 116,634</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl shadow-sm bg-white border-slate-200">
          <div className="text-slate-500 uppercase tracking-[0.5px]" style={{ fontSize: 11, fontWeight: 600 }}>Value at risk / มูลค่าที่เสี่ยง</div>
          <div className="mt-2 text-slate-900" style={{ fontSize: 22, fontWeight: 800 }}>{BUSINESS_METRICS.crossBorderRatio}</div>
          <div className="text-slate-600 mt-1" style={{ fontSize: 13 }}>
            <span className="lang-en">Cross-border flow is above tolerance and creates the highest review pressure.</span>
            <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ธุรกรรมข้ามประเทศสูงกว่าเกณฑ์และสร้างภาระการตรวจสอบมากที่สุด</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              <span className="text-slate-500" style={{ fontSize: 12 }}>Queue</span>
              <span className="font-semibold text-slate-900">12,408</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              <span className="text-slate-500" style={{ fontSize: 12 }}>Escalated</span>
              <span className="font-semibold text-slate-900">4,982</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              <span className="text-slate-500" style={{ fontSize: 12 }}>Cleared</span>
              <span className="font-semibold text-slate-900">116,634</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 rounded-2xl shadow-sm bg-white border-slate-200 overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <div className="text-slate-500 uppercase tracking-[0.5px]" style={{ fontSize: 11, fontWeight: 600 }}>Alert Queue / คิวแจ้งเตือน</div>
              <div className="text-slate-900 mt-1" style={{ fontSize: 18, fontWeight: 700 }}>Transactions pending compliance review</div>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 border border-slate-200">Queue</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">Escalated</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">Cleared</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                placeholder="Search transaction ID…"
                aria-label="Search transaction ID"
                className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                style={{ fontSize: 13 }}
              />
            </div>
            <div className="text-slate-500 text-xs">Showing {filteredAlerts.length} of {ALERT_ROWS.length} alerts</div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left" style={{ fontSize: 13 }}>
              <thead className="bg-slate-50 text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Corridor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">FATF Pattern</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAlerts.map((row) => {
                  const statusColor = row.status === "Flagged" ? "text-rose-600" : row.status === "Under Review" ? "text-amber-600" : "text-emerald-600";
                  const statusBadge = row.status === "Flagged" ? "bg-rose-50 border-rose-200 text-rose-700" : row.status === "Under Review" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700";
                  return (
                    <tr key={row.transactionId} className="hover:bg-slate-50/70 align-top">
                      <td className="px-4 py-3 font-semibold text-slate-900 tabular-nums">{row.transactionId}</td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">{row.amount}</td>
                      <td className={`px-4 py-3 font-semibold tabular-nums ${statusColor}`}>{row.riskScore.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.corridor}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold ${statusBadge}`}>{row.status}</span></td>
                      <td className="px-4 py-3 text-slate-700">{row.pattern}</td>
                      <td className="px-4 py-3"><button type="button" className="text-blue-600 font-semibold hover:text-blue-700">{row.review}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Header row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600 }}>
            <span className="lang-en">Step 2 · Decision Surface</span>
            <span className="lang-bi-sep text-slate-300">·</span>
            <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ขั้นตอน 2 · พื้นผิวการตัดสินใจ</span>
          </div>
          <h1 className="text-slate-900 mt-1" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4 }}>
            <span className="lang-en">Decision Detail & Model Health</span>
            <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>รายละเอียดการตัดสินใจและสุขภาพของโมเดล</span>
          </h1>
          <div className="lang-th text-slate-500" style={{ fontSize: 13, fontFamily: "'Noto Sans Thai', sans-serif" }}>
            รายละเอียดการตัดสินใจและสุขภาพของโมเดล
          </div>
          <p className="text-slate-500 mt-1" style={{ fontSize: 13 }}>
            <span className="lang-en">
              <span className="text-slate-700" style={{ fontWeight: 600 }}>is the model still acceptable to use?</span>
            </span>
            <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
              ประสิทธิภาพโมเดลเทียบกับเกณฑ์เชิงกลยุทธ์ที่กำหนด คำถามที่หน้านี้ตอบ: <span style={{ fontWeight: 600 }}>โมเดลยังคงยอมรับได้อยู่หรือไม่?</span>
            </span>
          </p>
        </div>

        {/* Automated Decision Engine */}
        <Card className={`p-5 rounded-2xl shadow-sm bg-white border ${tone.soft} ring-1 ${tone.ring}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl ${tone.bg} ${tone.text} flex items-center justify-center`}>
                <CircuitBoard className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="text-slate-500 inline-flex items-center gap-1" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  <Sparkles className="w-3 h-3" />
                  <span className="lang-en">Automated Decision Engine</span>
                  <span className="lang-bi-sep">{" / "}</span>
                  <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif", textTransform: "none", letterSpacing: 0 }}>ระบบตัดสินใจอัตโนมัติ</span>
                </div>
                <div className="text-slate-500 mt-0.5" style={{ fontSize: 11 }}>
                  <span className="lang-en">System status</span>
                  <span className="lang-bi-sep">{" / "}</span>
                  <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>สถานะระบบ</span>
                  : <span className={`${systemTone.text}`} style={{ fontWeight: 600 }}>
                    <span className="lang-en">{system.status}</span>
                    <span className="lang-bi-sep">{" / "}</span>
                    <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>{system.status === "Critical" ? "วิกฤต" : system.status === "Warning" ? "เตือน" : "ปกติ"}</span>
                  </span>
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md ${tone.badge}`} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>
              {decision.rule}
            </span>
          </div>

          <div className="mt-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg ${tone.badge}`} style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>
              {decision.tag}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              <span className="lang-en">Confidence</span>
              <span className="lang-bi-sep">{" / "}</span>
              <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif", textTransform: "none", letterSpacing: 0 }}>ความมั่นใจ</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 ${conf.text}`} style={{ fontSize: 12, fontWeight: 600 }}>
              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
              <span className="lang-en">{decision.confidence}</span>
              <span className="lang-bi-sep">{" / "}</span>
              <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>{decision.confidence === "High" ? "สูง" : decision.confidence === "Medium" ? "กลาง" : "ต่ำ"}</span>
            </span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${conf.bar}`} style={{ width: `${conf.pct}%` }} />
            </div>
          </div>

          <p className="text-slate-700 mt-3" style={{ fontSize: 12 }}>{decision.explanation}</p>
          <p className="text-slate-500 mt-1 italic" style={{ fontSize: 11.5 }}>"{decision.plain}"</p>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8"
              style={{ fontSize: 11 }}
              onClick={expandTrace}
            >
              {traceOpen ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
              <span className="lang-en">Why this decision?</span>
              <span className="lang-bi-sep">{" / "}</span>
              <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ทำไมถึงตัดสินใจนี้?</span>
            </Button>
            <div className="flex items-center gap-1 ml-auto">
              {kpis.map((k) => (
                <Tooltip key={`sys-${k.id}`}>
                  <TooltipTrigger asChild>
                    <span
                      className={`w-2 h-2 rounded-full ${statusMeta[k.status].dot}`}
                      aria-label={k.name}
                      tabIndex={0}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{k.name} — {statusMeta[k.status].label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Rule Trace */}
      <div ref={traceRef}>
        {traceOpen && (
          <Card className={`p-5 rounded-2xl shadow-sm bg-white border ${tone.soft}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-slate-500 inline-flex items-center gap-1" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  <CircuitBoard className="w-3 h-3" /> Why this decision?
                </div>
                <div className="text-slate-900 mt-0.5" style={{ fontSize: 15, fontWeight: 600 }}>
                  Rule trace · {decision.rule} → <span className={tone.text}>{decision.tag}</span>
                </div>
                <div className="text-slate-500 mt-0.5" style={{ fontSize: 12 }}>
                  Conditions evaluated against the live KPI snapshot. Rules are evaluated across the 8 rule sets (1 → 8).
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTraceOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-50"
                aria-label="Collapse rule trace"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              Triggered Conditions / <span style={{ fontFamily: "'Noto Sans Thai', sans-serif", textTransform: "none", letterSpacing: 0 }}>เงื่อนไขที่ trigger</span>
            </div>
            <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {decision.conditions.map((c, i) => (
                <li
                  key={`cond-${i}`}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border ${
                    c.passed ? "bg-emerald-50/60 border-emerald-100" : "bg-rose-50/60 border-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {c.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div className="leading-tight">
                      <div className="text-slate-900" style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                      <div className="text-slate-500" style={{ fontSize: 11 }}>
                        Expected {c.expected} · actual <span className="tabular-nums">{c.actual}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`tabular-nums px-2 py-0.5 rounded-md border ${
                      c.passed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"
                    }`}
                    style={{ fontSize: 10, fontWeight: 700 }}
                  >
                    {c.passed ? "PASS" : "FAIL"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  SHAP Top Features / <span style={{ fontFamily: "'Noto Sans Thai', sans-serif", textTransform: "none", letterSpacing: 0 }}>Feature สำคัญ</span>
                </div>
                <ul className="mt-2 space-y-1 text-slate-700 tabular-nums" style={{ fontSize: 12 }}>
                  <li className="flex justify-between"><span>transaction_velocity</span><span className="text-rose-600">+0.34</span></li>
                  <li className="flex justify-between"><span>amount_zscore</span><span className="text-rose-600">+0.21</span></li>
                  <li className="flex justify-between"><span>time_since_last_txn</span><span className="text-amber-600">+0.18</span></li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  Rule Applied / <span style={{ fontFamily: "'Noto Sans Thai', sans-serif", textTransform: "none", letterSpacing: 0 }}>Rule ที่ใช้</span>
                </div>
                <div className="mt-2 text-slate-700" style={{ fontSize: 12, lineHeight: 1.55 }}>
                    <b className="text-slate-900">Rule 8:</b> Concept Drift = {trace.conceptDrift.result} · Data Drift = {trace.dataDrift.result} · System Efficiency = {trace.systemEfficiency.result} → <span className={tone.text} style={{ fontWeight: 700 }}>{decision.tag}</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Recommended Actions */}
      <Card className="p-5 rounded-2xl border-slate-200 shadow-sm bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              <Info className="w-3.5 h-3.5" />
              <span className="lang-en">Recommended Actions</span>
              <span className="lang-bi-sep">{" / "}</span>
              <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif", textTransform: "none", letterSpacing: 0 }}>การดำเนินการที่แนะนำ</span>
            </div>
            <div className="mt-1 text-slate-900" style={{ fontSize: 16, fontWeight: 600 }}>
              {actions.primary.label} / <span style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>{primaryActionThai}</span>
            </div>
            <div className="text-slate-600 mt-0.5" style={{ fontSize: 12 }}>{actions.primary.reason}</div>
            <div className="text-slate-500 mt-1" style={{ fontSize: 12, fontFamily: "'Noto Sans Thai', sans-serif" }}>
              {primaryActionSubThai}
            </div>

            {actions.secondary.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {actions.secondary.map((s, i) => (
                  <li key={`rec-${i}`} className="flex items-start gap-2 text-slate-700" style={{ fontSize: 12 }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                    <span><b className="text-slate-900">{s.label}.</b> <span className="text-slate-500">{s.reason}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:min-w-[700px]">
            <Button onClick={handleContinue} className={`h-12 rounded-lg ${actions.primary.action === "continue" ? primaryToneClasses : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`} style={{ fontSize: 12 }}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              <span className="flex flex-col items-start leading-tight">
                <span className="lang-en">Continue model</span>
                <span className="lang-th" style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Noto Sans Thai', sans-serif" }}>ดำเนินการต่อ</span>
              </span>
            </Button>
            <Button onClick={() => { setThresholdDraft(0.5); setModal("threshold"); }} className={`h-12 rounded-lg ${actions.primary.action === "threshold" ? primaryToneClasses : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`} style={{ fontSize: 12 }}>
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              <span className="flex flex-col items-start leading-tight">
                <span className="lang-en">Tune model</span>
                <span className="lang-th" style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Noto Sans Thai', sans-serif" }}>ปรับแต่งโมเดล</span>
              </span>
            </Button>
            <Button onClick={() => setModal("retrain")} title="ฝึกโมเดลใหม่" className={`h-12 rounded-lg ${actions.primary.action === "retrain" ? primaryToneClasses : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`} style={{ fontSize: 12 }}>
              <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
              <span className="flex flex-col items-start leading-tight">
                <span className="lang-en">Retrain model</span>
                <span className="lang-th" style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Noto Sans Thai', sans-serif" }}>ฝึกโมเดลใหม่</span>
              </span>
            </Button>
            <Button onClick={handleOptimize} className={`h-12 rounded-lg ${actions.primary.action === "optimize" ? primaryToneClasses : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`} style={{ fontSize: 12 }}>
              <CircuitBoard className="w-3.5 h-3.5 mr-1.5" />
              <span className="flex flex-col items-start leading-tight">
                <span className="lang-en">Optimize system</span>
                <span className="lang-th" style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Noto Sans Thai', sans-serif" }}>ปรับปรุงระบบ</span>
              </span>
            </Button>
            <Button onClick={() => { setRollbackInput(""); setModal("rollback"); }} className="h-12 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700" style={{ fontSize: 12 }}>
              <Undo2 className="w-3.5 h-3.5 mr-1.5" />
              <span className="flex flex-col items-start leading-tight">
                <span className="lang-en">Rollback</span>
                <span className="lang-th" style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Noto Sans Thai', sans-serif" }}>ย้อนกลับ</span>
              </span>
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Decision Table */}
      <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <div className="text-slate-900" style={{ fontSize: 15, fontWeight: 600 }}>
              <span className="lang-en">KPI Decision Table</span>
              <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ตารางการตัดสินใจ KPI</span>
            </div>
            <div className="text-slate-500 mt-0.5" style={{ fontSize: 12 }}>
              <span className="lang-en">Five strategic KPIs benchmarked against their target thresholds.</span>
              <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>KPI เชิงกลยุทธ์ 5 รายการเทียบกับเกณฑ์เป้าหมาย</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-500" style={{ fontSize: 11 }}>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="lang-en">meets target</span><span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ผ่านเกณฑ์</span></span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> <span className="lang-en">near threshold</span><span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ใกล้เกณฑ์</span></span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> <span className="lang-en">violation</span><span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ไม่ผ่านเกณฑ์</span></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ fontSize: 13 }}>
            <thead className="bg-slate-50 text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <tr>
                <th className="px-5 py-3" style={{ minWidth: 240 }}>KPI</th>
                <th className="px-5 py-3" style={{ minWidth: 240 }}>Description</th>
                <th className="px-5 py-3 whitespace-nowrap">Target</th>
                <th className="px-5 py-3" style={{ minWidth: 220 }}>Current value</th>
                <th className="px-5 py-3 whitespace-nowrap">Status</th>
                <th className="px-5 py-3 whitespace-nowrap">Trend</th>
                <th className="px-5 py-3" style={{ minWidth: 280 }}>Decision hint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {kpis.map((k) => {
                const m = statusMeta[k.status];
                return (
                  <tr key={k.id} className="hover:bg-slate-50/60 align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600`}>
                          {k.icon}
                        </div>
                        <div className="leading-tight">
                          <div className="text-slate-900" style={{ fontWeight: 600 }}>{k.name}</div>
                          <div className="text-slate-400 mt-0.5 tabular-nums" style={{ fontSize: 11 }}>{k.formula}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700">{k.description}</div>
                      <div className="mt-1 text-slate-500 italic" style={{ fontSize: 12 }}>"{k.human}"</div>
                      {k.note && (
                        <div className="mt-2 inline-flex items-start gap-1.5 px-2 py-1 rounded-md bg-sky-50 border border-sky-100 text-sky-800" style={{ fontSize: 11 }}>
                          <Info className="w-3 h-3 mt-0.5 shrink-0" /> {k.note}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-900 tabular-nums whitespace-nowrap" style={{ fontWeight: 600 }}>
                      {k.target}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-baseline gap-2">
                        <span className={`tabular-nums ${k.status === "red" ? "text-rose-600" : k.status === "yellow" ? "text-amber-600" : "text-emerald-600"}`} style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>
                          {k.current}{k.unit === "ratio" ? "" : k.unit}
                        </span>
                        <span className="text-slate-400" style={{ fontSize: 11 }}>/ {k.target}</span>
                      </div>
                      <div className="mt-2 max-w-[220px]">
                        <GaugeBar kpi={k} />
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusPill status={k.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <TrendIcon trend={k.trend} delta={k.trendDelta} />
                    </td>
                    <td className="px-5 py-4">
                      <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${m.badge}`} style={{ fontSize: 12 }}>
                        {k.status === "green" ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <span>{k.hint}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100" style={{ fontSize: 12 }}>
          <div className="text-slate-500">
            Targets sourced from institution policy <span className="text-slate-700">AML-P-04 §3.2</span>. Audit-citable.
          </div>
          <div className="text-slate-500">
            Evaluation window: last 30 days · n = 134,024 transactions
          </div>
        </div>
      </Card>

      {/* Threshold modal */}
      <ModalShell
        open={modal === "threshold"}
        onClose={() => setModal(null)}
        title="Adjust Detection Threshold / ปรับค่า Threshold"
        subtitle="Drag to preview Recall and Precision at the new τ before applying."
        tone="blue"
        footer={
          <>
            <ModalButton onClick={() => setModal(null)}>Cancel / ยกเลิก</ModalButton>
            <ModalButton variant="primary" onClick={handleApplyThreshold}>Apply / บันทึก</ModalButton>
          </>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "#8FA3BC" }}>0.30</span>
          <input
            type="range"
            min={0.3}
            max={0.8}
            step={0.05}
            value={thresholdDraft}
            onChange={(e) => setThresholdDraft(parseFloat(e.target.value))}
            aria-label="Detection threshold"
            style={{ flex: 1, accentColor: "#1E6FD9" }}
          />
          <span style={{ fontSize: 12, color: "#8FA3BC" }}>0.80</span>
          <span style={{ padding: "4px 10px", borderRadius: 6, background: "#1E6FD9", color: "white", fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
            τ {thresholdDraft.toFixed(2)}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)" }}>
            <div style={{ fontSize: 11, color: "#8FA3BC", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Estimated Recall</div>
            <div style={{ fontSize: 22, color: "#10B981", fontWeight: 700, marginTop: 4 }}>{previewRecall}%</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)" }}>
            <div style={{ fontSize: 11, color: "#8FA3BC", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Estimated Precision</div>
            <div style={{ fontSize: 22, color: "#F59E0B", fontWeight: 700, marginTop: 4 }}>{previewPrecision}%</div>
          </div>
        </div>
      </ModalShell>

      {/* Retrain modal */}
      <ModalShell
        open={modal === "retrain"}
        onClose={() => setModal(null)}
        title="Confirm Re-train / ยืนยันการฝึกโมเดลใหม่"
        subtitle="This will trigger Rule 8-2 action. Estimated duration: 2–4 hours. การดำเนินการนี้จะใช้เวลา 2–4 ชั่วโมง"
        tone="amber"
        footer={
          <>
            <ModalButton onClick={() => setModal(null)}>Cancel / ยกเลิก</ModalButton>
            <ModalButton onClick={() => handleRetrainConfirm("Off-peak 02:00")}>Schedule Off-peak 02:00 / ตั้งเวลา</ModalButton>
            <ModalButton variant="primary" onClick={() => handleRetrainConfirm("Now")}>Re-train Now / ฝึกทันที</ModalButton>
          </>
        }
      >
        <div style={{ padding: 12, borderRadius: 8, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertTriangle size={16} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#F0F4F8", lineHeight: 1.55 }}>
            Model will be temporarily unavailable during retraining.<br />
            <span style={{ fontFamily: "'Noto Sans Thai', sans-serif", color: "#8FA3BC" }}>โมเดลจะใช้งานไม่ได้ชั่วคราวระหว่างการฝึก</span>
          </div>
        </div>
      </ModalShell>

      {/* Rollback modal */}
      <ModalShell
        open={modal === "rollback"}
        onClose={() => setModal(null)}
        title="Emergency Rollback / ย้อนกลับฉุกเฉิน"
        subtitle="This will revert to the previous model version. การดำเนินการนี้จะย้อนกลับเป็นโมเดลเวอร์ชันก่อนหน้า"
        tone="red"
        footer={
          <>
            <ModalButton onClick={() => setModal(null)}>Cancel / ยกเลิก</ModalButton>
            <ModalButton variant="danger" disabled={rollbackInput !== "ROLLBACK"} onClick={handleRollback}>
              Confirm Rollback
            </ModalButton>
          </>
        }
      >
        <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid #EF4444", boxShadow: "0 0 16px rgba(239,68,68,0.25)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertOctagon size={16} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#F0F4F8", lineHeight: 1.55 }}>
            ⚠️ This action cannot be undone.<br />
            <span style={{ fontFamily: "'Noto Sans Thai', sans-serif", color: "#8FA3BC" }}>การดำเนินการนี้ไม่สามารถยกเลิกได้</span>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "#8FA3BC" }}>
          Type <b style={{ color: "#F0F4F8" }}>ROLLBACK</b> to confirm / <span style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>พิมพ์ "ROLLBACK" เพื่อยืนยัน</span>
        </div>
        <input
          value={rollbackInput}
          onChange={(e) => setRollbackInput(e.target.value)}
          placeholder="ROLLBACK"
          style={{
            marginTop: 8,
            width: "100%",
            padding: "10px 12px",
            background: "#0A1628",
            border: `1px solid ${rollbackInput === "ROLLBACK" ? "#EF4444" : "#1A3050"}`,
            borderRadius: 8,
            color: "#F0F4F8",
            fontSize: 14,
            fontFamily: "monospace",
            letterSpacing: 1,
            outline: "none",
          }}
        />
      </ModalShell>
    </div>
  );
}

export const ObjectivesScreen = DetectionOverviewScreen;
