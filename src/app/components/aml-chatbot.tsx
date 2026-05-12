import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Sparkles, ChevronDown, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { type Decision, type Signals } from "./decision-engine";

type Msg = {
  id: string;
  from: "bot" | "user";
  body: React.ReactNode;
};

type Props = {
  decision: Decision;
  signals: Signals;
  onExplain: () => void;
  onSimulate: () => void;
  onShowKpiBreakdown: () => void;
};

const quickActions = [
  { id: "explain", label: "Explain Decision" },
  { id: "kpi", label: "Show KPI Breakdown" },
  { id: "sim", label: "Simulate Fix" },
  { id: "compare", label: "Compare Models" },
  { id: "trend", label: "View Trend" },
] as const;

type ActionId = (typeof quickActions)[number]["id"];

function formatDefault(decision: Decision, signals: Signals): React.ReactNode {
  const offenders: string[] = [];
  if (signals.recall < 85) offenders.push(`Recall: ${signals.recall.toFixed(1)}% (below target)`);
  if (signals.fpr > 20) offenders.push(`FPR: ${signals.fpr.toFixed(1)}% (above target)`);
  if (signals.flaggedRate > 5) offenders.push(`Flagged Rate: ${signals.flaggedRate.toFixed(1)}% (above target)`);
  if (signals.patternCoverage < 80) offenders.push(`Pattern Coverage: ${signals.patternCoverage.toFixed(1)}% (below target)`);
  if (signals.precision < 30) offenders.push(`Precision: ${signals.precision.toFixed(1)}% (below target)`);
  return (
    <div className="space-y-2">
      <div>Based on current KPIs:</div>
      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
        {offenders.length === 0 ? (
          <li>All KPIs are within target.</li>
        ) : (
          offenders.map((o, i) => <li key={`o-${i}`}>{o}</li>)
        )}
        <li>Drift detected: <b>{signals.drift.toUpperCase()}</b></li>
      </ul>
      <div>
        Recommendation: <b className="text-slate-900">{decision.tag}</b>
      </div>
      <div className="text-slate-600">{decision.plain}</div>
      <div className="pt-1">Would you like to:</div>
      <ol className="list-decimal pl-5 space-y-0.5 text-slate-700">
        <li>View affected KPIs</li>
        <li>Simulate threshold adjustment</li>
        <li>Compare with previous model</li>
      </ol>
    </div>
  );
}

export function AmlChatbot({ decision, signals, onExplain, onSimulate, onShowKpiBreakdown }: Props) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: "init",
      from: "bot",
      body: formatDefault(decision, signals),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastDecisionRef = useRef<string>(decision.tag);

  useEffect(() => {
    if (lastDecisionRef.current !== decision.tag) {
      lastDecisionRef.current = decision.tag;
      setMessages((prev) => [
        ...prev,
        {
          id: `auto-${Date.now()}`,
          from: "bot",
          body: (
            <div>
              KPIs changed — new recommendation: <b>{decision.tag}</b>.
              <div className="text-slate-600 mt-1">{decision.plain}</div>
            </div>
          ),
        },
      ]);
    }
  }, [decision.tag, decision.plain]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const pushBot = (body: React.ReactNode) =>
    setMessages((prev) => [...prev, { id: `b-${Date.now()}`, from: "bot", body }]);
  const pushUser = (text: string) =>
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", body: text }]);

  const handleAction = (id: ActionId) => {
    const action = quickActions.find((a) => a.id === id)!;
    pushUser(action.label);
    if (id === "explain") {
      onExplain();
      pushBot(
        <div>
          Opening the rule trace below. The triggered rule is <b>{decision.rule}</b>.
          <div className="mt-1 text-slate-600">{decision.explanation}</div>
        </div>,
      );
    } else if (id === "kpi") {
      onShowKpiBreakdown();
      pushBot(
        <div>
          Scrolling to the KPI Decision Table — failing KPIs are marked in red, near-threshold in amber.
        </div>,
      );
    } else if (id === "sim") {
      onSimulate();
      pushBot(
        <div>
          Opening the threshold simulator on the Detection Overview. Try raising τ to 0.65 — that usually trades a small Recall hit for a much lower Flagged Rate.
        </div>,
      );
    } else if (id === "compare") {
      pushBot(
        <div>
          Model comparison: current build <b>4.7.2</b> vs previous <b>4.6.9</b>. On the same labelled holdout, 4.6.9 had Recall <b>86.1%</b> and FPR <b>15.4%</b>. A rollback restores Recall above target but spends ~1.3 pts of FPR.
        </div>,
      );
    } else if (id === "trend") {
      pushBot(
        <div>
          Last 7 days: Recall trended <b>down 1.4 pts</b>, Precision <b>down 0.8 pts</b>, Flagged Rate <b>up 1.4 pts</b>. Drift detector flipped to <b>Yes</b> on day 3.
        </div>,
      );
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const t = input.trim();
    pushUser(t);
    setInput("");
    setTimeout(() => {
      pushBot(
        <div>
          I'm a rule-based assistant — I work best with the quick actions below. Try <b>Explain Decision</b> or <b>Simulate Fix</b> for the most useful response to "{t}".
        </div>,
      );
    }, 250);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-colors"
        style={{ fontSize: 13 }}
      >
        <span className="relative">
          <MessageSquare className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
        </span>
        AML Assistant
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-30 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: 560, maxHeight: "calc(100vh - 2.5rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div style={{ fontSize: 13, fontWeight: 600 }}>AML Assistant</div>
            <div className="text-slate-300 inline-flex items-center gap-1" style={{ fontSize: 11 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Rule-based · live
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10"
          aria-label="Minimize chat"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/40">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed ${
                m.from === "user"
                  ? "bg-slate-900 text-white rounded-br-sm"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
              }`}
              style={{ fontSize: 12.5 }}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-1 text-slate-500 mb-1.5" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>
          <Sparkles className="w-3 h-3" /> Quick actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleAction(a.id)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t border-slate-100 bg-white">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask the assistant…"
          className="h-9 bg-slate-50 border-slate-200"
          style={{ fontSize: 12 }}
        />
        <Button onClick={handleSend} className="h-9 w-9 p-0 bg-slate-900 hover:bg-slate-800" aria-label="Send">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
