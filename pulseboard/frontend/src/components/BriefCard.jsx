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
// headings, bullet lines become red-dot lists, everything else is body text.
function renderBrief(text) {
  if (!text) return null;
  const lines = text.split("\n");

  return lines.map((raw, i) => {
    const line = raw.trim();
    if (!line) return <div key={i} className="h-3" />;

    const boldHeader = line.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
    if (boldHeader) {
      return (
        <p key={i} className="mt-5 first:mt-0">
          <span className="text-brand-red font-bold tracking-wide uppercase text-sm">
            {boldHeader[1]}
          </span>
          {boldHeader[2] ? (
            <span className="text-text-primary">: {boldHeader[2]}</span>
          ) : null}
        </p>
      );
    }

    const capsHeader = line.match(/^([A-Z][A-Z \/&]{2,}):\s*(.*)$/);
    if (capsHeader) {
      return (
        <p key={i} className="mt-5 first:mt-0">
          <span className="text-brand-red font-bold tracking-wide text-sm">
            {capsHeader[1]}
          </span>
          {capsHeader[2] ? (
            <span className="text-text-primary">: {capsHeader[2]}</span>
          ) : null}
        </p>
      );
    }

    if (/^[-*•]\s+/.test(line)) {
      return (
        <div key={i} className="flex gap-3 pl-1 mt-1.5">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-red shrink-0" />
          <span className="text-text-primary/90">
            {line.replace(/^[-*•]\s+/, "")}
          </span>
        </div>
      );
    }

    return (
      <p key={i} className="text-text-primary/90 mt-1.5 leading-relaxed">
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
    <div className="rounded-2xl border border-bg-border bg-bg-secondary p-8 animate-fade_in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <span
          className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${meta.badge}`}
        >
          {meta.label}
        </span>
        <div className="text-right text-xs text-text-muted">
          <div>{formatTimestamp(brief.created_at)}</div>
          <div className="text-text-subtle">{brief.data_source_name}</div>
        </div>
      </div>

      <div className="mt-6 max-w-2xl text-base">
        {renderBrief(brief.final_brief)}
      </div>

      <div className="mt-8 pt-5 border-t border-bg-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <LightningIcon className="h-4 w-4 text-brand-red" />
          {brief.processing_time_seconds != null
            ? `Generated in ${brief.processing_time_seconds}s`
            : "Generated"}
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-bg-border text-text-primary hover:border-brand-red transition-all duration-200"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy Brief"}
        </button>
      </div>
    </div>
  );
}
