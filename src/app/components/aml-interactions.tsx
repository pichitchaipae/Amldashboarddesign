import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X as XIcon, RefreshCcw, AlertOctagon } from "lucide-react";
import { C, FONT } from "./aml-shell";

export type ToastTone = "green" | "amber" | "red" | "blue";
export type Toast = { id: number; tone: ToastTone; title: string; sub?: string };

let TOAST_SEQ = 1;
type Listener = (t: Toast[]) => void;
const listeners = new Set<Listener>();
let current: Toast[] = [];

function setToasts(next: Toast[]) {
  current = next;
  listeners.forEach((l) => l(current));
}

export function pushToast(t: Omit<Toast, "id">, ttl = 3000) {
  const id = TOAST_SEQ++;
  setToasts([...current, { ...t, id }]);
  setTimeout(() => setToasts(current.filter((x) => x.id !== id)), ttl);
  return id;
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>(current);
  useEffect(() => {
    const l: Listener = (t) => setItems([...t]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: 88,
        right: 24,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: FONT,
      }}
    >
      {items.map((t) => {
        const color =
          t.tone === "green" ? C.green : t.tone === "amber" ? C.amber : t.tone === "red" ? C.red : C.blue;
        const Icon = t.tone === "green" ? CheckCircle2 : t.tone === "red" ? AlertOctagon : t.tone === "amber" ? AlertTriangle : RefreshCcw;
        return (
          <div
            key={t.id}
            style={{
              width: 320,
              background: C.card,
              border: `1px solid ${color}66`,
              borderRadius: 12,
              padding: 14,
              boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 18px ${color}33`,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              animation: "amlToastIn 0.25s ease-out",
            }}
          >
            <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, lineHeight: 1.45 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.title}</div>
              {t.sub && <div style={{ fontSize: 12, color: C.subtext, marginTop: 2 }}>{t.sub}</div>}
            </div>
          </div>
        );
      })}
      <style>{`@keyframes amlToastIn { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
    </div>
  );
}

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  tone = "blue",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  tone?: "blue" | "amber" | "red";
}) {
  if (!open) return null;
  const accent = tone === "red" ? C.red : tone === "amber" ? C.amber : C.blue;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: FONT,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: C.card,
          border: `1px solid ${tone === "red" ? C.red : C.border}`,
          borderRadius: 16,
          boxShadow: tone === "red"
            ? `0 0 0 1px ${C.red}, 0 0 32px rgba(239,68,68,0.35), 0 20px 60px rgba(0,0,0,0.6)`
            : `0 20px 60px rgba(0,0,0,0.6)`,
          color: C.text,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: accent, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700 }}>
              {tone === "red" ? "Critical" : tone === "amber" ? "Confirm" : "Action"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: C.subtext, marginTop: 4, lineHeight: 1.55 }}>{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: C.subtext, cursor: "pointer", padding: 4 }}
          >
            <XIcon size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 8, background: "rgba(10,22,40,0.4)" }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

export function ModalButton({
  variant = "secondary",
  onClick,
  disabled,
  children,
}: {
  variant?: "primary" | "secondary" | "danger";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const styles =
    variant === "primary"
      ? { background: `linear-gradient(135deg, ${C.blue}, #4A8DEE)`, color: "white", border: "none" }
      : variant === "danger"
        ? { background: C.red, color: "white", border: "none" }
        : { background: "transparent", color: C.subtext, border: `1px solid ${C.border}` };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles,
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: FONT,
      }}
    >
      {children}
    </button>
  );
}
