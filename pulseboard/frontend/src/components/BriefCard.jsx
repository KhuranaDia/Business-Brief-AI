import { useState } from "react";
import { healthMeta, formatTimestamp } from "../lib.js";

function LightningIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
    </svg>
  );
}

// Render brief text: markdown-bold or ALL-CAPS section headers become brand-red
// section labels, bullet lines become red-dot lists, everything else is body.
function renderBrief(text) {
  if (!text) return null;
  const lines = text.split("\n");

  return lines.map((raw, i) => {
    const line = raw.trim();
    if (!line) return <div key={i} className="h-2" />;

    const boldHeader = line.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
    const capsHeader = line.match(/^([A-Z][A-Z \/&]{2,}):\s*(.*)$/);
    const header = boldHeader || capsHeader;

    if (header) {
      return (
        <div key={i} className="mt-6 first:mt-0">
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#E8173D] uppercase mb-2">
            {header[1]}
          </div>
          {header[2] ? (
            <p className="text-sm text-[#9CA3AF] leading-[1.8]">{header[2]}</p>
          ) : null}
        </div>
      );
    }

    if (/^[-*•]\s+/.test(line)) {
      return (
        <div key={i} className="flex gap-3 mt-2">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#E8173D] shrink-0" />
          <span className="text-sm text-[#D1D5DB] leading-[1.7]">
            {line.replace(/^[-*•]\s+/, "")}
          </span>
        </div>
      );
    }

    return (
      <p key={i} className="text-sm text-[#9CA3AF] leading-[1.8] mt-2">
        {line}
      </p>
    );
  });
}

export default function BriefCard({ brief }) {
  const [copied, setCopied] = useState(false);
  if (!brief) return null;

  const meta = healthMeta(brief.overall_health);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief.final_brief || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  return (
    <div
      className="overflow-hidden animate-fade-in"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top status banner */}
      <div
        className="flex items-center justify-center gap-2.5 p-3"
        style={{
          background: meta.tint,
          borderBottom: `1px solid ${meta.border}`,
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}` }}
        />
        <span
          className="text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-xs text-[#6B7280]">· {meta.phrase}</span>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-sm font-semibold text-white">
            {brief.data_source_name}
          </span>
          <span className="text-xs text-[#374151]">
            {formatTimestamp(brief.created_at)}
          </span>
        </div>

        <div className="mt-4 max-w-2xl">{renderBrief(brief.final_brief)}</div>

        <div
          className="flex items-center justify-between flex-wrap gap-3 pt-4 mt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-1.5 text-xs text-[#374151]">
            <LightningIcon className="h-3.5 w-3.5 text-[#E8173D]" />
            {brief.processing_time_seconds != null
              ? `Generated in ${brief.processing_time_seconds}s`
              : "Generated"}
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-[#9CA3AF] transition-all duration-200 hover:text-white"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy Brief"}
          </button>
        </div>
      </div>
    </div>
  );
}
