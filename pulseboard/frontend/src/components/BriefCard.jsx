import { useState } from "react";
import {
  ClipboardIcon,
  CheckIcon,
  ClockIcon,
  CircleStackIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { healthMeta, formatTimestamp } from "../status.js";

// Renders the brief text: lines that look like "HEADER:" become bold headings,
// "- " / "* " lines become bullets, everything else is a paragraph.
function renderBrief(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((raw, i) => {
    const line = raw.trim();
    if (!line) return <div key={i} className="h-2" />;

    const headerMatch = line.match(/^([A-Z][A-Z \/&]{2,}):\s*(.*)$/);
    if (headerMatch) {
      return (
        <p key={i} className="mt-4 first:mt-0">
          <span className="text-brand font-bold tracking-wide">
            {headerMatch[1]}
          </span>
          {headerMatch[2] ? (
            <span className="text-gray-200">: {headerMatch[2]}</span>
          ) : null}
        </p>
      );
    }

    if (/^[-*•]\s+/.test(line)) {
      return (
        <div key={i} className="flex gap-2 pl-1 mt-1">
          <span className="text-brand mt-1">•</span>
          <span className="text-gray-300">{line.replace(/^[-*•]\s+/, "")}</span>
        </div>
      );
    }

    return (
      <p key={i} className="text-gray-300 mt-1">
        {line}
      </p>
    );
  });
}

function MetaItem({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </div>
  );
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
      // Clipboard may be unavailable; silently ignore.
    }
  };

  return (
    <div className="rounded-2xl border border-card-border bg-card-bg overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-card-border">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${meta.badge}`}
          >
            {meta.label}
          </span>
          <h2 className="text-lg font-semibold text-white truncate">
            {brief.data_source_name}
          </h2>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-card-border text-gray-300 hover:text-white hover:border-brand transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-green-400" /> Copied
            </>
          ) : (
            <>
              <ClipboardIcon className="h-4 w-4" /> Copy Brief
            </>
          )}
        </button>
      </div>

      <div className="px-6 py-5 leading-relaxed text-sm">
        {renderBrief(brief.final_brief)}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 border-t border-card-border bg-black/20">
        {brief.processing_time_seconds != null && (
          <MetaItem icon={ClockIcon}>
            {brief.processing_time_seconds}s processing
          </MetaItem>
        )}
        <MetaItem icon={CircleStackIcon}>{brief.data_source_name}</MetaItem>
        <MetaItem icon={CalendarIcon}>
          {formatTimestamp(brief.created_at)}
        </MetaItem>
      </div>
    </div>
  );
}
