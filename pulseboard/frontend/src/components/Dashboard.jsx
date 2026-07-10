import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";
import { fetchBriefs } from "../api.js";
import { healthMeta, formatTimestamp } from "../status.js";
import BriefCard from "./BriefCard.jsx";

const REFRESH_MS = 30000;

function primaryStory(text) {
  if (!text) return "";
  const lines = text.split("\n").map((l) => l.trim());
  // Prefer the executive summary line if present.
  const summaryIdx = lines.findIndex((l) =>
    /^EXECUTIVE SUMMARY:/i.test(l)
  );
  if (summaryIdx !== -1) {
    const inline = lines[summaryIdx].replace(/^EXECUTIVE SUMMARY:\s*/i, "");
    if (inline) return inline;
    return lines.slice(summaryIdx + 1).find((l) => l) || "";
  }
  return lines.find((l) => l && !/^[A-Z][A-Z \/&]{2,}:/.test(l)) || "";
}

function BriefRow({ brief, expanded, onToggle }) {
  const meta = healthMeta(brief.overall_health);
  return (
    <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${meta.badge}`}
            >
              {meta.label}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {brief.data_source_name}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-400 line-clamp-2">
            {primaryStory(brief.final_brief) || "No summary available."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatTimestamp(brief.created_at)}
          </span>
          {expanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <BriefCard brief={brief} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    try {
      const { data } = await fetchBriefs();
      setBriefs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not load briefs. Is the backend running?"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Morning Briefs</h1>
          <p className="text-sm text-gray-400 mt-1">
            Your latest AI-generated business briefings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-card-border text-gray-300 hover:text-white hover:border-brand transition-colors"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md bg-brand hover:bg-brand-dark text-white transition-colors"
          >
            <DocumentPlusIcon className="h-4 w-4" />
            New Brief
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-card-border bg-card-bg animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 px-5 py-4 text-sm">
          {error}
        </div>
      ) : briefs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border bg-card-bg/50 px-6 py-16 text-center">
          <p className="text-gray-300 text-lg font-medium">No briefs yet.</p>
          <p className="text-gray-500 mt-1">
            Upload your data to get started.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium px-4 py-2 rounded-md bg-brand hover:bg-brand-dark text-white transition-colors"
          >
            <DocumentPlusIcon className="h-4 w-4" />
            Generate your first brief
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
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
      )}
    </div>
  );
}
