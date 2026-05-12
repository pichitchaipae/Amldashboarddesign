import { useMemo, useRef, useState } from "react";
import {
  Shield,
  Globe,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity,
  Info,
  Search,
  Filter as FilterIcon,
  ArrowUpDown,
  CheckCircle2,
  ArrowRight,
  X as XIcon,
  Gauge,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip as RTooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Slider } from "./components/ui/slider";
import { Switch } from "./components/ui/switch";
import { Separator } from "./components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./components/ui/tabs";
import { ObjectivesScreen } from "./components/objectives-screen";
import { AriaScreen } from "./components/aria-screen";
import { AmlDarkSkin, AriaFloatingButton, KpiMiniBar, UnifiedNav } from "./components/aml-shell";
import { ToastHost } from "./components/aml-interactions";
import { L } from "./components/aml-language";

type Status = "green" | "yellow" | "red" | "neutral";

const statusStyles: Record<Status, { dot: string; chip: string; label: { en: string; th: string } }> = {
  green: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", label: { en: "Healthy", th: "ปกติดี" } },
  yellow: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200", label: { en: "Watch", th: "เฝ้าระวัง" } },
  red: { dot: "bg-rose-500", chip: "bg-rose-50 text-rose-700 border-rose-200", label: { en: "Critical", th: "วิกฤต" } },
  neutral: { dot: "bg-slate-400", chip: "bg-slate-50 text-slate-700 border-slate-200", label: { en: "Info", th: "ข้อมูล" } },
};

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={text}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function Sparkline({ data, stroke = "#7BB0F4" }: { data: number[]; stroke?: string }) {
  const w = 200;
  const h = 56;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
      <polygon points={areaPoints} fill={stroke} opacity={0.06} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FatfBars({ data }: { data: { name: string; recall: number }[] }) {
  const max = 100;
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 h-[200px]">
        {data.map((d) => {
          const color = d.recall >= 80 ? "#10b981" : d.recall >= 60 ? "#f59e0b" : "#ef4444";
          const h = (d.recall / max) * 100;
          return (
            <Tooltip key={`fatf-${d.name}`}>
              <TooltipTrigger asChild>
                <div
                  className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group cursor-default"
                  tabIndex={0}
                  aria-label={`${d.name} recall ${d.recall}%`}
                >
                  <div
                    className="text-slate-600 mb-1 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontSize: 10, fontWeight: 600 }}
                  >
                    {d.recall}%
                  </div>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{ height: `${h}%`, backgroundColor: color, minHeight: 4 }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{d.name} — {d.recall}% recall</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex items-start justify-between gap-2 mt-2 border-t border-slate-100 pt-2">
        {data.map((d) => (
          <div
            key={`fatf-label-${d.name}`}
            className="flex-1 text-center text-slate-500 truncate"
            style={{ fontSize: 10, transform: "rotate(-15deg)", transformOrigin: "center top" }}
            title={d.name}
          >
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${s.chip}`} style={{ fontSize: 11 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <L en={s.label.en} th={s.label.th} />
    </span>
  );
}

function TierBadge({ tier, color }: { tier: string; color: "slate" | "indigo" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${map[color]}`} style={{ fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
      {tier}
    </span>
  );
}

type KpiProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: string;
  sub?: string;
  status: Status;
  tooltip?: string;
  estimated?: boolean;
  formula?: string;
  id?: string;
  highlight?: boolean;
};

function KpiCard({ icon, label, value, sub, status, tooltip, estimated, formula, highlight }: KpiProps) {
  return (
    <Card
      className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white ${
        highlight ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            {icon}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600" style={{ fontSize: 13 }}>{label}</span>
            {tooltip && <InfoTip text={tooltip} />}
          </div>
        </div>
        <StatusChip status={status} />
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-slate-900" style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
          {value}
        </div>
        {estimated && (
          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5" style={{ fontSize: 10, fontWeight: 600 }}>
            Estimated
          </span>
        )}
      </div>

      {sub && <div className="mt-1 text-slate-500" style={{ fontSize: 12 }}>{sub}</div>}
      {formula && (
        <div className="mt-2 text-slate-600 bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-100 tabular-nums" style={{ fontSize: 11 }}>
          {formula}
        </div>
      )}
    </Card>
  );
}

const fatfData = [
  { name: "SCATTER-GATHER", recall: 92 },
  { name: "GATHER-SCATTER", recall: 89 },
  { name: "FAN-IN", recall: 94 },
  { name: "FAN-OUT", recall: 90 },
  { name: "RANDOM", recall: 81 },
  { name: "STACK", recall: 87 },
  { name: "CYCLE", recall: 85 },
  { name: "BIPARTITE", recall: 58 },
];

const trendData = [
  { d: "D-9", v: 112 },
  { d: "D-8", v: 128 },
  { d: "D-7", v: 121 },
  { d: "D-6", v: 140 },
  { d: "D-5", v: 155 },
  { d: "D-4", v: 149 },
  { d: "D-3", v: 168 },
  { d: "D-2", v: 181 },
  { d: "D-1", v: 177 },
  { d: "Today", v: 194 },
];

const corridors = [
  { route: "TH → SG", share: 28.4, value: 14_900_000, trend: "+3.2%", risk: "red" as const },
  { route: "TH → HK", share: 21.1, value: 11_200_000, trend: "+1.8%", risk: "red" as const },
  { route: "TH → AE", share: 14.3, value: 7_620_000, trend: "−0.6%", risk: "yellow" as const },
  { route: "TH → US", share: 9.3, value: 4_900_000, trend: "+0.4%", risk: "yellow" as const },
];

type Alert = {
  id: string;
  amount: number;
  risk: number;
  cross: boolean;
  corridor?: string;
  status: "Flagged" | "Under Review" | "Cleared";
  pattern: string;
};

const alerts: Alert[] = [
  { id: "TX-8842193", amount: 1_245_000, risk: 0.97, cross: true, corridor: "TH → SG", status: "Flagged", pattern: "BIPARTITE" },
  { id: "TX-8842155", amount: 842_330, risk: 0.93, cross: true, corridor: "TH → HK", status: "Flagged", pattern: "FAN-OUT" },
  { id: "TX-8842090", amount: 512_800, risk: 0.88, cross: false, status: "Under Review", pattern: "CYCLE" },
  { id: "TX-8841977", amount: 298_400, risk: 0.84, cross: true, corridor: "TH → AE", status: "Flagged", pattern: "SCATTER-GATHER" },
  { id: "TX-8841842", amount: 188_120, risk: 0.79, cross: false, status: "Under Review", pattern: "STACK" },
  { id: "TX-8841710", amount: 96_500, risk: 0.74, cross: true, corridor: "TH → SG", status: "Under Review", pattern: "FAN-IN" },
  { id: "TX-8841655", amount: 72_200, risk: 0.68, cross: false, status: "Cleared", pattern: "RANDOM" },
  { id: "TX-8841502", amount: 1_702_500, risk: 0.95, cross: true, corridor: "TH → HK", status: "Flagged", pattern: "GATHER-SCATTER" },
  { id: "TX-8841377", amount: 421_000, risk: 0.82, cross: true, corridor: "TH → US", status: "Under Review", pattern: "FAN-OUT" },
];

function formatUSD(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function App() {
  const [screen, setScreen] = useState<"objectives" | "overview" | "aria">("objectives");
  const [threshold, setThreshold] = useState(0.5);
  const [strict, setStrict] = useState(false);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [corridorFilter, setCorridorFilter] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const queueRef = useRef<HTMLDivElement>(null);

  const suspiciousValue = 48_720_000 + Math.round((1 - threshold) * 12_000_000);

  const simulated = useMemo(() => {
    const t = strict ? Math.min(0.9, threshold + 0.15) : threshold;
    const flagged = Math.max(2, 28 - t * 24);
    const recall = Math.max(55, 98 - t * 28);
    const fpr = Math.max(2, 32 - t * 32);
    return { flagged, recall, fpr, t };
  }, [threshold, strict]);

  const workload = 13.2;

  const filteredAlerts = useMemo(() => {
    let list = alerts.filter((a) => a.id.toLowerCase().includes(query.toLowerCase()));
    if (riskFilter === "high") list = list.filter((a) => a.risk >= 0.8);
    if (riskFilter === "cross") list = list.filter((a) => a.cross);
    if (riskFilter === "bipartite") list = list.filter((a) => a.pattern === "BIPARTITE");
    if (corridorFilter) list = list.filter((a) => a.corridor === corridorFilter);
    list = [...list].sort((a, b) => (sortDesc ? b.risk - a.risk : a.risk - b.risk));
    return list;
  }, [query, riskFilter, corridorFilter, sortDesc]);

  const highRiskRatio = 62.4;
  const donutData = [
    { name: "High-risk value", value: highRiskRatio, fill: "#ef4444" },
    { name: "Normal value", value: 100 - highRiskRatio, fill: "#1A3050" },
  ];

  const focusQueue = (corridor?: string) => {
    if (corridor) {
      setCorridorFilter(corridor);
      setRiskFilter("cross");
    }
    queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (screen === "aria") {
    return (
      <TooltipProvider delayDuration={150}>
        <AriaScreen currentScreen={screen} onSwitchScreen={setScreen} />
        <ToastHost />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <AmlDarkSkin />
      <div className="aml-dark min-h-screen w-full">
        <UnifiedNav currentScreen={screen} onSwitchScreen={setScreen} />
        <KpiMiniBar />

        <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-8">
          {screen === "objectives" ? (
            <ObjectivesScreen onSimulateFix={() => setScreen("overview")} />
          ) : (
          <>
          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-slate-900" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.4 }}>
                <span className="lang-en">AML Detection Dashboard</span>
              </h1>
              <div className="text-slate-500" style={{ fontSize: 13 }}>
                <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
                  แดชบอร์ดตรวจจับ AML
                </span>
              </div>
              <p className="text-slate-500 mt-1" style={{ fontSize: 13 }}>
                <span className="lang-en">
                  Monitor suspicious activity, detection coverage, and analyst workload — updated in real time.
                </span>
              </p>
              <p className="text-slate-500" style={{ fontSize: 12 }}>
                <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
                  ติดตามกิจกรรมต้องสงสัย การครอบคลุมการตรวจจับ และภาระงานของนักวิเคราะห์
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: 12 }}>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="lang-en">Live · last refreshed 2 min ago</span>
                <span className="lang-bi-sep"> / </span>
                <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
                  สด · อัปเดตล่าสุด 2 นาทีที่แล้ว
                </span>
              </span>
            </div>
          </div>

          {/* TIER 1 — Model Performance */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex">
                      <TierBadge tier="Tier 1" color="slate" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">ระดับ 1 — วัดผลโดยตรง</TooltipContent>
                </Tooltip>
                <div>
                  <div className="text-slate-900" style={{ fontSize: 14, fontWeight: 600 }}>
                    <L en="Model Performance" th="ประสิทธิภาพของโมเดล" />
                  </div>
                  <div className="text-slate-500" style={{ fontSize: 11 }}>
                    <L
                      en="Directly measured at the current threshold — audit-citable."
                      th="วัดโดยตรงที่ threshold ปัจจุบัน"
                    />
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-slate-500" style={{ fontSize: 11 }}>
                <Gauge className="w-3.5 h-3.5" />
                <span className="lang-en">Decision threshold · τ =</span>
                <span className="lang-bi-sep"> / </span>
                <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
                  เกณฑ์การตัดสิน · τ =
                </span>
                {" "}
                <span className="text-slate-900 tabular-nums" style={{ fontWeight: 600 }}>{simulated.t.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                icon={<Activity className="w-4 h-4" />}
                label={<L en="Model Recall (current τ)" th="อัตราการตรวจจับ (τ ปัจจุบัน)" />}
                value={`${simulated.recall.toFixed(1)}%`}
                sub="Share of true laundering caught at this threshold"
                status={simulated.recall >= 85 ? "green" : simulated.recall >= 75 ? "yellow" : "red"}
                tooltip="Recall = TP / (TP + FN). Threshold-dependent. This is the primary, audit-citable detection metric."
                formula="TP / (TP + FN) — evaluated on labelled holdout"
                highlight
              />
              <KpiCard
                icon={<CheckCircle2 className="w-4 h-4" />}
                label={<L en="False Positive Rate" th="อัตราแจ้งเตือนเกิน" />}
                value={`${simulated.fpr.toFixed(1)}%`}
                sub={`~${simulated.fpr.toFixed(0)} of every 100 alerts are clean`}
                status={simulated.fpr <= 15 ? "green" : simulated.fpr <= 25 ? "yellow" : "red"}
                tooltip="FPR = FP / (FP + TN). Drives analyst workload; must be read alongside Recall."
                formula="FP / (FP + TN)"
              />
              <KpiCard
                icon={<SlidersHorizontal className="w-4 h-4" />}
                label={<L en="Compliance Workload" th="ภาระงาน Compliance" />}
                value={`${workload}%`}
                sub="Share of transactions queued for analyst review"
                status="yellow"
                tooltip="Flagged transactions / total transactions. Operational capacity metric."
                formula="Flagged / Total transactions (30d)"
              />
            </div>
          </section>

          {/* TIER 2 — Estimated Coverage & Impact */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex">
                      <TierBadge tier="Tier 2 — Estimated" color="indigo" />
                    </span>
                  </TooltipTrigger>
                <TooltipContent className="text-xs">ระดับ 2 — ประมาณการ</TooltipContent>
              </Tooltip>
              <div>
                <div className="text-slate-900" style={{ fontSize: 14, fontWeight: 600 }}>
                  <L en="Estimated Coverage & Impact" th="การครอบคลุมและผลกระทบโดยประมาณ" />
                </div>
                <div className="text-slate-500" style={{ fontSize: 11 }}><L en="Derived proxies and scenario figures — context for discussion, not for citation." th="ค่าประมาณและสถานการณ์จำลอง — ใช้เป็นบริบทเท่านั้น ห้ามอ้างอิง" /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                icon={<Shield className="w-4 h-4" />}
                label={<L en="Estimated SAR Coverage" th="การครอบคลุม SAR โดยประมาณ" />}
                value="88.4%"
                sub="Historical proxy — not the live Recall above"
                status="green"
                tooltip="Derived from historical SAR-conversion of flagged alerts (2024 Q4 sample, n=12,480). Full-dataset evaluation reported 92.18%. Do not cite interchangeably with the live Model Recall."
                formula="SAR-confirmed / flagged (historical sample)"
                estimated
              />
              <KpiCard
                icon={<Activity className="w-4 h-4" />}
                label={<L en="FATF Pattern Coverage" th="การครอบคลุมรูปแบบ FATF" />}
                value="7/8"
                sub="Typologies with ≥ 70% recall"
                status="green"
                tooltip="Count of FATF-defined laundering typologies detected at ≥70% recall on the labelled holdout set."
                estimated
              />
              <KpiCard
                icon={<DollarSign className="w-4 h-4" />}
                label={<L en="Detected Suspicious Value" th="มูลค่าต้องสงสัยที่ตรวจพบ" />}
                value={formatUSD(suspiciousValue)}
                sub="Scenario upper bound — not realized loss"
                status="neutral"
                tooltip="Sum of transaction value flagged at the current threshold. This is a hypothetical prevented-loss figure and should not be reported as realized."
                estimated
              />
            </div>
          </section>

          {/* Operational Signals */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <TierBadge tier="Operational" color="slate" />
              <div className="text-slate-900" style={{ fontSize: 14, fontWeight: 600 }}><L en="Operational Signals" th="สัญญาณปฏิบัติการ" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 rounded-2xl border-slate-200 shadow-sm bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600" style={{ fontSize: 12 }}>
                    <AlertTriangle className="w-4 h-4 text-slate-500" /> <L en="Total Alerts" th="การแจ้งเตือนทั้งหมด" />
                  </div>
                  <InfoTip text="Total flagged transactions across the current 30-day reporting window." />
                </div>
                <div className="mt-3 text-slate-900" style={{ fontSize: 26, fontWeight: 600 }}>134,024</div>
                <div className="text-slate-500 mt-1" style={{ fontSize: 12 }}><L en="Flagged transactions (30d)" th="ธุรกรรมที่ถูกแจ้ง (30 วัน)" /></div>
              </Card>

              <Card className="p-5 rounded-2xl border-slate-200 shadow-sm bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600" style={{ fontSize: 12 }}>
                    <TrendingUp className="w-4 h-4 text-slate-500" /> <L en="Suspicious Tx Growth" th="แนวโน้มธุรกรรมต้องสงสัย" />
                  </div>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5" style={{ fontSize: 11 }}>
                    +9.6% / 10d
                  </span>
                </div>
                <div className="h-14 mt-3 min-w-0">
                  <Sparkline data={trendData.map((d) => d.v)} />
                </div>
                <div className="text-slate-500" style={{ fontSize: 12 }}>
                  <L en="Trend not normalized for weekend / window roll-off — treat as directional." th="แนวโน้มไม่ปรับตามวันหยุด / การเลื่อนหน้าต่าง — ใช้เป็นทิศทางเท่านั้น" />
                </div>
              </Card>

              <Card className="p-5 rounded-2xl border-slate-200 shadow-sm bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600" style={{ fontSize: 12 }}>
                    <Globe className="w-4 h-4 text-slate-500" /> <L en="Cross-Border Ratio" th="สัดส่วนข้ามพรมแดน" />
                  </div>
                  <StatusChip status="red" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-slate-900" style={{ fontSize: 26, fontWeight: 600 }}>73.1%</div>
                  <span className="text-rose-600" style={{ fontSize: 11 }}><L en="Above tolerance (60%)" th="เกินเกณฑ์ (60%)" /></span>
                </div>
                <div className="text-slate-500 mt-1" style={{ fontSize: 12 }}>
                  <L en="Tolerance per institution policy AML-P-04 §3.2. See drill-down below." th="ตามนโยบาย AML-P-04 §3.2 ดูรายละเอียดด้านล่าง" />
                </div>
              </Card>
            </div>
          </section>

          {/* Cross-Border drill-down — turns warning into control */}
          <section>
            <Card className="p-5 rounded-2xl border-slate-200 shadow-sm bg-white">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-rose-600" />
                    <div className="text-slate-900" style={{ fontSize: 15, fontWeight: 600 }}><L en="Cross-Border Drill-Down" th="รายละเอียดข้ามพรมแดน" /></div>
                    <InfoTip text="Cross-border = Payment Currency ≠ Receiving Currency. Corridor = origin → destination jurisdiction pair. Sorted by share of cross-border risk value." />
                  </div>
                  <div className="text-slate-500 mt-0.5" style={{ fontSize: 12 }}>
                    <L en="Top corridors contributing to the 73.1% cross-border risk ratio. Use the actions on the right to jump to the affected alerts." th="เส้นทางหลักที่มีส่วนต่อสัดส่วนความเสี่ยงข้ามพรมแดน 73.1% ใช้ปุ่มด้านขวาเพื่อข้ามไปยังการแจ้งเตือนที่เกี่ยวข้อง" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-9 shrink-0"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setCorridorFilter(null);
                    setRiskFilter("cross");
                    queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <L en="View all cross-border alerts" th="ดูการแจ้งเตือนข้ามพรมแดนทั้งหมด" /> <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left" style={{ fontSize: 13 }}>
                  <thead className="bg-slate-50 text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    <tr>
                      <th className="px-4 py-2.5"><L en="Corridor" th="เส้นทาง" /></th>
                      <th className="px-4 py-2.5"><L en="Share of risk value" th="สัดส่วนมูลค่าเสี่ยง" /></th>
                      <th className="px-4 py-2.5"><L en="Value at risk" th="มูลค่าที่เสี่ยง" /></th>
                      <th className="px-4 py-2.5"><L en="7-day change" th="เปลี่ยนแปลง 7 วัน" /></th>
                      <th className="px-4 py-2.5"><L en="Risk" th="ความเสี่ยง" /></th>
                      <th className="px-4 py-2.5 text-right"><L en="Action" th="การดำเนินการ" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {corridors.map((c) => (
                      <tr key={c.route} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-900" style={{ fontWeight: 500 }}>{c.route}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 w-52">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.risk === "red" ? "bg-rose-500" : "bg-amber-500"}`}
                                style={{ width: `${c.share * 2}%` }}
                              />
                            </div>
                            <span className="tabular-nums text-slate-700" style={{ fontSize: 12 }}>{c.share.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-900 tabular-nums">{formatUSD(c.value)}</td>
                        <td className="px-4 py-3 text-slate-600 tabular-nums" style={{ fontSize: 12 }}>{c.trend}</td>
                        <td className="px-4 py-3"><StatusChip status={c.risk} /></td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50"
                            style={{ fontSize: 12 }}
                            onClick={() => focusQueue(c.route)}
                          >
                            <L en="View affected alerts" th="ดูการแจ้งเตือนที่เกี่ยวข้อง" /> <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Analysis Panel — FATF + donut */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5 rounded-2xl border-slate-200 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-900" style={{ fontSize: 15, fontWeight: 600 }}><L en="FATF Pattern Coverage" th="การครอบคลุมรูปแบบ FATF" /></div>
                  <div className="text-slate-500 mt-0.5" style={{ fontSize: 12 }}><L en="Recall by laundering typology — labelled holdout evaluation" th="Recall ตามรูปแบบการฟอกเงิน — ประเมินจากชุดทดสอบ" /></div>
                </div>
                <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: 11 }}>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> ≥ 80%</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> 60–79%</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-500" /> &lt; 60%</span>
                </div>
              </div>
              <div className="mt-4">
                <FatfBars data={fatfData} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100" style={{ fontSize: 12 }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-rose-700">
                    <L en={<><b>BIPARTITE</b> underperforms at 58% recall — recommend targeted rule tuning.</>} th={<><b>BIPARTITE</b> ทำผลงานต่ำที่ 58% recall — แนะนำให้ปรับกฎเฉพาะจุด</>} />
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="h-7 px-2 text-rose-700 hover:bg-rose-100"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setCorridorFilter(null);
                    setRiskFilter("bipartite");
                    queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <L en="Review pattern alerts" th="ตรวจสอบการแจ้งเตือนตามรูปแบบ" /> <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border-slate-200 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-900" style={{ fontSize: 15, fontWeight: 600 }}><L en="High-Risk Value Ratio" th="สัดส่วนมูลค่าเสี่ยงสูง" /></div>
                  <div className="text-slate-500 mt-0.5" style={{ fontSize: 12 }}><L en="Share of monetary value at risk" th="สัดส่วนมูลค่าเงินที่เสี่ยง" /></div>
                </div>
                <InfoTip text="High-risk defined as risk_score > 0.80. Calculated as sum(high-risk amount) / sum(total amount)." />
              </div>
              <div className="relative h-[220px] mt-2 min-w-0">
                <ResponsiveContainer width="100%" height={220} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius={62}
                      outerRadius={88}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {donutData.map((e, i) => <Cell key={`donut-${i}-${e.name}`} fill={e.fill} />)}
                    </Pie>
                    <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-slate-900" style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>{highRiskRatio}%</div>
                  <div className="text-slate-500" style={{ fontSize: 11 }}><L en="of total value" th="ของมูลค่าทั้งหมด" /></div>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-slate-600" style={{ fontSize: 12 }}>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500" /> <L en="High-risk value" th="มูลค่าเสี่ยงสูง" /></span>
                  <span className="text-slate-900">$30.4M</span>
                </div>
                <div className="flex items-center justify-between text-slate-600" style={{ fontSize: 12 }}>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-300" /> <L en="Normal value" th="มูลค่าปกติ" /></span>
                  <span className="text-slate-900">$18.3M</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Threshold Simulator — now visibly tied to Tier 1 */}
          <section>
            <Card className="p-5 rounded-2xl border-indigo-200 ring-1 ring-indigo-100 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-slate-900" style={{ fontSize: 15, fontWeight: 600 }}><L en="Threshold Simulator" th="ตัวจำลอง Threshold" /></div>
                    <div className="text-indigo-700 mt-0.5" style={{ fontSize: 12 }}>
                      <L en={<>This threshold drives the <b>Tier 1 · Model Performance</b> metrics at the top of the page.</>} th={<>Threshold นี้กำหนดค่า <b>Tier 1 · ประสิทธิภาพโมเดล</b> ด้านบนของหน้า</>} />
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-slate-500" style={{ fontSize: 11 }}>
                  <span><L en="Mode" th="โหมด" /></span>
                  <span className={strict ? "text-rose-600" : "text-emerald-600"} style={{ fontWeight: 600 }}>
                    {strict ? <L en="Strict" th="เข้มงวด" /> : <L en="Balanced" th="สมดุล" />}
                  </span>
                  <Switch
                    checked={strict}
                    onCheckedChange={setStrict}
                    aria-label="Toggle strict mode"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-2" style={{ fontSize: 12 }}>
                    <span className="text-slate-500">0.1</span>
                    <Slider
                      value={[threshold]}
                      min={0.1}
                      max={0.9}
                      step={0.01}
                      onValueChange={(v) => setThreshold(v[0])}
                      className="flex-1"
                      aria-label="Detection threshold"
                    />
                    <span className="text-slate-500">0.9</span>
                    <div className="ml-2 px-2 py-1 rounded-md bg-slate-900 text-white tabular-nums" style={{ fontSize: 12, minWidth: 56, textAlign: "center" }}>
                      τ {simulated.t.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-slate-500" style={{ fontSize: 11 }}>
                    <L en="Lower τ → higher Recall, higher FPR, heavier workload. Higher τ → the inverse." th="τ ต่ำ → Recall สูง, FPR สูง, ภาระงานหนัก τ สูง → กลับกัน" />
                  </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-slate-500 flex items-center gap-1" style={{ fontSize: 11 }}>
                      <ArrowRight className="w-3 h-3" /> <L en="Flagged Rate" th="อัตราการแจ้ง" />
                    </div>
                    <div className="text-slate-900 tabular-nums" style={{ fontSize: 20, fontWeight: 600 }}>{simulated.flagged.toFixed(1)}%</div>
                    <div className="text-slate-400" style={{ fontSize: 10 }}><L en="drives Workload" th="กำหนดภาระงาน" /></div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <div className="text-emerald-700 flex items-center gap-1" style={{ fontSize: 11 }}>
                      <ArrowRight className="w-3 h-3" /> Recall
                    </div>
                    <div className="text-emerald-800 tabular-nums" style={{ fontSize: 20, fontWeight: 600 }}>{simulated.recall.toFixed(1)}%</div>
                    <div className="text-emerald-700/70" style={{ fontSize: 10 }}><L en="updates Tier 1 KPI ↑" th="อัปเดต Tier 1 KPI ↑" /></div>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <div className="text-amber-700 flex items-center gap-1" style={{ fontSize: 11 }}>
                      <ArrowRight className="w-3 h-3" /> FPR
                    </div>
                    <div className="text-amber-800 tabular-nums" style={{ fontSize: 20, fontWeight: 600 }}>{simulated.fpr.toFixed(1)}%</div>
                    <div className="text-amber-700/70" style={{ fontSize: 10 }}><L en="updates Tier 1 KPI ↑" th="อัปเดต Tier 1 KPI ↑" /></div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Alert Queue */}
          <section ref={queueRef}>
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
              <Tabs defaultValue="queue" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-5 pb-0">
                  <div>
                    <div className="text-slate-900" style={{ fontSize: 15, fontWeight: 600 }}><L en="Alert Queue" th="คิวการแจ้งเตือน" /></div>
                    <div className="text-slate-500 mt-0.5" style={{ fontSize: 12 }}><L en="Transactions pending compliance review" th="ธุรกรรมรอการตรวจสอบ" /></div>
                  </div>
                  <TabsList className="bg-slate-100">
                    <TabsTrigger value="queue"><L en="Queue" th="คิว" /></TabsTrigger>
                    <TabsTrigger value="escalated"><L en="Escalated" th="ยกระดับ" /></TabsTrigger>
                    <TabsTrigger value="cleared"><L en="Cleared" th="ผ่านแล้ว" /></TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="queue" className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder="Search transaction ID…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 h-9 bg-slate-50 border-slate-200"
                        aria-label="Search transaction ID"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={riskFilter} onValueChange={setRiskFilter}>
                        <SelectTrigger className="h-9 w-[170px] bg-white" aria-label="Alert filter">
                          <FilterIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all"><L en="All alerts" th="ทั้งหมด" /></SelectItem>
                          <SelectItem value="high"><L en="High risk (&gt; 0.80)" th="ความเสี่ยงสูง (&gt; 0.80)" /></SelectItem>
                          <SelectItem value="cross"><L en="Cross-border only" th="ข้ามพรมแดนเท่านั้น" /></SelectItem>
                          <SelectItem value="bipartite"><L en="BIPARTITE pattern" th="รูปแบบ BIPARTITE" /></SelectItem>
                        </SelectContent>
                      </Select>
                      {corridorFilter && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200" style={{ fontSize: 12 }}>
                          Corridor: {corridorFilter}
                          <button
                            type="button"
                            onClick={() => setCorridorFilter(null)}
                            className="hover:text-indigo-900"
                            aria-label="Clear corridor filter"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <Button
                        variant="outline"
                        className="h-9"
                        onClick={() => setSortDesc((s) => !s)}
                        style={{ fontSize: 12 }}
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                        <L en={`Risk ${sortDesc ? "↓" : "↑"}`} th={`ความเสี่ยง ${sortDesc ? "↓" : "↑"}`} />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left" style={{ fontSize: 13 }}>
                        <thead className="bg-slate-50 text-slate-500" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          <tr>
                            <th className="px-4 py-3"><L en="Transaction ID" th="Transaction ID" /></th>
                            <th className="px-4 py-3"><L en="Amount" th="จำนวนเงิน" /></th>
                            <th className="px-4 py-3"><L en="Risk Score" th="คะแนนความเสี่ยง" /></th>
                            <th className="px-4 py-3"><L en="Corridor" th="เส้นทาง" /></th>
                            <th className="px-4 py-3"><L en="Status" th="สถานะ" /></th>
                            <th className="px-4 py-3"><L en="FATF Pattern" th="รูปแบบ FATF" /></th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredAlerts.map((a) => {
                            const riskColor = a.risk >= 0.9 ? "rose" : a.risk >= 0.75 ? "amber" : "emerald";
                            return (
                              <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3 text-slate-900 tabular-nums">{a.id}</td>
                                <td className="px-4 py-3 text-slate-900 tabular-nums">{formatUSD(a.amount)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 w-40">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          riskColor === "rose" ? "bg-rose-500" : riskColor === "amber" ? "bg-amber-500" : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${a.risk * 100}%` }}
                                      />
                                    </div>
                                    <span className="tabular-nums text-slate-700" style={{ fontSize: 12 }}>{a.risk.toFixed(2)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {a.cross ? (
                                    <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50">
                                      <Globe className="w-3 h-3 mr-1" /> {a.corridor ?? "Yes"}
                                    </Badge>
                                  ) : (
                                    <span className="text-slate-500" style={{ fontSize: 12 }}><L en="Domestic" th="ในประเทศ" /></span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {a.status === "Flagged" && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700" style={{ fontSize: 11 }}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> <L en="Flagged" th="ถูกแจ้ง" />
                                    </span>
                                  )}
                                  {a.status === "Under Review" && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700" style={{ fontSize: 11 }}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> <L en="Under Review" th="กำลังตรวจสอบ" />
                                    </span>
                                  )}
                                  {a.status === "Cleared" && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700" style={{ fontSize: 11 }}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> <L en="Cleared" th="ผ่านแล้ว" />
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="border-slate-200 text-slate-700" style={{ fontSize: 11 }}>
                                    {a.pattern}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button variant="ghost" className="h-7 px-2 text-slate-600 hover:text-slate-900" style={{ fontSize: 12 }}>
                                    <L en="Review →" th="ตรวจสอบ →" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredAlerts.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-slate-500" style={{ fontSize: 13 }}>
                                <L en="No alerts match the current filters." th="ไม่มีการแจ้งเตือนที่ตรงกับตัวกรอง" />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="escalated" className="p-10 text-center text-slate-500" style={{ fontSize: 13 }}>
                  <L en="Escalated cases will appear here once a reviewer promotes an alert." th="กรณีที่ยกระดับจะแสดงที่นี่เมื่อผู้ตรวจสอบยกระดับการแจ้งเตือน" />
                </TabsContent>
                <TabsContent value="cleared" className="p-10 text-center text-slate-500" style={{ fontSize: 13 }}>
                  <L en="Cleared alerts archive — reopen within 90 days if new evidence emerges." th="คลังการแจ้งเตือนที่ผ่านแล้ว — เปิดใหม่ได้ภายใน 90 วันหากมีหลักฐานใหม่" />
                </TabsContent>
              </Tabs>
            </Card>
          </section>

          {/* Footer note */}
          <section>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-slate-600 space-y-1" style={{ fontSize: 12, lineHeight: 1.6 }}>
                <div><L en={<><b className="text-slate-800">Scope.</b> This dashboard evaluates detection capability, not full AML operations.</>} th={<><b className="text-slate-800">ขอบเขต</b> แดชบอร์ดนี้ประเมินความสามารถในการตรวจจับ ไม่ใช่การดำเนินงาน AML ทั้งหมด</>} /></div>
                <div>
                  <L
                    en={<><b className="text-slate-800">Tier 1 vs Tier 2.</b> Tier 1 metrics are directly measured and audit-citable. Tier 2 metrics (marked <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1 py-0.5" style={{ fontSize: 10, fontWeight: 600 }}>Estimated</span>) are derived proxies or scenario figures — use for context, not citation.</>}
                    th={<><b className="text-slate-800">Tier 1 vs Tier 2.</b> Tier 1 วัดโดยตรงและอ้างอิงได้ Tier 2 (marked <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1 py-0.5" style={{ fontSize: 10, fontWeight: 600 }}>Estimated</span>) เป็นค่าประมาณ — ใช้เป็นบริบทเท่านั้น ห้ามอ้างอิง</>}
                  />
                </div>
                <div>
                  <L
                    en={<><b className="text-slate-800">Recall disambiguation.</b> Live <i>Model Recall</i> (Tier 1) is threshold-dependent and reflects the labelled holdout at τ. The <i>Estimated SAR Coverage</i> (88.4%, Tier 2) is a historical proxy derived from SAR-conversion of flagged alerts; the full-dataset historical figure is 92.18%. Do not cite interchangeably.</>}
                    th={<><b className="text-slate-800">การแยกความแตกต่างของ Recall.</b> <i>Model Recall</i> (Tier 1) ขึ้นกับ threshold และวัดจากชุดทดสอบที่ τ <i>Estimated SAR Coverage</i> (88.4%, Tier 2) เป็นค่าประมาณจากประวัติการแปลง SAR ค่าจากชุดข้อมูลเต็มคือ 92.18% ห้ามอ้างอิงสลับกันใช้</>}
                  />
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-slate-400" style={{ fontSize: 11 }}>
              <span><L en="© 2026 Sentinel AML · Internal use only" th="© 2026 Sentinel AML · สำหรับใช้ภายในเท่านั้น" /></span>
              <span>FATF typology reference v2025.4 · Model build 4.7.2</span>
            </div>
          </section>
          </>
          )}
        </main>
        <AriaFloatingButton onClick={() => setScreen("aria")} hasAlert />
        <ToastHost />
      </div>
    </TooltipProvider>
  );
}
