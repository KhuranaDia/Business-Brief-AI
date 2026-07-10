import { severityMeta } from "../status.js";

const AGENTS = [
  { key: "revenue", name: "Revenue", icon: "💰" },
  { key: "behavior", name: "Behavior", icon: "👥" },
  { key: "error", name: "Error", icon: "⚠️" },
  { key: "sentiment", name: "Sentiment", icon: "💬" },
];

function StatusLabel({ status }) {
  const map = {
    idle: { text: "Idle", cls: "text-gray-500" },
    running: { text: "Running…", cls: "text-brand" },
    complete: { text: "Complete", cls: "text-green-400" },
  };
  const meta = map[status] || map.idle;
  return <span className={`text-xs font-medium ${meta.cls}`}>{meta.text}</span>;
}

/**
 * AgentActivity
 * @param {"idle"|"running"|"complete"} status - global pipeline status
 * @param {Object<string,string>} severities - per-agent severity map
 */
export default function AgentActivity({ status = "idle", severities = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {AGENTS.map((agent) => {
        const severity = severities[agent.key];
        const isRunning = status === "running";
        const isComplete = status === "complete";
        const cardStatus = isRunning
          ? "running"
          : isComplete
            ? "complete"
            : "idle";

        return (
          <div
            key={agent.key}
            className={`rounded-xl border bg-card-bg p-4 transition-all ${
              isRunning
                ? "border-brand animate-pulse-border shadow-lg shadow-brand/10"
                : "border-card-border"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{agent.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {agent.name} Agent
                  </div>
                  <StatusLabel status={cardStatus} />
                </div>
              </div>

              {isComplete && severity ? (
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                    severityMeta(severity).badge
                  }`}
                >
                  {severityMeta(severity).label}
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-gray-600 mt-2" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
