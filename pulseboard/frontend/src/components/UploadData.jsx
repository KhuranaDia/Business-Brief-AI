import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { analyzeData, uploadCsv } from "../api.js";
import AgentActivity from "./AgentActivity.jsx";

const SAMPLE_JSON = `{
  "revenue": { "mrr": 128000, "mrr_last_month": 141000, "refunds": 4200 },
  "behavior": { "dau": 5400, "mau": 22000, "churn_rate": 0.061 },
  "errors": { "error_rate": 0.021, "p95_latency_ms": 830, "uptime": 0.991 },
  "sentiment": { "nps": 24, "support_tickets": 312, "avg_rating": 3.9 }
}`;

function LoadingDots() {
  return (
    <span className="inline-flex gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/80 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default function UploadData() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("json"); // "json" | "csv"
  const [businessName, setBusinessName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    !submitting &&
    (mode === "json" ? jsonText.trim().length > 0 : Boolean(file));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "json") {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setError("The JSON data is not valid. Please check the syntax.");
        return;
      }
      setSubmitting(true);
      try {
        await analyzeData(parsed, businessName.trim() || "Untitled data source");
        navigate("/");
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Analysis failed. Is the backend running and the API key set?"
        );
        setSubmitting(false);
      }
    } else {
      if (!file) {
        setError("Please choose a CSV file to upload.");
        return;
      }
      setSubmitting(true);
      try {
        await uploadCsv(file);
        navigate("/");
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Analysis failed. Is the backend running and the API key set?"
        );
        setSubmitting(false);
      }
    }
  };

  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-card-border bg-card-bg px-6 py-10 text-center">
          <h2 className="text-xl font-semibold text-white">
            Agents are analyzing your data
            <LoadingDots />
          </h2>
          <p className="text-gray-400 mt-2">
            Four specialists are working in parallel, then synthesizing your
            brief.
          </p>
          <div className="mt-8">
            <AgentActivity status="running" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Generate a Brief</h1>
      <p className="text-sm text-gray-400 mt-1 mb-6">
        Upload a CSV or paste JSON. PulseBoard's agents will analyze it and write
        a plain-English morning brief.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-card-border bg-card-bg p-6 space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Acme Inc — Weekly Metrics"
            className="w-full rounded-lg bg-dark-bg border border-card-border px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex gap-2 p-1 rounded-lg bg-dark-bg border border-card-border w-fit">
          <button
            type="button"
            onClick={() => setMode("json")}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
              mode === "json"
                ? "bg-brand text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CodeBracketIcon className="h-4 w-4" /> Paste JSON
          </button>
          <button
            type="button"
            onClick={() => setMode("csv")}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
              mode === "csv"
                ? "bg-brand text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <DocumentTextIcon className="h-4 w-4" /> Upload CSV
          </button>
        </div>

        {mode === "json" ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-300">
                JSON Data
              </label>
              <button
                type="button"
                onClick={() => setJsonText(SAMPLE_JSON)}
                className="text-xs text-brand hover:text-brand-dark"
              >
                Use sample data
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              placeholder='{ "revenue": { ... }, "behavior": { ... } }'
              className="w-full font-mono text-xs rounded-lg bg-dark-bg border border-card-border px-3 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand resize-y"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              CSV File
            </label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-card-border bg-dark-bg px-6 py-10 cursor-pointer hover:border-brand transition-colors">
              <ArrowUpTrayIcon className="h-8 w-8 text-gray-500" />
              <span className="text-sm text-gray-300">
                {file ? file.name : "Click to choose a .csv file"}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors"
        >
          Generate Brief
        </button>
      </form>
    </div>
  );
}
