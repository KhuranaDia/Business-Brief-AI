import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGenerateBrief, useUploadCSV } from "../hooks/useApi.js";
import AgentActivity from "../components/AgentActivity.jsx";
import TiltCard from "../components/TiltCard.jsx";

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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

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
      <div className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Analyzing {businessName.trim() || "your data"}
          </h1>
          <p className="mt-2 text-[#4B5563]">
            Four specialists are on it — this takes a few seconds.
          </p>
        </div>
        <AgentActivity
          active={phase === "analyzing" || phase === "done"}
          result={analysis}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 pt-24 pb-16">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">{greeting()}</h1>
        <p className="text-lg text-[#4B5563] mt-2">
          What happened in your business?
        </p>
      </div>

      <TiltCard
        intensity={3}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 40,
          boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.15em] text-[#4B5563] uppercase mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Acme SaaS"
              className="glass-input w-full rounded-[10px] p-3 text-sm"
            />
          </div>

          <div>
            <div
              className="inline-flex gap-1 p-1 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {[
                { id: "csv", label: "Upload CSV" },
                { id: "json", label: "Paste JSON" },
              ].map((opt) => {
                const activeMode = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    className="text-xs font-medium px-4 py-1.5 rounded-md transition-all duration-200"
                    style={
                      activeMode
                        ? {
                            background: "rgba(232,23,61,0.15)",
                            border: "1px solid rgba(232,23,61,0.3)",
                            color: "#E8173D",
                          }
                        : { border: "1px solid transparent", color: "#6B7280" }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
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
                className="cursor-pointer rounded-2xl p-12 text-center transition-all duration-200"
                style={{
                  border: dragging
                    ? "2px dashed rgba(232,23,61,0.5)"
                    : "2px dashed rgba(255,255,255,0.08)",
                  background: dragging
                    ? "rgba(232,23,61,0.03)"
                    : "transparent",
                }}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex items-center gap-2 text-[#10B981]">
                      <CheckIcon className="h-6 w-6" />
                      <span className="font-medium text-white">{file.name}</span>
                    </span>
                    <span className="text-xs text-[#374151]">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadArrowIcon className="h-9 w-9 text-[#4B5563]" />
                    <span className="font-semibold text-white">
                      Drop your CSV here
                    </span>
                    <span className="text-sm text-[#4B5563]">
                      or click to browse
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={9}
              spellCheck={false}
              placeholder={'{\n  "revenue": { "mrr": 120000 },\n  "behavior": { "dau": 5000 }\n}'}
              className="glass-input w-full rounded-[10px] p-4 text-sm resize-y leading-relaxed"
            />
          )}

          <button
            type="button"
            onClick={fillSample}
            className="text-xs text-[#E8173D] hover:opacity-80 transition-opacity"
          >
            Try with sample data →
          </button>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#EF4444",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-submit w-full rounded-xl py-3.5 text-sm font-semibold"
          >
            Generate Morning Brief
          </button>
        </form>
      </TiltCard>
    </div>
  );
}
