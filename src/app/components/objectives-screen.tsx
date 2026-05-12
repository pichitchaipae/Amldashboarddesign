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
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { evaluate, toneClasses, type Confidence, type Signals } from "./decision-engine";
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

const kpis: Kpi[] = [
  {
    id: "recall",
    name: "Model Detection Rate (Recall)",
    icon: <Crosshair className="w-4 h-4" />,
    description: "Detection rate of true suspicious transactions",
    human: "System detects ~82 of every 100 suspicious transactions",
    target: "≥ 85%",
    targetValue: 85,
    comparison: "≥",
    current: 82.3,
    unit: "%",
    formula: "TP / (TP + FN)",
    hint: "Risk of missed suspicious activity — consider lowering threshold or retraining",
    trend: "down",
    trendDelta: "−1.4 pts vs last week",
    status: "red",
  },
  {
    id: "fpr",
    name: "False Positive Rate",
    icon: <Filter className="w-4 h-4" />,
    description: "Percentage of alerts that are not actual risk",
    human: "~14 of every 100 normal transactions are incorrectly flagged",
    target: "≤ 20%",
    targetValue: 20,
    comparison: "≤",
    current: 14.1,
    unit: "%",
    formula: "FP / (FP + TN)",
    note: "ML can reduce false positives significantly compared to rule-based systems.",
    hint: "Within target — current threshold is well-calibrated for analyst workload",
    trend: "flat",
    trendDelta: "±0.2 pts vs last week",
    status: "green",
  },
  {
    id: "flagged",
    name: "Flagged Rate",
    icon: <Activity className="w-4 h-4" />,
    description: "Percentage of transactions flagged by the model",
    human: "~13 of every 100 transactions are routed for review",
    target: "≤ 5%",
    targetValue: 5,
    comparison: "≤",
    current: 13.2,
    unit: "%",
    formula: "Flagged / Total transactions",
    hint: "Operational overload risk — increase threshold to reduce alert volume",
    trend: "up",
    trendDelta: "+1.4 pts vs last week",
    status: "red",
  },
  {
    id: "coverage",
    name: "Pattern Coverage",
    icon: <Layers className="w-4 h-4" />,
    description: "Share of IBM 8 laundering patterns with per-pattern recall ≥ 70%",
    human: "Strong on 7 of 8 known laundering patterns",
    target: "≥ 75% (6 / 8)",
    targetValue: 75,
    comparison: "≥",
    current: 87.5,
    unit: "%",
    formula: "(Patterns passing threshold / 8) × 100",
    hint: "Healthy coverage — BIPARTITE pattern still trails and warrants tuning",
    trend: "flat",
    trendDelta: "0 pts vs last week",
    status: "green",
  },
  {
    id: "precision",
    name: "Precision",
    icon: <Target className="w-4 h-4" />,
    description: "Share of flagged transactions that are true suspicious cases",
    human: "~28 of every 100 alerts are confirmed as real risks",
    target: "≥ 30%",
    targetValue: 30,
    comparison: "≥",
    current: 28.4,
    unit: "%",
    formula: "TP / (TP + FP)",
    hint: "Low alert quality — adjust threshold or retrain to improve confirmation rate",
    trend: "down",
    trendDelta: "−0.8 pts vs last week",
    status: "yellow",
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
  const max = kpi.comparison === "≥" ? 100 : Math.max(kpi.targetValue * 2.5, kpi.current * 1.1);
  const pct = Math.min(100, (kpi.current / max) * 100);
  const targetPct = Math.min(100, (kpi.targetValue / max) * 100);
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
        <span>0{kpi.unit}</span>
        <span>Target {kpi.target}</span>
        <span>{Math.round(max)}{kpi.unit}</span>
      </div>
    </div>
  );
}

type SystemStatus = "Stable" | "Warning" | "Critical";

function deriveSystemStatus(items: Kpi[]): { status: SystemStatus; reasoning: string } {
  const offenders = items.filter((k) => k.status !== "green");
  const criticalKpiViolated = items.some(
    (k) => (k.id === "recall" || k.id === "fpr") && k.status === "red"
  );
  if (criticalKpiViolated) {
    return {
      status: "Critical",
      reasoning: "A critical KPI (Recall or FPR) is in violation. Immediate decision required.",
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

function deriveActions(items: Kpi[]): {
  primary: { label: string; action: string; tone: "danger" | "warn" | "ok"; reason: string };
  secondary: { label: string; reason: string }[];
} {
  const recall = items.find((k) => k.id === "recall")!;
  const fpr = items.find((k) => k.id === "fpr")!;
  const flagged = items.find((k) => k.id === "flagged")!;
  const coverage = items.find((k) => k.id === "coverage")!;
  const precision = items.find((k) => k.id === "precision")!;
  const offenders = items.filter((k) => k.status !== "green").length;

  const recs: { label: string; reason: string }[] = [];
  if (recall.status !== "green") recs.push({ label: "Lower threshold to improve detection", reason: `Recall ${recall.current}% is below the ${recall.target} target.` });
  if (fpr.status === "red" || flagged.status === "red") recs.push({ label: "Increase threshold to reduce false alerts", reason: `Flagged Rate ${flagged.current}% breaches the ${flagged.target} ceiling.` });
  if (coverage.status === "red") recs.push({ label: "Retrain model to address blind spots", reason: `Pattern Coverage ${coverage.current}% below ${coverage.target}.` });
  if (precision.status !== "green") recs.push({ label: "Review threshold or retrain for alert quality", reason: `Precision ${precision.current}% near or below ${precision.target}.` });
  if (offenders >= 3) recs.push({ label: "Consider model rollback or retraining", reason: `${offenders} KPIs are simultaneously degrading.` });

  let primary: ReturnType<typeof deriveActions>["primary"];
  if (recall.status === "red" || offenders >= 3) {
    primary = {
      label: "Retrain model",
      action: "retrain",
      tone: "danger",
      reason: "Detection capability is degraded — retraining is the safest path to restore Recall.",
    };
  } else if (flagged.status === "red" || fpr.status === "red") {
    primary = {
      label: "Adjust threshold",
      action: "threshold",
      tone: "warn",
      reason: "Workload pressure can be relieved by raising τ before any model change.",
    };
  } else if (offenders === 0) {
    primary = {
      label: "Continue current model",
      action: "continue",
      tone: "ok",
      reason: "All KPIs within target — no model intervention required.",
    };
  } else {
    primary = {
      label: "Adjust threshold",
      action: "threshold",
      tone: "warn",
      reason: "Minor drift — retune τ before considering retraining.",
    };
  }

  return { primary, secondary: recs };
}

export function ObjectivesScreen({ onSimulateFix }: { onSimulateFix?: () => void }) {
  const system = useMemo(() => deriveSystemStatus(kpis), []);
  const actions = useMemo(() => deriveActions(kpis), []);

  const signals: Signals = useMemo(
    () => ({
      recall: 82.3,
      fpr: 14.1,
      flaggedRate: 13.2,
      patternCoverage: 87.5,
      precision: 28.4,
      drift: "Yes",
      system: "OK",
    }),
    [],
  );
  const decision = useMemo(() => evaluate(signals), [signals]);
  const tone = toneClasses[decision.tone];

  const [traceOpen, setTraceOpen] = useState(false);
  const traceRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<null | "threshold" | "retrain" | "rollback">(null);
  const [thresholdDraft, setThresholdDraft] = useState(0.5);
  const [rollbackInput, setRollbackInput] = useState("");

  const previewRecall = Math.max(55, 98 - thresholdDraft * 28).toFixed(1);
  const previewFpr = Math.max(2, 32 - thresholdDraft * 32).toFixed(1);

  const handleContinue = () => {
    pushToast({
      tone: "green",
      title: "Model continues monitoring / โมเดลดำเนินการต่อ",
      sub: "Rule 1 Active — no intervention required",
    });
  };
  const handleApplyThreshold = () => {
    setModal(null);
    pushToast({
      tone: "amber",
      title: `Threshold updated to τ = ${thresholdDraft.toFixed(2)}`,
      sub: "อัปเดต Threshold แล้ว",
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

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600 }}>
            <span className="lang-en">Step 1 · Decision Surface</span>
            <span className="lang-bi-sep text-slate-300">·</span>
            <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>ขั้นตอน 1 · พื้นผิวการตัดสินใจ</span>
          </div>
          <h1 className="text-slate-900 mt-1" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4 }}>
            <span className="lang-en">Objectives & Success Metrics (KPI)</span>
            <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>วัตถุประสงค์และตัวชี้วัดความสำเร็จ</span>
          </h1>
          <div className="lang-th text-slate-500" style={{ fontSize: 13, fontFamily: "'Noto Sans Thai', sans-serif" }}>
            วัตถุประสงค์และตัวชี้วัดความสำเร็จ
          </div>
          <p className="text-slate-500 mt-1" style={{ fontSize: 13 }}>
            <span className="lang-en">
              Model performance against defined strategic thresholds. This screen answers one question:{" "}
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
                    <span className={`w-2 h-2 rounded-full ${statusMeta[k.status].dot}`} aria-label={k.name} />
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
                  Conditions evaluated against the live KPI snapshot. Rules are applied in priority order: 5 → 2 → 3 → 4 → 1.
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
                  <b className="text-slate-900">Rule 2:</b> Drift == Yes AND Recall &lt; 85% → <span className="text-rose-600" style={{ fontWeight: 700 }}>RE-TRAIN MODEL</span>
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
              {actions.primary.label} / <span style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>{actions.primary.action === "retrain" ? "ฝึกโมเดลใหม่" : actions.primary.action === "threshold" ? "ปรับ Threshold" : actions.primary.action === "continue" ? "ดำเนินการต่อ" : "ตรวจสอบ"}</span>
            </div>
            <div className="text-slate-600 mt-0.5" style={{ fontSize: 12 }}>{actions.primary.reason}</div>
            <div className="text-slate-500 mt-1" style={{ fontSize: 12, fontFamily: "'Noto Sans Thai', sans-serif" }}>
              ความสามารถในการตรวจจับลดลง — การฝึกใหม่คือทางที่ปลอดภัยที่สุด
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:min-w-[560px]">
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
                <span className="lang-en">Adjust threshold</span>
                <span className="lang-th" style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Noto Sans Thai', sans-serif" }}>ปรับ Threshold</span>
              </span>
            </Button>
            <Button onClick={() => setModal("retrain")} title="ฝึกโมเดลใหม่" className={`h-12 rounded-lg ${actions.primary.action === "retrain" ? primaryToneClasses : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`} style={{ fontSize: 12 }}>
              <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
              <span className="flex flex-col items-start leading-tight">
                <span className="lang-en">Retrain model</span>
                <span className="lang-th" style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Noto Sans Thai', sans-serif" }}>ฝึกโมเดลใหม่</span>
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
                          {k.current}{k.unit}
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
        subtitle="Drag to preview Recall and FPR at the new τ before applying."
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
            <div style={{ fontSize: 11, color: "#8FA3BC", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Estimated FPR</div>
            <div style={{ fontSize: 22, color: "#F59E0B", fontWeight: 700, marginTop: 4 }}>{previewFpr}%</div>
          </div>
        </div>
      </ModalShell>

      {/* Retrain modal */}
      <ModalShell
        open={modal === "retrain"}
        onClose={() => setModal(null)}
        title="Confirm Re-train / ยืนยันการฝึกโมเดลใหม่"
        subtitle="This will trigger Rule 2 action. Estimated duration: 2–4 hours. การดำเนินการนี้จะใช้เวลา 2–4 ชั่วโมง"
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
