import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Send,
  Mic,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  Cpu,
  Database,
  Bot,
  User as UserIcon,
  TrendingUp,
  Zap,
} from "lucide-react";
import { KpiMiniBar, UnifiedNav, type ScreenId as ShellScreenId } from "./aml-shell";
import { ModalButton, ModalShell, pushToast } from "./aml-interactions";
import { ChevronDown } from "lucide-react";

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

type KpiStatus = "pass" | "warn" | "fail";

const kpis: {
  en: string;
  th: string;
  value: string;
  target: string;
  status: KpiStatus;
}[] = [
  { en: "Recall / Detection Rate", th: "อัตราการตรวจจับ", value: "78.0%", target: "≥ 85%", status: "fail" },
  { en: "False Positive Rate", th: "อัตราแจ้งเตือนผิด", value: "16.4%", target: "≤ 20%", status: "pass" },
  { en: "Flagged Rate", th: "อัตราการแจ้งเตือน", value: "8.7%", target: "≤ 5%", status: "warn" },
  { en: "Pattern Coverage", th: "ครอบคลุมรูปแบบ", value: "75.0%", target: "≥ 80%", status: "warn" },
  { en: "Precision", th: "ความแม่นยำ", value: "29.1%", target: "≥ 30%", status: "warn" },
];

type RuleStatus = "TRIGGERED" | "ACTIVE" | "CLEAR";

const rules: {
  num: number;
  nameEn: string;
  nameTh: string;
  conditions: string;
  status: RuleStatus;
  tone: "green" | "amber" | "red" | "blue" | "violet";
  tag: string;
}[] = [
  {
    num: 1,
    nameEn: "Still Valid (Go)",
    nameTh: "โมเดลใช้งานได้",
    conditions: "All KPIs within target & no drift",
    status: "CLEAR",
    tone: "green",
    tag: "GO",
  },
  {
    num: 2,
    nameEn: "Re-train Model",
    nameTh: "ฝึกโมเดลใหม่",
    conditions: "Drift = Yes · Recall 78% < 85%",
    status: "TRIGGERED",
    tone: "red",
    tag: "RETRAIN",
  },
  {
    num: 3,
    nameEn: "Tune Threshold / Sensitivity",
    nameTh: "ปรับเกณฑ์การตัดสินใจ",
    conditions: "FPR > 20% & Flagged > 5% with no drift",
    status: "ACTIVE",
    tone: "amber",
    tag: "TUNE",
  },
  {
    num: 4,
    nameEn: "Optimize System / Resource",
    nameTh: "ปรับระบบ / ทรัพยากร",
    conditions: "All KPIs OK but System = Not OK",
    status: "CLEAR",
    tone: "blue",
    tag: "OPTIMIZE",
  },
  {
    num: 5,
    nameEn: "Emergency Rollback",
    nameTh: "ย้อนกลับโมเดลฉุกเฉิน",
    conditions: "Drift + critical KPI collapse",
    status: "CLEAR",
    tone: "violet",
    tag: "ROLLBACK",
  },
];

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
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "sys-1",
      from: "bot",
      kind: "system",
      body: (
        <span>
          <b style={{ color: C.red }}>ตรวจพบ Concept Drift</b> — Rule 2 Triggered. Recall ลดลงเหลือ <b>78%</b> (Target ≥ 85%) <span style={{ color: C.subtext }}>·</span> Drift Detected: <b>Yes</b>
        </span>
      ),
    },
    { id: "rec-1", from: "bot", kind: "action" },
    { id: "ch-1", from: "bot", kind: "choices" },
    { id: "risk-1", from: "bot", kind: "risk" },
  ]);
  const [input, setInput] = useState("");
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [ruleModal, setRuleModal] = useState<null | "retrain" | "schedule" | "threshold" | "rollback">(null);
  const [rollbackInput, setRollbackInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleChoice = (label: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", kind: "text", body: label },
      {
        id: `b-${Date.now()}`,
        from: "bot",
        kind: "text",
        body: (
          <span>
            ✅ คำสั่งรับเรียบร้อย: <b>{label}</b>. ระบบจะดำเนินการตามขั้นตอนและบันทึกใน audit log.
          </span>
        ),
      },
    ]);
  };

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", kind: "text", body: t },
      {
        id: `b-${Date.now()}`,
        from: "bot",
        kind: "text",
        body: (
          <span>
            กำลังประมวลผลคำถาม "{t}" · ระบบเป็น rule-based assistant ขอให้ใช้ปุ่มลัดด้านบนเพื่อผลลัพธ์ที่แม่นยำที่สุด.
          </span>
        ),
      },
    ]);
    setInput("");
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
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Decision Rules · 5 active</div>
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
                      ruleNum={r.num}
                      onRetrain={() => setRuleModal("retrain")}
                      onSchedule={() => setRuleModal("schedule")}
                      onMonitor={() => pushToast({ tone: "amber", title: "Monitoring continued", sub: "กำลัง Monitor ต่อ — จะแจ้งเตือนเมื่อ KPI เปลี่ยน" })}
                      onAdjustThreshold={() => setRuleModal("threshold")}
                      onSimulate={() => pushToast({ tone: "amber", title: "Simulating Rule 3", sub: "Rule 3 would trigger if FPR reaches 20.1%" })}
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
                              background: `linear-gradient(135deg, ${C.red}, #C0392B)`,
                              color: "white",
                              fontSize: 16,
                              fontWeight: 700,
                              letterSpacing: 0.4,
                              boxShadow: `0 0 24px ${C.redGlow}`,
                            }}
                          >
                            <Zap size={16} /> RE-TRAIN MODEL
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
                          <div style={{ fontSize: 18, color: "#E2EDFD", marginTop: 2, letterSpacing: -0.4 }}>87%</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, color: C.subtext, lineHeight: 1.6 }}>
                        Drift detected และ Recall ต่ำกว่า threshold ระบบแนะนำให้ฝึกโมเดลใหม่ด้วยข้อมูล 30 วันล่าสุด เพื่อกู้คืนความสามารถในการตรวจจับ.
                      </div>
                    </div>
                  );
                }
                if (m.kind === "choices") {
                  const choices = [
                    { k: "A", label: "Re-train ทันที", en: "Re-train now", tone: C.red },
                    { k: "B", label: "Re-train ช่วง Off-peak (02:00)", en: "Off-peak schedule", tone: C.amber },
                    { k: "C", label: "ดู Detail ก่อน", en: "Review details", tone: C.blue },
                    { k: "D", label: "Monitor ต่อ / ยกเลิก", en: "Continue monitoring", tone: C.faint },
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
                        <b style={{ color: C.amber }}>⚠️ Risk:</b> หากไม่ Re-train ภายใน <b>24 ชม.</b> Recall อาจลดลงต่อเนื่องและกระทบต่อความสามารถในการตรวจจับธุรกรรมต้องสงสัย.
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
            primary={<><DriftDot color={C.red} /> Data Drift</>}
            secondary={<><DriftDot color={C.red} /> Concept Drift</>}
            sub="ตรวจพบ Drift / Detected"
          />
          <StatusItem
            icon={<Cpu size={14} color={C.green} />}
            label="System Health"
            primary={<span style={{ color: C.green }}>Latency OK</span>}
            secondary={<span style={{ color: C.green }}>CPU OK</span>}
            sub="ระบบปกติ / Healthy"
          />
          <StatusItem
            icon={<TrendingUp size={14} color="#7BB0F4" />}
            label="Champion vs Challenger"
            primary={
              <span>
                <span style={{ color: C.green, fontWeight: 700 }}>+3.2%</span>{" "}
                <span style={{ color: C.subtext }}>Recall</span>
              </span>
            }
            secondary={<span>XGBoost <span style={{ color: C.faint }}>vs</span> Random Forest</span>}
            sub="โมเดลปัจจุบันชนะ / Current model leads"
          />
          <StatusItem
            icon={<Database size={14} color="#A8C8F1" />}
            label="Last Action Log"
            primary={<span style={{ color: C.text, fontWeight: 600 }}>Re-train completed</span>}
            secondary={<span style={{ color: C.subtext }}>2025-04-28 02:14</span>}
            sub="ฝึกโมเดลล่าสุดเสร็จเรียบร้อย"
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
                pushToast({ tone: "red", title: "Re-train started", sub: "เริ่มฝึกโมเดล Rule 2 · IN PROGRESS" });
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
                pushToast({ tone: "amber", title: "Threshold updated", sub: "τ = 0.45 · Recall ↑ 82% · FPR ↑ 18%" });
              }}
            >
              Apply
            </ModalButton>
          </>
        }
      >
        <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.6 }}>
          Lower τ → higher Recall, higher FPR. Adjust slider in detail panel preview.
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
  accent: string;
  conditions: Cond[];
  note?: { tone: "amber" | "green"; en: string; th: string };
  shap?: { feature: string; weight: number; tone: "red" | "amber" }[];
  logic?: string[];
  systemHealth?: { latency: string; cpu: string; memory: string };
  warning?: { en: string; th: string };
  lastTriggered: string;
  actions: ("retrain" | "schedule" | "monitor" | "threshold" | "simulate" | "rollback")[];
};

const RULE_DATA: Record<number, RuleDetailData> = {
  1: {
    status: "CLEAR",
    accent: C.green,
    conditions: [
      { cond: "Recall", target: "≥ 85%", current: "78.0%", pass: false },
      { cond: "FPR", target: "≤ 20%", current: "16.4%", pass: true },
      { cond: "Flagged Rate", target: "≤ 5%", current: "8.7%", pass: false },
      { cond: "Pattern Coverage", target: "≥ 80%", current: "75.0%", pass: false },
      { cond: "Precision", target: "≥ 30%", current: "29.1%", pass: false },
      { cond: "System Status", target: "OK", current: "OK", pass: true },
      { cond: "Drift Detected", target: "No", current: "Yes", pass: false },
    ],
    note: { tone: "amber", en: "Rule 1 requires ALL conditions met. Current data does not satisfy Rule 1.", th: "Rule 1 ต้องผ่านทุกเงื่อนไข — ปัจจุบันยังไม่ครบ" },
    lastTriggered: "Never triggered / ไม่เคย trigger",
    actions: [],
  },
  2: {
    status: "TRIGGERED",
    accent: C.red,
    conditions: [
      { cond: "Recall", target: "< 85%", current: "78.0%", pass: true },
      { cond: "Drift Detected", target: "Yes", current: "Yes", pass: true },
      { cond: "Pattern Coverage", target: "< 80%", current: "75.0%", pass: true },
      { cond: "Precision", target: "< 30%", current: "29.1%", pass: true },
    ],
    shap: [
      { feature: "transaction_velocity", weight: 0.34, tone: "red" },
      { feature: "amount_zscore", weight: 0.21, tone: "red" },
      { feature: "time_since_last_txn", weight: 0.18, tone: "amber" },
    ],
    logic: [
      "IF Drift == 'Yes'",
      "AND (Recall < 0.85",
      "     OR Pattern_Coverage < 0.80",
      "     OR Precision < 0.30)",
      "THEN 'RE-TRAIN MODEL'",
    ],
    lastTriggered: "Today 09:42 / วันนี้ 09:42",
    actions: ["retrain", "schedule", "monitor"],
  },
  3: {
    status: "ACTIVE",
    accent: C.amber,
    conditions: [
      { cond: "Recall", target: "≥ 85%", current: "78.0%", pass: false },
      { cond: "FPR", target: "> 20%", current: "16.4%", pass: false },
      { cond: "Flagged Rate", target: "> 5%", current: "8.7%", pass: true },
      { cond: "Pattern Coverage", target: "≥ 80%", current: "75.0%", pass: false },
      { cond: "Precision", target: "< 30%", current: "29.1%", pass: true },
      { cond: "Drift", target: "No", current: "Yes", pass: false },
    ],
    note: { tone: "amber", en: "Some conditions pass — rule not fully triggered.", th: "บางเงื่อนไขผ่าน — Rule ยังไม่ fully triggered" },
    logic: [
      "IF Recall >= 0.85 AND Pattern_Coverage >= 0.80",
      "AND FPR > 0.20 AND Flagged_Rate > 0.05",
      "AND Precision < 0.30 AND Drift == 'No'",
      "THEN 'TUNE THRESHOLD / SENSITIVITY'",
    ],
    lastTriggered: "3 days ago / 3 วันที่แล้ว",
    actions: ["threshold", "simulate"],
  },
  4: {
    status: "CLEAR",
    accent: C.green,
    conditions: [
      { cond: "Recall", target: "≥ 85%", current: "78.0%", pass: false },
      { cond: "FPR", target: "≤ 20%", current: "16.4%", pass: true },
      { cond: "Flagged Rate", target: "≤ 5%", current: "8.7%", pass: false },
      { cond: "Pattern Coverage", target: "≥ 80%", current: "75.0%", pass: false },
      { cond: "Precision", target: "≥ 30%", current: "29.1%", pass: false },
      { cond: "Drift", target: "No", current: "Yes", pass: false },
      { cond: "System Status", target: "Not OK", current: "OK", pass: false },
    ],
    note: { tone: "green", en: "System healthy — Rule 4 not triggered.", th: "ระบบทำงานปกติ — Rule 4 ไม่ถูก trigger" },
    logic: [
      "IF Recall >= 0.85 AND FPR <= 0.20",
      "AND Flagged_Rate <= 0.05 AND Pattern_Coverage >= 0.80",
      "AND Precision >= 0.30 AND Drift == 'No'",
      "AND System == 'Not OK'",
      "THEN 'OPTIMIZE SYSTEM / RESOURCE'",
    ],
    systemHealth: { latency: "OK", cpu: "67%", memory: "Normal" },
    lastTriggered: "Never / ไม่เคย",
    actions: [],
  },
  5: {
    status: "CLEAR",
    accent: C.green,
    conditions: [
      { cond: "Recall", target: "< 50%", current: "78.0%", pass: false },
      { cond: "Pattern Coverage", target: "< 50%", current: "75.0%", pass: false },
      { cond: "Precision", target: "< 10%", current: "29.1%", pass: false },
      { cond: "Drift", target: "Yes", current: "Yes", pass: true },
    ],
    note: { tone: "green", en: "Recall and Precision still above emergency floor — rollback not required.", th: "Recall และ Precision ยังอยู่เหนือเกณฑ์ฉุกเฉิน — ไม่จำเป็นต้อง Rollback" },
    logic: [
      "IF Drift == 'Yes'",
      "AND (Recall < 0.50",
      "     OR Pattern_Coverage < 0.50",
      "     OR Precision < 0.10)",
      "THEN 'EMERGENCY ROLLBACK'",
    ],
    warning: {
      en: "If Recall continues to drop to 50%, this rule will auto-trigger. Gap to trigger: -28% Recall.",
      th: "หาก Recall ลดลงต่อเนื่องถึง 50% Rule นี้จะถูก trigger อัตโนมัติ · ระยะห่างจาก trigger: Recall ต้องลดอีก 28%",
    },
    lastTriggered: "Never / ไม่เคย",
    actions: ["rollback"],
  },
};

function RuleDetailPanel({
  ruleNum,
  onRetrain,
  onSchedule,
  onMonitor,
  onAdjustThreshold,
  onSimulate,
  onForceRollback,
}: {
  ruleNum: number;
  onRetrain: () => void;
  onSchedule: () => void;
  onMonitor: () => void;
  onAdjustThreshold: () => void;
  onSimulate: () => void;
  onForceRollback: () => void;
}) {
  const data = RULE_DATA[ruleNum];
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
        </div>
      )}

      {/* System health (Rule 4) */}
      {data.systemHealth && (
        <div>
          <div style={{ fontSize: 11, color: C.subtext, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            System Health
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: 12 }}>
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
