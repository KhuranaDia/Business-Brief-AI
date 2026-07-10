import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBriefs } from "../hooks/useApi.js";
import { healthMeta, formatTimestamp, primaryStory } from "../lib.js";
import BriefCard from "../components/BriefCard.jsx";

function StatCard({ label, children }) {
  return (
    <div className="px-5 py-4">
      <div className="text-xs uppercase tracking-widest text-text-muted">
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold text-text-primary">
        {children}
      </div>
    </div>
  );
}

function BriefRow({ brief, expanded, onToggle }) {
  const meta = healthMeta(brief.overall_health);
  return (
    <div
      className={`rounded-xl border bg-bg-secondary transition-all duration-200 ${
        expanded ? "border-brand-red" : "border-bg-border hover:border-brand-red"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-6 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-4">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta.badge}`}
          >
            {meta.label}
          </span>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {formatTimestamp(brief.created_at)}
          </span>
        </div>

        <p className="text-lg font-medium text-text-primary line-clamp-2">
          {primaryStory(brief.final_brief) || "No summary available."}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">
            {brief.data_source_name}
          </span>
          <span className="text-sm font-medium text-brand-red">
            {expanded ? "Hide Brief" : "View Full Brief →"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 animate-slide_up">
          <BriefCard brief={brief} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { briefs, loading, error } = useBriefs();
  const [expandedId, setExpandedId] = useState(null);

  const stats = useMemo(() => {
    if (!briefs.length) return null;
    const avg =
      briefs.reduce((sum, b) => sum + (b.processing_time_seconds || 0), 0) /
      briefs.length;
    return {
      total: briefs.length,
      last: briefs[0].created_at,
      avg: avg.toFixed(1),
      status: healthMeta(briefs[0].overall_health),
    };
  }, [briefs]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {loading ? (
        <div className="space-y-4">
          <div className="h-20 rounded-xl border border-bg-border bg-bg-secondary animate-pulse" />
          <div className="h-28 rounded-xl border border-bg-border bg-bg-secondary animate-pulse" />
          <div className="h-28 rounded-xl border border-bg-border bg-bg-secondary animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-status-critical/40 bg-status-critical/10 text-status-critical px-5 py-4 text-sm">
          {error}
        </div>
      ) : briefs.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-text-muted">No briefs yet.</p>
          <p className="mt-3 text-text-muted max-w-md">
            Upload your business data to generate your first morning brief.
          </p>
          <Link
            to="/upload"
            className="mt-8 inline-flex items-center gap-2 bg-brand-red hover:bg-brand-redHover text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            Upload Data →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-bg-border rounded-xl divide-x divide-bg-border bg-bg-secondary overflow-hidden mb-8">
            <StatCard label="Briefs Generated">{stats.total}</StatCard>
            <StatCard label="Last Brief">
              {formatTimestamp(stats.last)}
            </StatCard>
            <StatCard label="Avg Processing">{stats.avg}s</StatCard>
            <StatCard label="Last Status">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${stats.status.badge}`}
              >
                {stats.status.label}
              </span>
            </StatCard>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-text-primary">
              Morning Briefs
            </h1>
            <Link
              to="/upload"
              className="text-sm font-medium px-4 py-2 rounded-lg border border-brand-red text-brand-red hover:bg-brand-red hover:text-white transition-all duration-200"
            >
              New Brief
            </Link>
          </div>

          <div className="space-y-4">
            {briefs.map((brief) => (
              <BriefRow
                key={brief.id}
                brief={brief}
                expanded={expandedId === brief.id}
                onToggle={() =>
                  setExpandedId(expandedId === brief.id ? null : brief.id)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
