import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBriefs } from "../hooks/useApi.js";
import { healthMeta, formatTimestamp, primaryStory } from "../lib.js";
import BriefCard from "../components/BriefCard.jsx";
import TiltCard from "../components/TiltCard.jsx";

const CARD_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 24,
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
};

function DocIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ActivityIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M2 12h4l2.5-7 4 14 2.5-7H22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotGrid() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        pointerEvents: "none",
      }}
    />
  );
}

function StatCard({ label, value, sub, Icon, color }) {
  return (
    <TiltCard style={CARD_STYLE} className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.15em] text-[#4B5563] uppercase">
            {label}
          </div>
          <div className="text-3xl font-bold text-white mt-2 mb-1 tabular-nums">
            {value}
          </div>
          <div className="text-xs text-[#374151]">{sub}</div>
        </div>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: `${color}1A`, color, boxShadow: `0 0 24px ${color}22` }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </TiltCard>
  );
}

function BriefRow({ brief, expanded, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const meta = healthMeta(brief.overall_health);

  return (
    <TiltCard
      intensity={4}
      disabled={expanded}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeaveCapture={() => setHovered(false)}
      className="group relative overflow-hidden cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8173D]"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: hovered ? meta.glow : "none",
        transition: "box-shadow 250ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: meta.accent }}
      />
      {/* Top shine */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-white">
          {brief.data_source_name}
        </span>
        <span className="text-xs text-[#374151] whitespace-nowrap">
          {formatTimestamp(brief.created_at)}
        </span>
      </div>

      <p className="mt-2 text-sm text-[#6B7280] line-clamp-1">
        {primaryStory(brief.final_brief) || "No summary available."}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{
            background: meta.tint,
            color: meta.color,
            border: `1px solid ${meta.border}`,
          }}
        >
          {meta.label}
        </span>
        <span
          className={`text-xs text-[#E8173D] transition-opacity duration-200 ${
            expanded || hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {expanded ? "Hide brief" : "View brief →"}
        </span>
      </div>

      {expanded && (
        <div
          className="mt-5 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <BriefCard brief={brief} />
        </div>
      )}
    </TiltCard>
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
      health: healthMeta(briefs[0].overall_health),
    };
  }, [briefs]);

  return (
    <>
      <DotGrid />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                />
              ))}
            </div>
            <div
              className="h-24 rounded-2xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.02)" }}
            />
          </div>
        ) : error ? (
          <div
            className="rounded-xl px-5 py-4 text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#EF4444",
            }}
          >
            {error}
          </div>
        ) : briefs.length === 0 ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
              style={{ background: "rgba(232,23,61,0.1)", color: "#E8173D" }}
            >
              <ActivityIcon className="h-7 w-7" />
            </span>
            <p className="text-2xl font-bold text-white">No intelligence yet</p>
            <p className="mt-3 text-[#6B7280] max-w-md">
              Feed PulseBoard your business data and it will generate a
              plain-English morning brief in seconds.
            </p>
            <Link
              to="/upload"
              className="btn-primary mt-8 px-6 py-3 rounded-xl text-sm font-semibold tracking-wide"
            >
              + New Analysis
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Analyses"
                value={stats.total}
                sub="briefs generated"
                Icon={DocIcon}
                color="#6366F1"
              />
              <StatCard
                label="Last Brief"
                value={formatTimestamp(stats.last)}
                sub="most recent run"
                Icon={ClockIcon}
                color="#8B5CF6"
              />
              <StatCard
                label="Avg Speed"
                value={`${stats.avg}s`}
                sub="processing time"
                Icon={BoltIcon}
                color="#F59E0B"
              />
              <StatCard
                label="Current Status"
                value={stats.health.label}
                sub={stats.health.phrase}
                Icon={ActivityIcon}
                color={stats.health.color}
              />
            </div>

            <div className="flex items-center gap-3 mt-10 mb-4">
              <span className="text-[11px] font-semibold tracking-[0.15em] text-[#4B5563] uppercase">
                Recent Intelligence
              </span>
              <div className="flex-1 h-px bg-white/5" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[10px] text-[#374151]">live</span>
              </div>
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
    </>
  );
}
