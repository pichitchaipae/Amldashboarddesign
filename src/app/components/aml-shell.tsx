import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Bell, Bot, Clock, Info, ShieldCheck, Sparkles } from "lucide-react";
import { LangToggle } from "./aml-language";

export const C = {
  base: "#0A1628",
  card: "#0F2140",
  cardHi: "#142A52",
  border: "#1A3050",
  borderSoft: "#1A2A4A",
  blue: "#1E6FD9",
  blueGlow: "rgba(30, 111, 217, 0.35)",
  amber: "#F59E0B",
  amberGlow: "rgba(245, 158, 11, 0.45)",
  red: "#EF4444",
  redGlow: "rgba(239, 68, 68, 0.45)",
  green: "#10B981",
  text: "#F0F4F8",
  subtext: "#8FA3BC",
  faint: "#6B7E9F",
};

export const FONT = "'Inter', 'Noto Sans Thai', system-ui, sans-serif";

export type ScreenId = "objectives" | "overview" | "aria";

const TABS: { id: ScreenId; label: string }[] = [
  { id: "objectives", label: "Objectives & KPIs" },
  { id: "overview", label: "Detection Overview" },
  { id: "aria", label: "ARIA Assistant" },
];

export function UnifiedNav({
  currentScreen,
  onSwitchScreen,
}: {
  currentScreen: ScreenId;
  onSwitchScreen: (s: ScreenId) => void;
}) {
  return (
    <div
      style={{
        background: "rgba(10, 22, 40, 0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${C.border}`,
        height: 64,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        position: "sticky",
        top: 0,
        zIndex: 30,
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${C.blue}, #4A8DEE)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 24px ${C.blueGlow}`,
          }}
        >
          <Sparkles size={18} color="white" />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.4, color: C.text }}>ARIA</div>
          <div style={{ fontSize: 11, color: C.subtext }}>AML Intelligence Assistant</div>
        </div>

        <nav
          style={{
            marginLeft: 16,
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 10,
            background: C.card,
            border: `1px solid ${C.border}`,
          }}
        >
          {TABS.map((t) => {
            const active = t.id === currentScreen;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSwitchScreen(t.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: active ? `linear-gradient(135deg, ${C.blue}, #4A8DEE)` : "transparent",
                  color: active ? "white" : C.subtext,
                  boxShadow: active ? `0 0 16px ${C.blueGlow}` : "none",
                  transition: "all 0.15s",
                  fontFamily: FONT,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            borderRadius: 999,
            background: C.card,
            border: `1px solid ${C.border}`,
            fontSize: 12,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              borderRadius: 6,
              background: "rgba(30,111,217,0.15)",
              color: "#7BB0F4",
              fontWeight: 700,
              fontSize: 11,
              border: "1px solid rgba(30,111,217,0.35)",
              letterSpacing: 0.4,
            }}
          >
            <ShieldCheck size={11} /> CHAMPION
          </span>
          <span style={{ color: C.text, fontWeight: 600 }}>XGBoost</span>
          <span style={{ color: C.faint }}>|</span>
          <span style={{ color: C.subtext }}>Status:</span>
          <span style={{ color: C.amber, fontWeight: 700, letterSpacing: 0.3 }}>STABLE</span>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: C.amber,
              boxShadow: `0 0 8px ${C.amber}`,
              animation: "amlPulse 1.6s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, color: C.subtext, fontSize: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Clock size={13} /> Last updated 2 min ago
        </span>
        <LangToggle />
        <NotificationBell onSwitchScreen={onSwitchScreen} />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${C.blue}, #8B5CF6)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "white",
          }}
        >
          AC
        </div>
      </div>
    </div>
  );
}

type NotifItem = {
  id: string;
  tone: "red" | "amber" | "blue";
  title: string;
  body: string;
  time: string;
  cta?: { label: string; target: ScreenId };
  unread: boolean;
};

const INIT_NOTIFS: NotifItem[] = [
  {
    id: "n1",
    tone: "red",
    title: "Rule 2 Triggered / Rule 2 ถูก Trigger แล้ว",
    body: "Recall ลดเหลือ 78% · Concept Drift Detected",
    time: "2 min ago / 2 นาทีที่แล้ว",
    cta: { label: "View Rule / ดู Rule", target: "aria" },
    unread: true,
  },
  {
    id: "n2",
    tone: "amber",
    title: "Pattern Coverage Warning / คำเตือน Pattern Coverage",
    body: "Pattern Coverage อยู่ที่ 75% ต่ำกว่า Target 80%",
    time: "15 min ago / 15 นาทีที่แล้ว",
    cta: { label: "View KPI / ดู KPI", target: "objectives" },
    unread: true,
  },
  {
    id: "n3",
    tone: "blue",
    title: "Champion Model Stable / โมเดล Champion เสถียร",
    body: "XGBoost ทำงานปกติ · Status: STABLE",
    time: "1 hour ago / 1 ชั่วโมงที่แล้ว",
    unread: false,
  },
];

function NotificationBell({ onSwitchScreen }: { onSwitchScreen: (s: ScreenId) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>(INIT_NOTIFS);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const unread = items.some((i) => i.unread);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "relative",
          padding: 8,
          borderRadius: 8,
          background: open ? C.cardHi : "transparent",
          border: `1px solid ${C.border}`,
          color: C.text,
          cursor: "pointer",
        }}
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Bell size={15} />
        {unread && (
          <span
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: 999,
              background: C.red,
              boxShadow: `0 0 8px ${C.redGlow}`,
            }}
          />
        )}
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            overflow: "hidden",
            zIndex: 60,
            fontFamily: FONT,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              Notifications / การแจ้งเตือน
            </div>
            <button
              type="button"
              onClick={() => setItems((xs) => xs.map((x) => ({ ...x, unread: false })))}
              style={{
                background: "transparent",
                border: "none",
                color: C.blue,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              Mark all read
            </button>
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {items.map((n) => {
              const color = n.tone === "red" ? C.red : n.tone === "amber" ? C.amber : C.blue;
              const Icon = n.tone === "red" ? AlertCircle : n.tone === "amber" ? AlertTriangle : Info;
              const bg =
                n.unread && n.tone === "red"
                  ? "rgba(239,68,68,0.08)"
                  : n.unread && n.tone === "amber"
                    ? "rgba(245,158,11,0.08)"
                    : "transparent";
              return (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: n.unread ? `3px solid ${color}` : "3px solid transparent",
                    background: bg,
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, lineHeight: 1.45 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: n.unread ? C.text : C.subtext }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: C.subtext, marginTop: 2 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{n.time}</div>
                    {n.cta && (
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchScreen(n.cta!.target);
                          setOpen(false);
                          setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
                        }}
                        style={{
                          marginTop: 8,
                          padding: "5px 10px",
                          background: `linear-gradient(135deg, ${C.blue}, #4A8DEE)`,
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: FONT,
                        }}
                      >
                        {n.cta.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: C.blue,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              View all notifications / ดูการแจ้งเตือนทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type MiniKpi = { label: string; value: string; tone: "pass" | "warn" | "fail" };

const MINI_KPIS: MiniKpi[] = [
  { label: "Recall", value: "78.0%", tone: "fail" },
  { label: "FPR", value: "16.4%", tone: "pass" },
  { label: "Flagged", value: "8.7%", tone: "warn" },
  { label: "Pattern Coverage", value: "75.0%", tone: "warn" },
  { label: "Precision", value: "29.1%", tone: "warn" },
];

const TONE_COLOR: Record<MiniKpi["tone"], string> = {
  pass: C.green,
  warn: C.amber,
  fail: C.red,
};

export function KpiMiniBar() {
  return (
    <div
      style={{
        height: 48,
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 8,
        fontFamily: FONT,
        position: "sticky",
        top: 64,
        zIndex: 25,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflowX: "auto" }}>
        {MINI_KPIS.map((k) => {
          const color = TONE_COLOR[k.tone];
          return (
            <div
              key={`mini-${k.label}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px",
                borderRadius: 999,
                background: `${color}1A`,
                border: `1px solid ${color}55`,
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ color: C.subtext, fontWeight: 600, letterSpacing: 0.3 }}>{k.label}</span>
              <span style={{ color: C.text, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{k.value}</span>
            </div>
          );
        })}
      </div>
      <span style={{ fontSize: 12, color: C.subtext, whiteSpace: "nowrap" }}>Last updated 2 min ago</span>
    </div>
  );
}

export function AriaFloatingButton({
  onClick,
  hasAlert = true,
}: {
  onClick: () => void;
  hasAlert?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open ARIA Assistant"
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 50,
        background: `linear-gradient(135deg, ${C.blue}, #4A8DEE)`,
        color: "white",
        border: "none",
        borderRadius: 999,
        padding: "12px 18px",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0.4,
        boxShadow: hasAlert
          ? `0 0 0 4px ${C.amberGlow}, 0 8px 32px ${C.blueGlow}`
          : `0 8px 32px ${C.blueGlow}`,
        animation: hasAlert ? "amlAriaRing 1.8s ease-in-out infinite" : undefined,
      }}
    >
      <Bot size={16} />
      <span>ARIA</span>
      {hasAlert && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 999,
            background: C.amber,
            color: "#1F1300",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.4,
          }}
        >
          1 ALERT
        </span>
      )}
    </button>
  );
}

/**
 * Dark skin: scoped CSS overrides that recolor the existing light-theme
 * Tailwind classes to match the unified palette without rewriting markup.
 */
export function AmlDarkSkin() {
  return (
    <style>{`
      @keyframes amlPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }
      @keyframes amlAriaRing {
        0%,100% { box-shadow: 0 0 0 4px rgba(245,158,11,0.45), 0 8px 32px rgba(30,111,217,0.35); }
        50%     { box-shadow: 0 0 0 9px rgba(245,158,11,0.10), 0 8px 32px rgba(30,111,217,0.45); }
      }

      .aml-dark { background: ${C.base}; color: ${C.text}; font-family: ${FONT}; min-height: 100vh; }
      .aml-dark main { background: ${C.base}; }

      /* Surfaces */
      .aml-dark .bg-white { background-color: ${C.card} !important; }
      .aml-dark .bg-slate-50 { background-color: ${C.card} !important; }
      .aml-dark .bg-slate-100 { background-color: #14264A !important; }
      .aml-dark .bg-slate-50\\/70 { background-color: rgba(30,111,217,0.06) !important; }
      .aml-dark .bg-slate-50\\/60 { background-color: rgba(30,111,217,0.05) !important; }
      .aml-dark .bg-slate-900 { background-color: ${C.blue} !important; }
      .aml-dark .bg-slate-700 { background-color: ${C.text} !important; }
      .aml-dark .bg-slate-300 { background-color: ${C.faint} !important; }

      /* Text */
      .aml-dark .text-slate-900 { color: ${C.text} !important; }
      .aml-dark .text-slate-800 { color: ${C.text} !important; }
      .aml-dark .text-slate-700 { color: ${C.text} !important; }
      .aml-dark .text-slate-600 { color: #B8C5D6 !important; }
      .aml-dark .text-slate-500 { color: ${C.subtext} !important; }
      .aml-dark .text-slate-400 { color: ${C.faint} !important; }
      .aml-dark .text-slate-300 { color: ${C.faint} !important; }

      /* Borders */
      .aml-dark .border-slate-100,
      .aml-dark .border-slate-200,
      .aml-dark .border-slate-300 { border-color: ${C.border} !important; }
      .aml-dark .divide-slate-100 > :not([hidden]) ~ :not([hidden]),
      .aml-dark .divide-slate-200 > :not([hidden]) ~ :not([hidden]) { border-color: ${C.border} !important; }

      /* Status tints (light pastel pills -> 15% glass) */
      .aml-dark .bg-emerald-50, .aml-dark .bg-emerald-50\\/60 { background-color: rgba(16,185,129,0.15) !important; }
      .aml-dark .bg-amber-50   { background-color: rgba(245,158,11,0.15) !important; }
      .aml-dark .bg-rose-50, .aml-dark .bg-rose-50\\/60 { background-color: rgba(239,68,68,0.15) !important; }
      .aml-dark .bg-indigo-50  { background-color: rgba(30,111,217,0.15) !important; }
      .aml-dark .bg-sky-50     { background-color: rgba(30,111,217,0.15) !important; }
      .aml-dark .bg-emerald-100 { background-color: rgba(16,185,129,0.22) !important; }
      .aml-dark .bg-rose-100    { background-color: rgba(239,68,68,0.22) !important; }

      .aml-dark .text-emerald-600,
      .aml-dark .text-emerald-700,
      .aml-dark .text-emerald-800 { color: ${C.green} !important; }
      .aml-dark .text-amber-600,
      .aml-dark .text-amber-700,
      .aml-dark .text-amber-800 { color: ${C.amber} !important; }
      .aml-dark .text-rose-600,
      .aml-dark .text-rose-700,
      .aml-dark .text-rose-800 { color: ${C.red} !important; }
      .aml-dark .text-indigo-600,
      .aml-dark .text-indigo-700,
      .aml-dark .text-indigo-900 { color: #7BB0F4 !important; }
      .aml-dark .text-sky-700,
      .aml-dark .text-sky-800 { color: #7BB0F4 !important; }

      .aml-dark .border-emerald-100,
      .aml-dark .border-emerald-200 { border-color: rgba(16,185,129,0.4) !important; }
      .aml-dark .border-amber-100,
      .aml-dark .border-amber-200 { border-color: rgba(245,158,11,0.4) !important; }
      .aml-dark .border-rose-100,
      .aml-dark .border-rose-200 { border-color: rgba(239,68,68,0.45) !important; }
      .aml-dark .border-indigo-100,
      .aml-dark .border-indigo-200 { border-color: rgba(30,111,217,0.4) !important; }
      .aml-dark .border-sky-100,
      .aml-dark .border-sky-200 { border-color: rgba(30,111,217,0.4) !important; }

      /* Hover */
      .aml-dark .hover\\:bg-slate-50:hover,
      .aml-dark .hover\\:bg-slate-50\\/60:hover,
      .aml-dark .hover\\:bg-slate-50\\/70:hover { background-color: rgba(30,111,217,0.08) !important; }
      .aml-dark .hover\\:bg-slate-100:hover { background-color: #1A3050 !important; }
      .aml-dark .hover\\:bg-slate-200:hover { background-color: #1A3050 !important; }
      .aml-dark .hover\\:bg-indigo-50:hover { background-color: rgba(30,111,217,0.18) !important; }
      .aml-dark .hover\\:bg-rose-100:hover { background-color: rgba(239,68,68,0.22) !important; }

      /* Inputs */
      .aml-dark input { color: ${C.text}; }
      .aml-dark input::placeholder { color: ${C.faint}; }

      /* Cards: shadow + radius polish */
      .aml-dark .rounded-2xl { box-shadow: 0 4px 24px rgba(0,0,0,0.4); }

      /* Sticky nav backgrounds inside content (none used here) */
      .aml-dark header.bg-white\\/80 { background-color: rgba(10,22,40,0.85) !important; }
    `}</style>
  );
}
