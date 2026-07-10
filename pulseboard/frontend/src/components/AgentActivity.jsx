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
  { key: "revenue", name: "Revenue Agent", color: "#10B981", Icon: RevenueIcon },
  { key: "behavior", name: "Behavior Agent", color: "#6366F1", Icon: UsersIcon },
  { key: "error", name: "Error Agent", color: "#F59E0B", Icon: WarningIcon },
  { key: "sentiment", name: "Sentiment Agent", color: "#8B5CF6", Icon: ChatIcon },
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
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AGENTS.map((agent, i) => {
          const isComplete = Boolean(result) && i < completed;
          const isAnalyzing = !isComplete && started > i;
          const status = isComplete
            ? "COMPLETE"
            : isAnalyzing
              ? "ANALYZING"
              : "QUEUED";

          const insight = agentResults[agent.key]?.insight;
          const severity = severities[agent.key];
          const sevMeta = severity ? severityMeta(severity) : null;

          const cardStyle = {
            background: "rgba(255,255,255,0.02)",
            borderRadius: 16,
            padding: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          };
          if (isComplete) {
            cardStyle.border = "1px solid rgba(16,185,129,0.2)";
            cardStyle.boxShadow = "0 0 24px rgba(16,185,129,0.08)";
          }

          return (
            <div
              key={agent.key}
              style={cardStyle}
              className={`transition-all duration-300 ${
                isAnalyzing ? "animate-border-pulse" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                    style={{
                      background: isComplete
                        ? "rgba(16,185,129,0.1)"
                        : `${agent.color}1A`,
                      color: isComplete ? "#10B981" : agent.color,
                    }}
                  >
                    {isComplete ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <agent.Icon className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[#F0F0FA]">
                      {agent.name}
                    </div>
                    <div
                      className="text-[10px] font-semibold tracking-[0.15em] uppercase mt-0.5"
                      style={{
                        color: isComplete
                          ? "#10B981"
                          : isAnalyzing
                            ? "#E8173D"
                            : "#374151",
                      }}
                    >
                      {status}
                    </div>
                  </div>
                </div>

                {isComplete && sevMeta && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
                    style={{
                      background: sevMeta.tint,
                      color: sevMeta.color,
                      border: `1px solid ${sevMeta.border}`,
                    }}
                  >
                    {sevMeta.label}
                  </span>
                )}
              </div>

              {isComplete && insight && (
                <p className="mt-4 text-xs text-[#6B7280] leading-relaxed line-clamp-2 animate-fade-in">
                  {insight}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="rounded-xl p-4 mt-4 flex items-center gap-3"
        style={{
          background: "rgba(232,23,61,0.05)",
          border: "1px solid rgba(232,23,61,0.15)",
        }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
          style={{ background: "rgba(232,23,61,0.12)", color: "#E8173D" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <div className="text-sm font-semibold">
            {allComplete ? (
              <span className="gradient-text">Synthesizing insights…</span>
            ) : (
              <span className="text-[#F0F0FA]">Synthesis Agent</span>
            )}
          </div>
          <div className="text-xs text-[#374151]">
            {allComplete
              ? "Connecting the dots across all four agents"
              : "Waiting for specialists to report in"}
          </div>
        </div>
      </div>
    </div>
  );
}
