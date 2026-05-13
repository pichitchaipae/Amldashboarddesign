import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Send,
  Mic,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  ChevronDown,
  Cpu,
  Database,
  Bot,
  User as UserIcon,
  TrendingUp,
  Zap,
} from "lucide-react";
import { KpiMiniBar, UnifiedNav, type ScreenId as ShellScreenId } from "./aml-shell";
import { ModalButton, ModalShell, pushToast } from "./aml-interactions";
import { L, useLang } from "./aml-language";
import { evaluate, matchIntent, type AllSignals, type ChatResponse, type Decision, type RuleTrace, type ChatContext } from "./decision-engine";

const C = {
  base: "#0A1628",
  card: "#0F2140",
  cardHi: "#142A52",
  border: "#1B335E",
  borderSoft: "#1A2A4A",
  blue: "#1E6FD9",
  blueGlow: "rgba(30, 111, 217, 0.35)",
  amber: "#F59E0B",
  red: "#EF4444",
  redGlow: "rgba(239, 68, 68, 0.45)",
  green: "#10B981",
  text: "#E6ECF5",
  subtext: "#94A6C2",
  faint: "#6B7E9F",
};

const FONT = "'Inter', 'Noto Sans Thai', system-ui, sans-serif";

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtRatio = (n: number, digits = 2) => n.toFixed(digits);

const TH_MAP: Record<string, string> = {
  "Ask for explanation": "ขอคำอธิบาย",
  "Ask about drift status": "สอบถามสถานะการ Drift",
  "Available queries": "คำถามที่ใช้ได้",
  "Decision Trace": "ตรรกะการตัดสินใจ",
  "Not sure yet": "ยังไม่แน่ใจ",
  "Recommendation": "คำแนะนำ",
};

type KpiStatus = "pass" | "warn" | "fail";

type RuleStatus = "TRIGGERED" | "ACTIVE" | "CLEAR";

type RuleCard = {
  num: number;
  nameEn: string;
  nameTh: string;
  conditions: string;
  status: RuleStatus;
  tone: "green" | "amber" | "red" | "blue" | "violet";
  tag: string;
  detail: RuleDetailData;
};


const toneToColor: Record<string, string> = {
  green: C.green,
  amber: C.amber,
  red: C.red,
  blue: C.blue,
  violet: "#8B5CF6",
};

function statusPill(status: KpiStatus) {
  if (status === "pass") return { color: C.green, label: "PASS", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16,185,129,0.35)" };
  if (status === "warn") return { color: C.amber, label: "WARN", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245,158,11,0.35)" };
  return { color: C.red, label: "FAIL", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239,68,68,0.35)" };
}

function rulePill(status: RuleStatus) {
  if (status === "CLEAR") return { color: C.green, bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16,185,129,0.35)" };
  if (status === "ACTIVE") return { color: C.amber, bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245,158,11,0.4)" };
  return { color: C.red, bg: "rgba(239, 68, 68, 0.16)", border: "rgba(239,68,68,0.5)" };
}

function statusFor(value: number, target: number): KpiStatus {
  return value >= target ? "pass" : "fail";
}

type ChatMsg = {
  id: string;
  from: "bot" | "user";
  kind?: "text" | "system" | "action" | "risk" | "choices";
  body?: React.ReactNode;
};

type ScreenId = ShellScreenId;

export function AriaScreen({
  currentScreen,
  onSwitchScreen,
}: {
  currentScreen?: ScreenId;
  onSwitchScreen?: (s: ScreenId) => void;
}) {
  const signals = useMemo<AllSignals>(
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

  const kpis = useMemo(
    () => [
      {
        en: "Recall",
        th: "อัตราการตรวจจับ",
        value: fmtPct(signals.recall),
        target: ">= 85%",
        status: statusFor(signals.recall, 0.85),
      },
      {
        en: "Precision",
        th: "ความแม่นยำ",
        value: fmtPct(signals.precision),
        target: ">= 86%",
        status: statusFor(signals.precision, 0.86),
      },
      {
        en: "F1-Score",
        th: "สมดุล F1",
        value: fmtPct(signals.f1),
        target: ">= 82%",
        status: statusFor(signals.f1, 0.82),
      },
      {
        en: "Accuracy",
        th: "ความถูกต้อง",
        value: fmtPct(signals.accuracy),
        target: ">= 80%",
        status: statusFor(signals.accuracy, 0.8),
      },
      {
        en: "MCC",
        th: "Matthews Corr.",
        value: fmtRatio(signals.mcc),
        target: ">= 0.60",
        status: statusFor(signals.mcc, 0.6),
      },
    ],
    [signals],
  );

  const rules = useMemo(() => buildRuleCards(signals, trace, decision), [signals, trace, decision]);

  const conceptColor = trace.conceptDrift.result === "Drifted" ? C.red : C.green;
  const dataColor = trace.dataDrift.result === "Drifted" ? C.red : C.green;
  const systemColor = trace.systemEfficiency.result === "OK" ? C.green : C.red;

  const [messages, setMessages] = useState<ChatMsg[]>(() => buildInitialMessages(decision, trace, signals));
  const [input, setInput] = useState("");
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [ruleModal, setRuleModal] = useState<null | "retrain" | "schedule" | "threshold" | "rollback">(null);
  const [rollbackInput, setRollbackInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestionChips = useMemo(() => {
    if (decision.action === "Retrain_Model")
      return [
        { en: "Why retrain?", th: "ทำไมต้องฝึกโมเดลใหม่?" },
        { en: "Check Concept Drift", th: "ตรวจสอบ Concept Drift" },
        { en: "Show metrics", th: "แสดงตัวชี้วัด" },
      ];
    if (decision.action === "Tune_Model")
      return [
        { en: "Why tune threshold?", th: "ทำไมต้องปรับ Threshold?" },
        { en: "Check Data Drift", th: "ตรวจสอบ Data Drift" },
        { en: "Show feature power", th: "แสดงพลังของฟีเจอร์" },
      ];
    if (decision.action === "Optimize_System")
      return [
        { en: "System health details", th: "รายละเอียดสถานะระบบ" },
        { en: "Check Latency", th: "ตรวจสอบ Latency" },
      ];
    return [
      { en: "Check Data Quality", th: "ตรวจสอบคุณภาพข้อมูล" },
      { en: "Verify metrics", th: "ยืนยันตัวชี้วัด" },
    ];
  }, [decision.action]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleChoice = (label: string) => {
    pushToast({
      tone: "green",
      title: "Action Queued / รับคำสั่ง",
      sub: `ดำเนินการ: ${label}`,
    });

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", kind: "text", body: label },
      {
        id: `b-${Date.now()}`,
        from: "bot",
        kind: "text",
        body: (
          <span>
            <L
              en={`✅ Command received: ${label}. The action is queued and logged.`}
              th={`✅ คำสั่งรับเรียบร้อย: ${label}. ระบบจะดำเนินการตามขั้นตอนและบันทึกใน audit log.`}
            />
          </span>
        ),
      },
    ]);
  };

  const handleSend = (textOverride?: string) => {
    const t = (textOverride || input).trim();
    if (!t) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", kind: "text", body: t },
    ]);
    
    setIsTyping(true);
    
    // Simulate thinking delay
    setTimeout(() => {
      setChatContext(currentContext => {
        const response = matchIntent(t, signals, trace, decision, currentContext);
        setMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            from: "bot",
            kind: "text",
            body: renderChatResponse(response, handleSend),
          },
        ]);
        setIsTyping(false);
        return response.nextContext || {};
      });
    }, 600);
  };

  return (
    <div
      style={{
        background: C.base,
        color: C.text,
        fontFamily: FONT,
        minHeight: "100vh",
        backgroundImage:
          "radial-gradient(circle at 18% 0%, rgba(30,111,217,0.08), transparent 40%), radial-gradient(circle at 82% 100%, rgba(239,68,68,0.06), transparent 45%)",
      }}
    >
      {onSwitchScreen && currentScreen && (
        <UnifiedNav currentScreen={currentScreen} onSwitchScreen={onSwitchScreen} />
      )}
      <KpiMiniBar />

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* SECTION 2 — KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 16 }}>
          {kpis.map((k) => {
            const p = statusPill(k.status);
            return (
              <div
                key={`kpi-${k.en}`}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, ${p.color}05, transparent 60%)`,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, color: C.subtext, lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 600, color: C.text, fontSize: 12 }}>{k.en}</div>
                      <div style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>{k.th}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: p.bg,
                        color: p.color,
                        border: `1px solid ${p.border}`,
                      }}
                    >
                      {p.label}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 28,
                      fontWeight: 700,
                      letterSpacing: -0.5,
                      color: p.color,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {k.value}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 11, color: C.faint }}>
                    Target <span style={{ color: C.subtext, fontWeight: 600 }}>{k.target}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 3 + 4 — Rules + Chatbot */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)", gap: 24 }}>
          {/* Rule Engine */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: C.subtext, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600 }}>
                  Rule Engine
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Decision Rules · 8 active</div>
              </div>
              <span style={{ fontSize: 11, color: C.faint, fontFamily: "'Noto Sans Thai', sans-serif" }}>
                เครื่องยนต์กฎการตัดสินใจ
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rules.map((r) => {
                const triggered = r.status === "TRIGGERED";
                const pill = rulePill(r.status);
                const open = expandedRule === r.num;
                const accent = toneToColor[r.tone];
                const ruleDetail = r.detail;
                return (
                <div
                  key={`rule-${r.num}`}
                  style={{
                    background: triggered ? "rgba(239, 68, 68, 0.06)" : C.cardHi,
                    border: triggered ? `1px solid ${C.red}` : open ? `1px solid ${accent}` : `1px solid ${C.borderSoft}`,
                    borderRadius: 12,
                    boxShadow: triggered ? `0 0 0 3px rgba(239, 68, 68, 0.18), 0 0 24px ${C.redGlow}` : open ? `0 0 18px ${accent}33` : "none",
                    overflow: "hidden",
                    animation: triggered ? "ariaGlow 2.4s ease-in-out infinite" : undefined,
                  }}
                >
                  <div
                    style={{
                      padding: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${toneToColor[r.tone]}1F`,
                        border: `1px solid ${toneToColor[r.tone]}55`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: toneToColor[r.tone],
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {r.num}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.nameEn}</span>
                        <span style={{ fontSize: 11, color: C.subtext, fontFamily: "'Noto Sans Thai', sans-serif" }}>
                          / {r.nameTh}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{r.conditions}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: pill.bg,
                        color: pill.color,
                        border: `1px solid ${pill.border}`,
                        flexShrink: 0,
                      }}
                    >
                      {r.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedRule(open ? null : r.num)}
                      style={{
                        background: open ? `${accent}1F` : "transparent",
                        border: `1px solid ${open ? accent : C.border}`,
                        color: open ? accent : C.subtext,
                        borderRadius: 8,
                        padding: "5px 10px",
                        fontSize: 11,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                        fontFamily: FONT,
                      }}
                    >
                      {open ? "Hide Detail" : "View Detail"}
                      {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  </div>
                  {open && (
                    <RuleDetailPanel
                      data={ruleDetail}
                      onRetrain={() => setRuleModal("retrain")}
                      onSchedule={() => setRuleModal("schedule")}
                      onMonitor={() => pushToast({ tone: "amber", title: "Monitoring continued", sub: "กำลัง Monitor ต่อ — จะแจ้งเตือนเมื่อ KPI เปลี่ยน" })}
                      onAdjustThreshold={() => setRuleModal("threshold")}
                      onSimulate={() => pushToast({ tone: "amber", title: "Simulating tuning", sub: "Previewing KPI impact before applying changes." })}
                      onForceRollback={() => setRuleModal("rollback")}
                    />
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* Chatbot */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              minHeight: 580,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(180deg, rgba(30,111,217,0.10), transparent)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${C.blue}22`,
                    border: `1px solid ${C.blue}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7BB0F4",
                  }}
                >
                  <Bot size={16} />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>ARIA Assistant</div>
                  <div style={{ fontSize: 11, color: C.subtext, fontFamily: "'Noto Sans Thai', sans-serif" }}>
                    ผู้ช่วยตัดสินใจอัจฉริยะ · Online
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                Live
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m) => {
                if (m.kind === "system") {
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        borderRadius: 12,
                        padding: 14,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <AlertOctagon size={18} color={C.red} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, fontFamily: "'Noto Sans Thai', sans-serif" }}>
                        {m.body}
                      </div>
                    </div>
                  );
                }
                if (m.kind === "action") {
                  const actionColor =
                    decision.action === "Retrain_Model"
                      ? C.red
                      : decision.action === "Tune_Model"
                        ? C.amber
                        : decision.action === "Optimize_System"
                          ? C.blue
                          : C.green;
                  const actionGlow =
                    decision.action === "Retrain_Model"
                      ? C.redGlow
                      : decision.action === "Tune_Model"
                        ? "rgba(245, 158, 11, 0.45)"
                        : decision.action === "Optimize_System"
                          ? C.blueGlow
                          : "rgba(16, 185, 129, 0.35)";
                  const confidencePct = decision.confidence === "High" ? 87 : decision.confidence === "Medium" ? 65 : 45;
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: `linear-gradient(180deg, ${C.cardHi}, ${C.card})`,
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        padding: 16,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 160,
                          height: 160,
                          background: `radial-gradient(circle at top right, ${C.blueGlow}, transparent 70%)`,
                          pointerEvents: "none",
                        }}
                      />
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              color: C.subtext,
                              letterSpacing: 0.6,
                              textTransform: "uppercase",
                              fontWeight: 600,
                            }}
                          >
                            <span style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>แนะนำการดำเนินการ</span> / Recommended Action
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 14px",
                              borderRadius: 8,
                              background: `linear-gradient(135deg, ${actionColor}, ${actionColor}CC)`,
                              color: "white",
                              fontSize: 16,
                              fontWeight: 700,
                              letterSpacing: 0.4,
                              boxShadow: `0 0 24px ${actionGlow}`,
                            }}
                          >
                            <Zap size={16} /> {decision.tag}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: `${C.blue}1A`,
                            border: `1px solid ${C.blue}55`,
                            color: "#A8C8F1",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            textAlign: "center",
                            flexShrink: 0,
                          }}
                        >
                          Confidence
                          <div style={{ fontSize: 18, color: "#E2EDFD", marginTop: 2, letterSpacing: -0.4 }}>{confidencePct}%</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, color: C.subtext, lineHeight: 1.6 }}>
                        {decision.plain}
                      </div>
                    </div>
                  );
                }
                if (m.kind === "choices") {
                  const choices =
                    decision.action === "Retrain_Model"
                      ? [
                          { k: "A", label: "Re-train ทันที", en: "Re-train now", tone: C.red },
                          { k: "B", label: "Re-train ช่วง Off-peak (02:00)", en: "Off-peak schedule", tone: C.amber },
                          { k: "C", label: "ดู Detail ก่อน", en: "Review details", tone: C.blue },
                          { k: "D", label: "Monitor ต่อ", en: "Continue monitoring", tone: C.faint },
                        ]
                      : decision.action === "Tune_Model"
                        ? [
                            { k: "A", label: "Tune Threshold ตอนนี้", en: "Tune threshold", tone: C.amber },
                            { k: "B", label: "Simulate KPI Impact", en: "Run simulation", tone: C.blue },
                            { k: "C", label: "ดู Data Drift Detail", en: "Review drift detail", tone: C.blue },
                            { k: "D", label: "Monitor ต่อ", en: "Continue monitoring", tone: C.faint },
                          ]
                        : decision.action === "Optimize_System"
                          ? [
                              { k: "A", label: "Optimize ตอนนี้", en: "Optimize system", tone: C.blue },
                              { k: "B", label: "Scale ช่วง Off-peak", en: "Off-peak scale", tone: C.amber },
                              { k: "C", label: "ดู System Detail", en: "Review system detail", tone: C.blue },
                              { k: "D", label: "Monitor ต่อ", en: "Continue monitoring", tone: C.faint },
                            ]
                          : [
                              { k: "A", label: "Monitor ต่อ", en: "Continue monitoring", tone: C.green },
                              { k: "B", label: "ดู Rule Trace", en: "Review rule trace", tone: C.blue },
                              { k: "C", label: "ดู KPI Detail", en: "Review KPI detail", tone: C.blue },
                              { k: "D", label: "No Action", en: "No action", tone: C.faint },
                            ];
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                        gap: 10,
                      }}
                    >
                      {choices.map((c) => (
                        <button
                          key={`choice-${c.k}`}
                          type="button"
                          onClick={() => handleChoice(`[${c.k}] ${c.label}`)}
                          style={{
                            background: C.cardHi,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "12px 14px",
                            cursor: "pointer",
                            textAlign: "left",
                            color: C.text,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = C.blue;
                            e.currentTarget.style.boxShadow = `0 0 0 1px ${C.blue}, 0 0 18px ${C.blueGlow}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = C.border;
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <span
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              background: `${c.tone}1F`,
                              border: `1px solid ${c.tone}55`,
                              color: c.tone,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {c.k}
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Noto Sans Thai', sans-serif" }}>
                              {c.label}
                            </span>
                            <span style={{ fontSize: 11, color: C.subtext }}>{c.en}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                }
                if (m.kind === "risk") {
                  const riskCopy =
                    decision.action === "Retrain_Model"
                      ? "หากไม่ Re-train ภายใน 24 ชม. ความเสี่ยงจาก Concept Drift จะเพิ่มขึ้นและกระทบการตรวจจับธุรกรรมต้องสงสัย."
                      : decision.action === "Tune_Model"
                        ? "หากไม่ Tune โมเดล อาจเกิดความไม่สมดุลระหว่าง Precision และ Recall ต่อเนื่อง."
                        : decision.action === "Optimize_System"
                          ? "หากไม่ Optimize ระบบ อาจเกิด Latency สูงและส่งผลต่อ SLA ของการตรวจจับ."
                          : "ระบบอยู่ในเกณฑ์ปกติ โปรดติดตาม KPI อย่างสม่ำเสมอ.";
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        borderRadius: 12,
                        padding: 12,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <AlertTriangle size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.55, fontFamily: "'Noto Sans Thai', sans-serif" }}>
                        <b style={{ color: C.amber }}>⚠️ Risk:</b> {riskCopy}
                      </div>
                    </div>
                  );
                }
                // text bubble
                const isUser = m.from === "user";
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 8 }}>
                    {!isUser && (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: `${C.blue}22`,
                          border: `1px solid ${C.blue}55`,
                          color: "#7BB0F4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Bot size={13} />
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: "78%",
                        background: isUser ? `linear-gradient(135deg, ${C.blue}, #2D7AE0)` : C.cardHi,
                        border: isUser ? "none" : `1px solid ${C.border}`,
                        color: isUser ? "white" : C.text,
                        borderRadius: 12,
                        borderBottomRightRadius: isUser ? 4 : 12,
                        borderBottomLeftRadius: isUser ? 12 : 4,
                        padding: "10px 14px",
                        fontSize: 13,
                        lineHeight: 1.55,
                        fontFamily: "'Noto Sans Thai', sans-serif",
                      }}
                    >
                      {m.body}
                    </div>
                    {isUser && (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: `linear-gradient(135deg, ${C.blue}, #8B5CF6)`,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <UserIcon size={13} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: `${C.blue}22`,
                    border: `1px solid ${C.blue}55`,
                    color: "#7BB0F4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={13} />
                </div>
                <div
                  style={{
                    maxWidth: "78%",
                    background: C.cardHi,
                    border: `1px solid ${C.border}`,
                    color: C.subtext,
                    borderRadius: 12,
                    borderBottomLeftRadius: 4,
                    padding: "10px 14px",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span className="dot-typing"></span>
                  <span className="dot-typing" style={{ animationDelay: "0.2s" }}></span>
                  <span className="dot-typing" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}
            
            <style>{`
              .dot-typing {
                width: 5px;
                height: 5px;
                background-color: ${C.faint};
                border-radius: 50%;
                animation: typing 1s infinite;
              }
              @keyframes typing {
                0%, 100% { opacity: 0.3; transform: translateY(0); }
                50% { opacity: 1; transform: translateY(-2px); }
              }
            `}</style>
            <SuggestionChips chips={suggestionChips} onSend={handleSend} />

            {/* Input bar */}
            <div
              style={{
                padding: 14,
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.base,
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "0 12px",
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="พิมพ์คำถามหรือคำสั่ง... / Type a command or question..."
                  aria-label="ARIA assistant message"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: C.text,
                    fontSize: 13,
                    padding: "12px 0",
                    fontFamily: FONT,
                  }}
                />
                <button
                  type="button"
                  aria-label="Voice input"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: C.subtext,
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                    display: "flex",
                  }}
                >
                  <Mic size={15} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleSend}
                aria-label="Send"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${C.blue}, #4A8DEE)`,
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 20px ${C.blueGlow}`,
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 5 — Bottom status bar */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 16,
          }}
        >
          <StatusItem
            icon={<Activity size={14} color={C.amber} />}
            label="Drift Status"
            primary={<><DriftDot color={conceptColor} /> Concept Drift {trace.conceptDrift.result}</>}
            secondary={<><DriftDot color={dataColor} /> Data Drift {trace.dataDrift.result}</>}
            sub={trace.conceptDrift.result === "Drifted" || trace.dataDrift.result === "Drifted" ? "ตรวจพบ Drift / Detected" : "ไม่พบ Drift / Stable"}
          />
          <StatusItem
            icon={<Cpu size={14} color={systemColor} />}
            label="System Health"
            primary={<span style={{ color: systemColor }}>Latency {fmtRatio(signals.latencyMs, 0)}ms</span>}
            secondary={<span style={{ color: systemColor }}>CPU/RAM {Math.round(signals.cpuRamUsage * 100)}%</span>}
            sub={trace.systemEfficiency.result === "OK" ? "ระบบปกติ / Healthy" : "ระบบวิกฤต / Critical"}
          />
          <StatusItem
            icon={<TrendingUp size={14} color="#7BB0F4" />}
            label="Champion vs Challenger"
            primary={
              <span>
                <span style={{ color: C.green, fontWeight: 700 }}>+0.04</span>{" "}
                <span style={{ color: C.subtext }}>MCC</span>
              </span>
            }
            secondary={<span>XGBoost <span style={{ color: C.faint }}>vs</span> Random Forest</span>}
            sub="โมเดลปัจจุบันชนะ / Current model leads"
          />
          <StatusItem
            icon={<Database size={14} color="#A8C8F1" />}
            label="Last Action Log"
            primary={<span style={{ color: C.text, fontWeight: 600 }}>{decision.tag}</span>}
            secondary={<span style={{ color: C.subtext }}>Today 09:42</span>}
            sub={decision.action === "Retrain_Model" ? "แนะนำให้ฝึกโมเดลใหม่" : decision.action === "Tune_Model" ? "แนะนำให้ปรับแต่งโมเดล" : decision.action === "Optimize_System" ? "แนะนำให้ปรับปรุงระบบ" : "โมเดลอยู่ในเกณฑ์"}
          />
        </div>
      </div>

      <style>{`
        @keyframes ariaPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); } }
        @keyframes ariaGlow { 0%, 100% { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18), 0 0 24px rgba(239, 68, 68, 0.45); } 50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.28), 0 0 36px rgba(239, 68, 68, 0.6); } }
        @keyframes ariaSlideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <ModalShell
        open={ruleModal === "retrain"}
        onClose={() => setRuleModal(null)}
        tone="amber"
        title="Re-train Model / ฝึกโมเดลใหม่"
        subtitle="Confirm immediate re-train. Estimated 18 minutes."
        footer={
          <>
            <ModalButton onClick={() => setRuleModal(null)}>Cancel / ยกเลิก</ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => {
                setRuleModal(null);
                pushToast({ tone: "red", title: "Re-train started", sub: "เริ่มฝึกโมเดล Rule 8-2 · IN PROGRESS" });
                setTimeout(() => pushToast({ tone: "amber", title: "Training in progress", sub: "62% · ETA 7 min" }), 1100);
                setTimeout(() => pushToast({ tone: "green", title: "Re-train complete", sub: "Recall ↑ 86.4% · Drift cleared" }), 2400);
              }}
            >
              Confirm Re-train / ยืนยัน
            </ModalButton>
          </>
        }
      >
        <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.6 }}>
          ระบบจะนำข้อมูลล่าสุด 30 วันมาฝึกโมเดล Champion ใหม่ และเปลี่ยนสถานะเป็น <b style={{ color: C.text }}>IN PROGRESS</b> ระหว่างดำเนินการ
        </div>
      </ModalShell>

      <ModalShell
        open={ruleModal === "schedule"}
        onClose={() => setRuleModal(null)}
        tone="blue"
        title="Schedule Re-train / ตั้งเวลา"
        subtitle="Off-peak window: 02:00 tonight"
        footer={
          <>
            <ModalButton onClick={() => setRuleModal(null)}>Cancel / ยกเลิก</ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => {
                setRuleModal(null);
                pushToast({ tone: "amber", title: "Re-train scheduled", sub: "ตั้งเวลา Re-train คืนนี้เวลา 02:00" });
              }}
            >
              Confirm Schedule
            </ModalButton>
          </>
        }
      >
        <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.6 }}>
          Scheduled: <b style={{ color: C.text }}>02:00 tonight</b> / ตั้งเวลา Re-train คืนนี้เวลา 02:00
        </div>
      </ModalShell>

      <ModalShell
        open={ruleModal === "threshold"}
        onClose={() => setRuleModal(null)}
        tone="blue"
        title="Adjust Threshold / ปรับ Threshold"
        subtitle="τ range 0.30 – 0.80 · live preview"
        footer={
          <>
            <ModalButton onClick={() => setRuleModal(null)}>Cancel / ยกเลิก</ModalButton>
            <ModalButton
              variant="primary"
              onClick={() => {
                setRuleModal(null);
                pushToast({ tone: "amber", title: "Threshold updated", sub: "τ = 0.45 · Recall ↑ 82% · Precision ↑ 86%" });
              }}
            >
              Apply
            </ModalButton>
          </>
        }
      >
        <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.6 }}>
          Lower τ → higher Recall, lower Precision. Adjust slider in detail panel preview.
        </div>
      </ModalShell>

      <ModalShell
        open={ruleModal === "rollback"}
        onClose={() => { setRuleModal(null); setRollbackInput(""); }}
        tone="red"
        title="Force Rollback / บังคับ Rollback"
        subtitle='Type "ROLLBACK" to confirm. This action is destructive.'
        footer={
          <>
            <ModalButton onClick={() => { setRuleModal(null); setRollbackInput(""); }}>Cancel</ModalButton>
            <ModalButton
              variant="danger"
              disabled={rollbackInput !== "ROLLBACK"}
              onClick={() => {
                setRuleModal(null);
                setRollbackInput("");
                pushToast({ tone: "red", title: "Rollback executed", sub: "Champion reverted to previous version" });
              }}
            >
              Force Rollback
            </ModalButton>
          </>
        }
      >
        <input
          value={rollbackInput}
          onChange={(e) => setRollbackInput(e.target.value)}
          placeholder='Type "ROLLBACK"'
          aria-label="Type ROLLBACK to confirm"
          style={{
            width: "100%",
            padding: "10px 12px",
            background: C.base,
            border: `1px solid ${C.red}`,
            borderRadius: 8,
            color: C.text,
            fontFamily: FONT,
            fontSize: 14,
            outline: "none",
          }}
        />
      </ModalShell>
    </div>
  );
}

function DriftDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 6px ${color}`,
        marginRight: 6,
        verticalAlign: "middle",
      }}
    />
  );
}

function StatusItem({
  icon,
  label,
  primary,
  secondary,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  primary: React.ReactNode;
  secondary: React.ReactNode;
  sub: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.subtext, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>
        {icon} {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: C.text, marginTop: 2 }}>
        <span>{primary}</span>
        <span style={{ color: C.faint }}>·</span>
        <span style={{ color: C.subtext }}>{secondary}</span>
      </div>
      <div style={{ fontSize: 11, color: C.faint, fontFamily: "'Noto Sans Thai', sans-serif" }}>{sub}</div>
    </div>
  );
}

type Cond = { cond: string; target: string; current: string; pass: boolean };

type RuleDetailData = {
  status: "TRIGGERED" | "ACTIVE" | "CLEAR";
  accent?: string;
  conditions: Cond[];
  note?: { tone: "amber" | "green"; en: string; th: string };
  shap?: { feature: string; weight: number; tone: "red" | "amber" }[];
  logic?: string[];
  systemHealth?: { latency: string; cpu: string; memory: string };
  warning?: { en: string; th: string };
  lastTriggered: string;
  actions: ("retrain" | "schedule" | "monitor" | "threshold" | "simulate" | "rollback")[];
};

function buildRuleCards(signals: AllSignals, trace: RuleTrace, decision: Decision): RuleCard[] {
  const nowLabel = "Now / ขณะนี้";
  const clearLabel = "—";

  const rule1Status: RuleStatus = trace.metricStability.result === "Pass" ? "CLEAR" : "TRIGGERED";
  const rule1Detail: RuleDetailData = {
    status: rule1Status,
    conditions: [
      { cond: "MCC", target: ">= 0.60", current: fmtRatio(signals.mcc), pass: signals.mcc >= 0.6 },
      { cond: "Precision", target: ">= 0.86", current: fmtRatio(signals.precision), pass: signals.precision >= 0.86 },
      { cond: "Recall", target: ">= 0.85", current: fmtRatio(signals.recall), pass: signals.recall >= 0.85 },
      { cond: "F1", target: ">= 0.82", current: fmtRatio(signals.f1), pass: signals.f1 >= 0.82 },
      { cond: "Accuracy", target: ">= 0.80", current: fmtRatio(signals.accuracy), pass: signals.accuracy >= 0.8 },
    ],
    note: rule1Status === "TRIGGERED"
      ? { tone: "amber", en: `Metric stability failed: ${trace.metricStability.details}`, th: "Metric stability ไม่ผ่านเกณฑ์" }
      : { tone: "green", en: "All metric thresholds met.", th: "ผ่านทุกเงื่อนไข" },
    logic: [
      "IF MCC >= 0.60",
      "AND Precision >= 0.86",
      "AND Recall >= 0.85",
      "AND F1 >= 0.82",
      "AND Accuracy >= 0.80",
      "THEN Metric_Stability = Pass",
    ],
    lastTriggered: rule1Status === "TRIGGERED" ? nowLabel : clearLabel,
    actions: [],
  };

  const rule2Status: RuleStatus = trace.patternLogic.result === "Normal" ? "CLEAR" : "ACTIVE";
  const rule2Detail: RuleDetailData = {
    status: rule2Status,
    conditions: [
      { cond: "Graph Density", target: "0.10-0.60", current: fmtRatio(signals.graphDensity), pass: signals.graphDensity >= 0.1 && signals.graphDensity <= 0.6 },
      { cond: "Node Centrality", target: "> 0.40", current: fmtRatio(signals.nodeCentrality), pass: signals.nodeCentrality > 0.4 },
      { cond: "Motif Similarity", target: "> 0.60", current: fmtRatio(signals.motifSimilarity), pass: signals.motifSimilarity > 0.6 },
    ],
    logic: [
      "IF 0.10 <= Graph_Density <= 0.60",
      "AND Node_Centrality > 0.40",
      "AND Motif_Similarity > 0.60",
      "THEN Pattern_Logic = Normal",
    ],
    lastTriggered: rule2Status === "CLEAR" ? clearLabel : nowLabel,
    actions: [],
  };

  const rule3Status: RuleStatus = trace.featurePower.result === "Good" ? "CLEAR" : "ACTIVE";
  const rule3Detail: RuleDetailData = {
    status: rule3Status,
    conditions: [
      { cond: "Feature Importance", target: "> 0.05", current: fmtRatio(signals.featureImportance), pass: signals.featureImportance > 0.05 },
      { cond: "Edge Weights", target: "> 0.30", current: fmtRatio(signals.edgeWeights), pass: signals.edgeWeights > 0.3 },
      { cond: "Learning Rate", target: "0.001-0.01", current: fmtRatio(signals.learningRate, 4), pass: signals.learningRate >= 0.001 && signals.learningRate <= 0.01 },
      { cond: "Tree Depth", target: "3-8", current: fmtRatio(signals.treeDepth, 0), pass: signals.treeDepth >= 3 && signals.treeDepth <= 8 },
    ],
    logic: [
      "IF Feature_Importance > 0.05",
      "AND Edge_Weights > 0.30",
      "AND Learning_Rate in [0.001, 0.01]",
      "AND Tree_Depth in [3, 8]",
      "THEN Feature_Power = Good",
    ],
    lastTriggered: rule3Status === "CLEAR" ? clearLabel : nowLabel,
    actions: [],
  };

  const rule4Status: RuleStatus = trace.dataQuality.result === "Good" ? "CLEAR" : "ACTIVE";
  const rule4Detail: RuleDetailData = {
    status: rule4Status,
    conditions: [
      { cond: "Missing Value %", target: "< 0.05", current: fmtRatio(signals.missingPct), pass: signals.missingPct < 0.05 },
      { cond: "Label Imbalance", target: "< 10", current: fmtRatio(signals.labelImbalance), pass: signals.labelImbalance < 10 },
      { cond: "PSI", target: "< 0.10", current: fmtRatio(signals.psi), pass: signals.psi < 0.1 },
    ],
    logic: [
      "IF Missing_Value_Pct < 0.05",
      "AND Label_Imbalance < 10",
      "AND PSI < 0.10",
      "THEN Data_Quality = Good",
    ],
    lastTriggered: rule4Status === "CLEAR" ? clearLabel : nowLabel,
    actions: [],
  };

  const rule5Status: RuleStatus = trace.systemEfficiency.result === "OK" ? "CLEAR" : "TRIGGERED";
  const rule5Detail: RuleDetailData = {
    status: rule5Status,
    conditions: [
      { cond: "Throughput", target: ">= 100", current: fmtRatio(signals.throughput, 0), pass: signals.throughput >= 100 },
      { cond: "Latency (ms)", target: "<= 300", current: fmtRatio(signals.latencyMs, 0), pass: signals.latencyMs <= 300 },
      { cond: "CPU/RAM", target: "<= 0.80", current: fmtRatio(signals.cpuRamUsage), pass: signals.cpuRamUsage <= 0.8 },
    ],
    systemHealth: {
      latency: `${fmtRatio(signals.latencyMs, 0)} ms`,
      cpu: `${Math.round(signals.cpuRamUsage * 100)}%`,
      memory: signals.cpuRamUsage <= 0.8 ? "OK" : "High",
    },
    logic: [
      "IF Throughput >= 100",
      "AND Latency_ms <= 300",
      "AND CPU_RAM_Usage <= 0.80",
      "THEN System_Efficiency = OK",
    ],
    lastTriggered: rule5Status === "TRIGGERED" ? nowLabel : clearLabel,
    actions: [],
  };

  const rule6Status: RuleStatus = trace.conceptDrift.result === "Stable" ? "CLEAR" : "TRIGGERED";
  const rule6Detail: RuleDetailData = {
    status: rule6Status,
    conditions: [
      { cond: "Metric Stability", target: "Pass", current: trace.metricStability.result, pass: trace.metricStability.result === "Pass" },
      { cond: "Pattern Logic", target: "Normal", current: trace.patternLogic.result, pass: trace.patternLogic.result === "Normal" },
    ],
    logic: [
      "IF Metric_Stability = Pass",
      "AND Pattern_Logic = Normal",
      "THEN Concept_Drift = Stable",
    ],
    lastTriggered: rule6Status === "TRIGGERED" ? nowLabel : clearLabel,
    actions: [],
  };

  const rule7Status: RuleStatus = trace.dataDrift.result === "Stable" ? "CLEAR" : "ACTIVE";
  const rule7Detail: RuleDetailData = {
    status: rule7Status,
    conditions: [
      { cond: "Feature Power", target: "Good", current: trace.featurePower.result, pass: trace.featurePower.result === "Good" },
      { cond: "Data Quality", target: "Good", current: trace.dataQuality.result, pass: trace.dataQuality.result === "Good" },
    ],
    logic: [
      "IF Feature_Power = Good",
      "AND Data_Quality = Good",
      "THEN Data_Drift = Stable",
    ],
    lastTriggered: rule7Status === "ACTIVE" ? nowLabel : clearLabel,
    actions: [],
  };

  const rule8Status: RuleStatus = decision.action === "Still_Valid_GO" ? "CLEAR" : "TRIGGERED";
  const rule8Actions: RuleDetailData["actions"] =
    decision.action === "Retrain_Model"
      ? ["retrain", "schedule", "monitor"]
      : decision.action === "Tune_Model"
        ? ["threshold", "simulate", "monitor"]
        : decision.action === "Optimize_System"
          ? ["monitor"]
          : ["monitor"];
  const rule8Detail: RuleDetailData = {
    status: rule8Status,
    conditions: [
      { cond: "Concept Drift", target: "Stable", current: trace.conceptDrift.result, pass: trace.conceptDrift.result === "Stable" },
      { cond: "Data Drift", target: "Stable", current: trace.dataDrift.result, pass: trace.dataDrift.result === "Stable" },
      { cond: "System Efficiency", target: "OK", current: trace.systemEfficiency.result, pass: trace.systemEfficiency.result === "OK" },
    ],
    note: {
      tone: decision.action === "Still_Valid_GO" ? "green" : "amber",
      en: `Final action selected: ${decision.tag} (${decision.ruleId}).`,
      th: "ผลลัพธ์สุดท้ายจาก Rule 8",
    },
    logic: [
      "IF Concept_Drift = Drifted THEN Retrain_Model",
      "ELSE IF Data_Drift = Drifted THEN Tune_Model",
      "ELSE IF System_Efficiency = Critical THEN Optimize_System",
      "ELSE Still_Valid_GO",
    ],
    lastTriggered: rule8Status === "TRIGGERED" ? nowLabel : clearLabel,
    actions: rule8Actions,
  };

  const decisionTone: RuleCard["tone"] =
    decision.action === "Retrain_Model"
      ? "red"
      : decision.action === "Tune_Model"
        ? "amber"
        : decision.action === "Optimize_System"
          ? "blue"
          : "green";
  const decisionTag =
    decision.action === "Retrain_Model"
      ? "RETRAIN"
      : decision.action === "Tune_Model"
        ? "TUNE"
        : decision.action === "Optimize_System"
          ? "OPTIMIZE"
          : "GO";

  return [
    {
      num: 1,
      nameEn: "Metric Stability",
      nameTh: "เสถียรภาพตัวชี้วัด",
      conditions: "MCC, Precision, Recall, F1, Accuracy",
      status: rule1Status,
      tone: rule1Status === "CLEAR" ? "green" : "red",
      tag: trace.metricStability.result.toUpperCase(),
      detail: rule1Detail,
    },
    {
      num: 2,
      nameEn: "Pattern Logic",
      nameTh: "ตรรกะรูปแบบ",
      conditions: "Graph Density, Node Centrality, Motif Similarity",
      status: rule2Status,
      tone: rule2Status === "CLEAR" ? "green" : "amber",
      tag: trace.patternLogic.result.toUpperCase(),
      detail: rule2Detail,
    },
    {
      num: 3,
      nameEn: "Feature Power",
      nameTh: "พลังของฟีเจอร์",
      conditions: "Feature Importance, Edge Weights, LR, Tree Depth",
      status: rule3Status,
      tone: rule3Status === "CLEAR" ? "green" : "amber",
      tag: trace.featurePower.result.toUpperCase(),
      detail: rule3Detail,
    },
    {
      num: 4,
      nameEn: "Data Quality",
      nameTh: "คุณภาพข้อมูล",
      conditions: "Missing %, Label Imbalance, PSI",
      status: rule4Status,
      tone: rule4Status === "CLEAR" ? "green" : "amber",
      tag: trace.dataQuality.result.toUpperCase(),
      detail: rule4Detail,
    },
    {
      num: 5,
      nameEn: "System Efficiency",
      nameTh: "ประสิทธิภาพระบบ",
      conditions: "Throughput, Latency, CPU/RAM",
      status: rule5Status,
      tone: rule5Status === "CLEAR" ? "green" : "red",
      tag: trace.systemEfficiency.result.toUpperCase(),
      detail: rule5Detail,
    },
    {
      num: 6,
      nameEn: "Concept Drift",
      nameTh: "Concept Drift",
      conditions: "Metric Stability + Pattern Logic",
      status: rule6Status,
      tone: rule6Status === "CLEAR" ? "green" : "red",
      tag: trace.conceptDrift.result.toUpperCase(),
      detail: rule6Detail,
    },
    {
      num: 7,
      nameEn: "Data Drift",
      nameTh: "Data Drift",
      conditions: "Feature Power + Data Quality",
      status: rule7Status,
      tone: rule7Status === "CLEAR" ? "green" : "amber",
      tag: trace.dataDrift.result.toUpperCase(),
      detail: rule7Detail,
    },
    {
      num: 8,
      nameEn: "Final Action",
      nameTh: "ผลลัพธ์สุดท้าย",
      conditions: "Concept Drift + Data Drift + System Efficiency",
      status: rule8Status,
      tone: decisionTone,
      tag: decisionTag,
      detail: rule8Detail,
    },
  ];
}

function buildInitialMessages(decision: Decision, trace: RuleTrace, signals: AllSignals): ChatMsg[] {
  const conceptColor = trace.conceptDrift.result === "Drifted" ? C.red : C.green;
  const dataColor = trace.dataDrift.result === "Drifted" ? C.red : C.green;
  const decisionColor =
    decision.tone === "red"
      ? C.red
      : decision.tone === "orange" || decision.tone === "yellow"
        ? C.amber
        : C.green;
  const systemMessage = (
    <span>
      <b style={{ color: conceptColor }}>
        {trace.conceptDrift.result === "Drifted" ? "ตรวจพบ Concept Drift" : "Concept Drift Stable"}
      </b>
      {" "}· Metric Stability {trace.metricStability.result} (MCC {fmtRatio(signals.mcc)})
      <span style={{ color: C.subtext }}> · </span>
      <span style={{ color: dataColor }}>Data Drift {trace.dataDrift.result}</span>
    </span>
  );
  
  const greetingMessage = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="lang-en">
        <div style={{ fontWeight: 700 }}>ARIA - Decision Support System | AML Risk Intelligence</div>
        <div style={{ marginTop: 6 }}>
          Hello. I'm ARIA, your analytical advisor for KPI monitoring and risk decision support. I can help you with:
        </div>
        <ol style={{ margin: "8px 0 0 18px", color: C.subtext }}>
          <li>KPI status check - current values, thresholds, and trend context</li>
          <li>Root cause analysis - why a KPI is behaving the way it is</li>
          <li>Remediation options - structured plan with trade-offs for each choice</li>
          <li>Scenario analysis - projected impact of proposed changes</li>
          <li>Weekly digest - full performance summary with priority focus areas</li>
        </ol>
        <div style={{ marginTop: 6 }}>
          Current recommendation: <b style={{ color: decisionColor }}>{decision.tag}</b>.
        </div>
        <div style={{ marginTop: 6 }}>What would you like to analyze?</div>
      </div>
      <div className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
        <div style={{ fontWeight: 700 }}>ARIA - ระบบสนับสนุนการตัดสินใจ | ข่าวกรองความเสี่ยง AML</div>
        <div style={{ marginTop: 6 }}>
          สวัสดี ฉันคือ ARIA ที่ปรึกษาวิเคราะห์สำหรับการติดตาม KPI และการสนับสนุนการตัดสินใจด้านความเสี่ยง ฉันช่วยคุณได้ในเรื่อง:
        </div>
        <ol style={{ margin: "8px 0 0 18px", color: C.subtext }}>
          <li>ตรวจสอบสถานะ KPI - ค่าปัจจุบัน เกณฑ์ และบริบทแนวโน้ม</li>
          <li>วิเคราะห์สาเหตุหลัก - ทำไม KPI จึงเป็นแบบนี้</li>
          <li>ตัวเลือกการแก้ไข - แผนทางเลือกพร้อมข้อแลกเปลี่ยน</li>
          <li>การวิเคราะห์สถานการณ์ - ผลกระทบที่คาดจากการเปลี่ยนแปลง</li>
          <li>สรุปรายสัปดาห์ - ภาพรวมผลการดำเนินงานและประเด็นสำคัญ</li>
        </ol>
        <div style={{ marginTop: 6 }}>
          คำแนะนำปัจจุบัน: <b style={{ color: decisionColor }}>{decision.tag}</b>.
        </div>
        <div style={{ marginTop: 6 }}>ต้องการให้ช่วยวิเคราะห์เรื่องใด?</div>
      </div>
    </div>
  );

  const base: ChatMsg[] = [
    { id: "intro-0", from: "bot", kind: "text", body: greetingMessage },
    { id: "sys-1", from: "bot", kind: "system", body: systemMessage },
    { id: "rec-1", from: "bot", kind: "action" },
    { id: "ch-1", from: "bot", kind: "choices" },
  ];
  if (decision.action !== "Still_Valid_GO") {
    base.push({ id: "risk-1", from: "bot", kind: "risk" });
  }
  return base;
}

function renderChatResponse(response: ChatResponse, onSend: (msg: string) => void): React.ReactNode {
  const getEn = (item: any) => typeof item === 'string' ? item : item?.en || '';
  const getTh = (item: any) => typeof item === 'string' ? (TH_MAP[item] ?? item) : item?.th || item?.en || '';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontWeight: 700 }}><L en={getEn(response.title)} th={getTh(response.title)} /></div>
      <div style={{ color: C.text }}><L en={getEn(response.message)} th={getTh(response.message)} /></div>
      {response.details && response.details.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 16, color: C.subtext }}>
          {response.details.map((d, i) => (
            <li key={`d-${i}`}><L en={getEn(d)} th={getTh(d)} /></li>
          ))}
        </ul>
      )}
      {response.followups && response.followups.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          {response.followups.map((f, i) => {
            const sendVal = typeof f === 'string' ? f : f.en;
            return (
              <button
                key={`f-${i}`}
                type="button"
                onClick={() => onSend(sendVal)}
                aria-label={`Follow up: ${getEn(f)}`}
                style={{
                  background: "rgba(30,111,217,0.15)",
                  border: `1px solid rgba(30,111,217,0.4)`,
                  color: "#7BB0F4",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: FONT,
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(30,111,217,0.25)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(30,111,217,0.15)")}
              >
                <L en={getEn(f)} th={getTh(f)} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SuggestionChips({ chips, onSend }: { chips: { en: string; th?: string }[]; onSend: (msg: string) => void }) {
  const lang = useLang();
  if (!chips || chips.length === 0) return null;
  return (
    <div
      style={{
        padding: "8px 14px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        gap: 8,
        overflowX: "auto",
        scrollbarWidth: "none",
        background: C.card,
      }}
    >
      {chips.map((chip) => {
        const labelEn = chip.en;
        const labelTh = chip.th ?? chip.en;
        const sendText = lang === "th" ? labelTh : labelEn;
        return (
          <button
            key={labelEn}
            type="button"
            onClick={() => onSend(sendText)}
            aria-label={`Suggest: ${labelEn}`}
            style={{
              background: C.base,
              border: `1px solid ${C.border}`,
              color: C.text,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: FONT,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `1px solid ${C.blue}88`;
              e.currentTarget.style.color = "#7BB0F4";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `1px solid ${C.border}`;
              e.currentTarget.style.color = C.text;
            }}
          >
            <L en={labelEn} th={labelTh} />
          </button>
        );
      })}
    </div>
  );
}

function RuleDetailPanel({
  data,
  onRetrain,
  onSchedule,
  onMonitor,
  onAdjustThreshold,
  onSimulate,
  onForceRollback,
}: {
  data?: RuleDetailData;
  onRetrain: () => void;
  onSchedule: () => void;
  onMonitor: () => void;
  onAdjustThreshold: () => void;
  onSimulate: () => void;
  onForceRollback: () => void;
}) {
  if (!data) return null;
  const statusColor = data.status === "TRIGGERED" ? C.red : data.status === "ACTIVE" ? C.amber : C.green;

  return (
    <div
      style={{
        background: C.base,
        borderTop: `1px dashed ${C.border}`,
        padding: "20px 24px",
        animation: "ariaSlideDown 0.2s ease-out",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: FONT,
      }}
    >
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.6,
            padding: "4px 10px",
            borderRadius: 999,
            background: `${statusColor}1F`,
            color: statusColor,
            border: `1px solid ${statusColor}55`,
          }}
        >
          {data.status}
        </span>
        <span style={{ fontSize: 11, color: C.faint }}>Last triggered: {data.lastTriggered}</span>
      </div>

      {/* Condition table */}
      <div>
        <div style={{ fontSize: 11, color: C.subtext, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
          Condition Table / ตารางเงื่อนไข
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.7fr", padding: "8px 12px", background: "rgba(255,255,255,0.03)", fontSize: 10, color: C.subtext, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700 }}>
            <span>Condition</span>
            <span>Target</span>
            <span>Current</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>
          {data.conditions.map((c, i) => (
            <div
              key={`c-${i}`}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 0.7fr",
                padding: "8px 12px",
                fontSize: 12,
                borderTop: `1px solid ${C.border}`,
                background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                color: C.text,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{c.cond}</span>
              <span style={{ color: C.subtext }}>{c.target}</span>
              <span style={{ color: c.pass ? C.green : C.red, fontWeight: 600 }}>{c.current}</span>
              <span style={{ textAlign: "right", color: c.pass ? C.green : C.red, fontWeight: 700, fontSize: 11 }}>
                {c.pass ? "PASS ✓" : "FAIL ✗"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      {data.note && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: data.note.tone === "amber" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
            border: `1px solid ${data.note.tone === "amber" ? C.amber + "55" : C.green + "55"}`,
            fontSize: 12,
            color: C.text,
            lineHeight: 1.55,
          }}
        >
          <div>{data.note.en}</div>
          <div style={{ fontFamily: "'Noto Sans Thai', sans-serif", color: C.subtext, marginTop: 2 }}>{data.note.th}</div>
        </div>
      )}

      {/* SHAP */}
      {data.shap && (
        <div>
          <div style={{ fontSize: 11, color: C.subtext, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Top Contributing Features / <span style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>Feature ที่ส่งผลต่อ Recall มากที่สุด</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.shap.map((s) => {
              const color = s.tone === "red" ? C.red : C.amber;
              const pct = Math.round((s.weight / 0.4) * 100);
              return (
                <div key={s.feature} style={{ display: "grid", gridTemplateColumns: "200px 1fr 60px", alignItems: "center", gap: 12, fontSize: 12 }}>
                  <span style={{ color: C.text, fontFamily: "ui-monospace, monospace" }}>{s.feature}</span>
                  <div style={{ height: 8, background: C.cardHi, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 8px ${color}66` }} />
                  </div>
                  <span style={{ textAlign: "right", color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>+{s.weight.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rule logic */}
      {data.logic && (
        <div>
          <div style={{ fontSize: 11, color: C.subtext, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Rule Logic
          </div>
          <pre
            style={{
              background: C.base,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "12px 16px",
              margin: 0,
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize: 13,
              color: C.text,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {data.logic.map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\b(IF|AND|OR|THEN)\b/g, `<span style="color:${C.blue};font-weight:700">$1</span>`) }} />
            ))}
          </pre>
          {data.systemHealth && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: 12, marginTop: 12 }}>
              <div style={{ padding: "8px 12px", background: "rgba(16,185,129,0.08)", border: `1px solid ${C.green}55`, borderRadius: 8 }}>
                <div style={{ color: C.subtext, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Latency</div>
                <div style={{ color: C.green, fontWeight: 700, marginTop: 2 }}>{data.systemHealth.latency} ✓</div>
              </div>
              <div style={{ padding: "8px 12px", background: "rgba(245,158,11,0.08)", border: `1px solid ${C.amber}55`, borderRadius: 8 }}>
                <div style={{ color: C.subtext, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>CPU</div>
                <div style={{ color: C.amber, fontWeight: 700, marginTop: 2 }}>{data.systemHealth.cpu}</div>
              </div>
              <div style={{ padding: "8px 12px", background: "rgba(16,185,129,0.08)", border: `1px solid ${C.green}55`, borderRadius: 8 }}>
                <div style={{ color: C.subtext, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Memory</div>
                <div style={{ color: C.green, fontWeight: 700, marginTop: 2 }}>{data.systemHealth.memory} ✓</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning (Rule 5) */}
      {data.warning && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.08)",
            border: `1px solid ${C.red}66`,
            fontSize: 12,
            color: C.text,
            lineHeight: 1.55,
          }}
        >
          <div style={{ fontWeight: 700, color: C.red }}>⚠ Warning</div>
          <div style={{ marginTop: 4 }}>{data.warning.en}</div>
          <div style={{ fontFamily: "'Noto Sans Thai', sans-serif", color: C.subtext, marginTop: 2 }}>{data.warning.th}</div>
        </div>
      )}

      {/* Action buttons */}
      {data.actions.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {data.actions.includes("retrain") && (
            <button type="button" onClick={onRetrain} style={panelBtn(C.blue, true)}>Re-train ทันที / Re-train Now</button>
          )}
          {data.actions.includes("schedule") && (
            <button type="button" onClick={onSchedule} style={panelBtn(C.border, false)}>Schedule Off-peak 02:00</button>
          )}
          {data.actions.includes("monitor") && (
            <button type="button" onClick={onMonitor} style={panelBtn(C.border, false)}>Monitor ต่อ / Monitor</button>
          )}
          {data.actions.includes("threshold") && (
            <button type="button" onClick={onAdjustThreshold} style={panelBtn(C.blue, true)}>Adjust Threshold / ปรับ Threshold</button>
          )}
          {data.actions.includes("simulate") && (
            <button type="button" onClick={onSimulate} style={panelBtn(C.border, false)}>Simulate Rule / จำลอง Rule</button>
          )}
          {data.actions.includes("rollback") && (
            <button type="button" onClick={onForceRollback} style={panelBtn(C.red, false, true)}>Force Rollback / บังคับ Rollback</button>
          )}
        </div>
      )}
    </div>
  );
}

function panelBtn(color: string, primary: boolean, danger = false): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT,
    background: primary ? `linear-gradient(135deg, ${color}, #4A8DEE)` : danger ? color : "transparent",
    color: primary || danger ? "white" : C.subtext,
    border: primary || danger ? "none" : `1px solid ${color}`,
  };
}
