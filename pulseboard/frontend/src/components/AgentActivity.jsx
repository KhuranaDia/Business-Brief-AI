import { useEffect, useState } from "react";
import { severityMeta } from "../lib.js";

function RevenueIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 1v22" strokeLinecap="round" />
      <path
        d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const AGENTS = [
  { key: "revenue", name: "Revenue Agent", Icon: RevenueIcon },
  { key: "behavior", name: "Behavior Agent", Icon: UsersIcon },
  { key: "error", name: "Error Agent", Icon: WarningIcon },
  { key: "sentiment", name: "Sentiment Agent", Icon: ChatIcon },
];

/**
 * AgentActivity — the loading "wow" moment.
 *
 * @param {boolean} active - pipeline is running (agents start analyzing).
 * @param {object|null} result - the analyze response; when present, agents
 *   complete one by one and reveal their severity + insight.
 */
export default function AgentActivity({ active, result }) {
  const [started, setStarted] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    setStarted(0);
    const id = setInterval(() => {
      setStarted((n) => (n < AGENTS.length ? n + 1 : n));
    }, 550);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!result) {
      setCompleted(0);
      return undefined;
    }
    const id = setInterval(() => {
      setCompleted((n) => (n < AGENTS.length ? n + 1 : n));
    }, 450);
    return () => clearInterval(id);
  }, [result]);

  const agentResults = result?.agent_results || {};
  const severities = result?.agent_severities || {};
  const allComplete = Boolean(result) && completed >= AGENTS.length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AGENTS.map((agent, i) => {
          const isComplete = Boolean(result) && i < completed;
          const isAnalyzing = !isComplete && started > i;
          const status = isComplete
            ? "COMPLETE"
            : isAnalyzing
              ? "ANALYZING…"
              : "IDLE";

          const insight = agentResults[agent.key]?.insight;
          const severity = severities[agent.key];
          const sevMeta = severity ? severityMeta(severity) : null;

          const border = isComplete
            ? "border-status-stable"
            : isAnalyzing
              ? "border-brand-red shadow-[0_0_24px_rgba(232,23,61,0.22)] animate-pulse_slow"
              : "border-bg-border";

          const iconColor = isComplete
            ? "text-status-stable"
            : isAnalyzing
              ? "text-brand-red"
              : "text-text-subtle";

          return (
            <div
              key={agent.key}
              className={`rounded-xl border bg-bg-secondary p-6 transition-all duration-300 ${border}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`transition-colors duration-300 ${iconColor}`}>
                    {isComplete ? (
                      <CheckIcon className="h-8 w-8" />
                    ) : (
                      <agent.Icon className="h-8 w-8" />
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-text-primary">
                      {agent.name}
                    </div>
                    <div
                      className={`text-xs font-medium tracking-wide ${
                        isComplete
                          ? "text-status-stable"
                          : isAnalyzing
                            ? "text-brand-red"
                            : "text-text-muted"
                      }`}
                    >
                      {status}
                    </div>
                  </div>
                </div>

                {isComplete && sevMeta && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${sevMeta.badge}`}
                  >
                    {sevMeta.label}
                  </span>
                )}
              </div>

              {isComplete && insight && (
                <p className="mt-4 text-xs text-text-muted leading-relaxed line-clamp-2 animate-fade_in">
                  {insight}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center h-6">
        {allComplete ? (
          <p className="text-sm text-brand-red font-medium animate-fade_in">
            Synthesis agent activating — writing your brief…
          </p>
        ) : result ? (
          <p className="text-sm text-text-muted">Agents reporting in…</p>
        ) : (
          <p className="text-sm text-text-muted">
            Four specialists analyzing in parallel…
          </p>
        )}
      </div>
    </div>
  );
}
