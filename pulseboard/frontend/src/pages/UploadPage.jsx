import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGenerateBrief, useUploadCSV } from "../hooks/useApi.js";
import AgentActivity from "../components/AgentActivity.jsx";

const SAMPLE_DATA = {
  revenue: {
    mrr: 118000,
    mrr_last_month: 141000,
    new_bookings: 12400,
    refunds: 8600,
    arpu: 42,
  },
  behavior: {
    dau: 4900,
    dau_last_week: 6200,
    mau: 21000,
    churn_rate: 0.078,
    checkout_funnel_dropoff: 0.41,
  },
  errors: {
    error_rate: 0.031,
    p95_latency_ms: 940,
    uptime: 0.987,
    checkout_api_failures: 217,
  },
  sentiment: {
    nps: 18,
    support_tickets: 480,
    top_complaint: "payment page errors",
    avg_rating: 3.6,
  },
};

function UploadArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
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

function Spinner(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="animate-spin" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const gen = useGenerateBrief();
  const csv = useUploadCSV();
  const fileInput = useRef(null);

  const [mode, setMode] = useState("csv"); // "csv" | "json"
  const [businessName, setBusinessName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [phase, setPhase] = useState("form"); // "form" | "analyzing" | "done"
  const [analysis, setAnalysis] = useState(null);
  const [localError, setLocalError] = useState("");

  const error = localError || gen.error || csv.error;

  const fillSample = () => {
    setMode("json");
    setJsonText(JSON.stringify(SAMPLE_DATA, null, 2));
    if (!businessName) setBusinessName("Acme SaaS");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const finishThenNavigate = (res) => {
    setAnalysis(res);
    setPhase("done");
    // Let the agent-complete animation play out before showing the dashboard.
    setTimeout(() => navigate("/"), 2600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (mode === "json") {
      if (!jsonText.trim()) {
        setLocalError("Please paste some JSON data first.");
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setLocalError("That JSON isn't valid. Please check the syntax.");
        return;
      }
      setPhase("analyzing");
      try {
        const res = await gen.generate(
          parsed,
          businessName.trim() || "Untitled data source"
        );
        finishThenNavigate(res);
      } catch {
        setPhase("form");
      }
    } else {
      if (!file) {
        setLocalError("Please choose a CSV file to upload.");
        return;
      }
      setPhase("analyzing");
      try {
        const res = await csv.upload(file, businessName.trim());
        finishThenNavigate(res);
      } catch {
        setPhase("form");
      }
    }
  };

  if (phase !== "form") {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-[10vh] pb-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            Analyzing {businessName.trim() || "your data"}
          </h1>
          <p className="mt-2 text-text-muted">
            PulseBoard's agents are on it. This takes a few seconds.
          </p>
        </div>
        <AgentActivity active={phase === "analyzing" || phase === "done"} result={analysis} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-[10vh] pb-16">
      <p className="text-xs uppercase tracking-widest text-text-muted">
        Step 1 of 1
      </p>
      <h1 className="mt-2 text-4xl font-bold text-text-primary">
        Connect your data.
      </h1>
      <p className="mt-3 text-text-muted">
        Drop in your business metrics. PulseBoard handles the rest.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-bg-border bg-bg-secondary p-8 space-y-6"
      >
        <div>
          <label className="block text-sm text-text-muted mb-1.5">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Acme SaaS"
            className="w-full rounded-lg bg-bg-primary border border-bg-border text-text-primary placeholder-text-subtle p-3 focus:outline-none focus:border-brand-red transition-colors duration-200"
          />
        </div>

        <div className="inline-flex gap-2 p-1 rounded-lg bg-bg-primary border border-bg-border">
          {[
            { id: "csv", label: "Upload CSV" },
            { id: "json", label: "Paste JSON" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`text-sm px-4 py-1.5 rounded-md transition-all duration-200 ${
                mode === opt.id
                  ? "bg-brand-red text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {mode === "csv" ? (
          <div>
            <input
              ref={fileInput}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`cursor-pointer rounded-xl border border-dashed p-12 text-center transition-all duration-200 ${
                dragging
                  ? "border-brand-red bg-brand-red/5"
                  : "border-bg-border hover:border-brand-red hover:bg-brand-red/5"
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="flex items-center gap-2 text-status-stable">
                    <CheckIcon className="h-6 w-6" />
                    <span className="font-medium">{file.name}</span>
                  </span>
                  <span className="text-xs text-text-muted">
                    Click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadArrowIcon className="h-10 w-10 text-text-muted" />
                  <span className="font-bold text-text-primary">
                    Drop your CSV here
                  </span>
                  <span className="text-sm text-text-muted">
                    or click to browse
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder={'{\n  "revenue": { "mrr": 120000 },\n  "behavior": { "dau": 5000 }\n}'}
              className="w-full font-mono text-sm rounded-lg bg-bg-primary border border-bg-border text-text-primary placeholder-text-subtle p-4 focus:outline-none focus:border-brand-red transition-colors duration-200 resize-y"
            />
          </div>
        )}

        <button
          type="button"
          onClick={fillSample}
          className="text-sm text-brand-red hover:underline"
        >
          Try with sample data →
        </button>

        {error && (
          <div className="rounded-lg border border-status-critical/40 bg-status-critical/10 text-status-critical px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-redHover text-white font-bold text-lg rounded-lg p-4 transition-all duration-200 hover:scale-[1.01]"
        >
          Generate Morning Brief
        </button>
      </form>
    </div>
  );
}
