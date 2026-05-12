import { useEffect, useState } from "react";
import { C, FONT } from "./aml-shell";

export type Lang = "bi" | "en" | "th";

const STORAGE_KEY = "aml_lang_mode";

function readInitial(): Lang {
  if (typeof window === "undefined") return "bi";
  const saved = window.localStorage?.getItem(STORAGE_KEY) as Lang | null;
  return saved === "en" || saved === "th" || saved === "bi" ? saved : "bi";
}

let CURRENT: Lang = readInitial();
type Listener = (l: Lang) => void;
const listeners = new Set<Listener>();

function applyClass(l: Lang) {
  if (typeof document === "undefined") return;
  const targets = [document.body, document.documentElement];
  for (const el of targets) {
    if (!el) continue;
    el.classList.remove("lang-bi", "lang-en", "lang-th");
    el.classList.add(`lang-${l}`);
  }
}

if (typeof document !== "undefined") {
  applyClass(CURRENT);
}

export function getLang() {
  return CURRENT;
}
export function setLang(l: Lang) {
  CURRENT = l;
  applyClass(l);
  try {
    window.localStorage?.setItem(STORAGE_KEY, l);
  } catch {}
  listeners.forEach((fn) => fn(l));
}
export function useLang() {
  const [l, set] = useState<Lang>(CURRENT);
  useEffect(() => {
    applyClass(CURRENT);
    const fn: Listener = (next) => set(next);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return l;
}

/** Inline bilingual helper. Renders two spans (.lang-en / .lang-th) and a separator. */
export function L({
  en,
  th,
  sep = " / ",
}: {
  en: string;
  th: string;
  sep?: string;
}) {
  return (
    <>
      <span className="lang-en">{en}</span>
      <span className="lang-bi-sep">{sep}</span>
      <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
        {th}
      </span>
    </>
  );
}

/** Wrap an English-only label so it can be hidden in TH mode. */
export function En({ children }: { children: React.ReactNode }) {
  return <span className="lang-en">{children}</span>;
}

/** Wrap a Thai-only label so it can be hidden in EN mode. */
export function Th({ children }: { children: React.ReactNode }) {
  return (
    <span className="lang-th" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
      {children}
    </span>
  );
}

export function LangToggle() {
  const lang = useLang();
  const seg = (id: Lang, label: string) => {
    const active = lang === id;
    return (
      <button
        key={id}
        type="button"
        data-lang={id}
        onClick={() => setLang(id)}
        aria-pressed={active}
        style={{
          flex: 1,
          height: "100%",
          minWidth: 28,
          border: "none",
          padding: "0 8px",
          background: active ? `linear-gradient(135deg, ${C.blue}, #4A8DEE)` : "transparent",
          color: active ? "white" : C.subtext,
          fontWeight: active ? 700 : 600,
          fontSize: 10,
          letterSpacing: 0.5,
          borderRadius: 999,
          cursor: "pointer",
          fontFamily: FONT,
          transition: "all 0.15s",
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      className="lang-toggle"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 32,
        padding: 2,
        gap: 2,
        borderRadius: 999,
        border: `1px solid ${C.border}`,
        background: C.card,
        minWidth: 120,
      }}
    >
      {seg("bi", "BI")}
      {seg("th", "TH")}
      {seg("en", "EN")}
    </div>
  );
}

/** Global CSS that swaps language visibility based on body/html class. */
export function LangSkin() {
  return (
    <style>{`
      /* BI default: show both */
      .lang-bi .lang-en,
      .lang-bi .lang-th,
      .lang-bi .lang-bi-sep { display: inline; }

      /* EN mode: hide TH spans + bilingual separators + any inline-Noto-Thai spans */
      .lang-en .lang-th,
      .lang-en .lang-bi-sep,
      .lang-en [style*="Noto Sans Thai"]:not(.lang-en) { display: none !important; }

      /* TH mode: hide EN spans + bilingual separators */
      .lang-th .lang-en,
      .lang-th .lang-bi-sep { display: none !important; }
      /* Make sure TH spans still render */
      .lang-th .lang-th,
      .lang-th [style*="Noto Sans Thai"] { display: inline !important; }
    `}</style>
  );
}
