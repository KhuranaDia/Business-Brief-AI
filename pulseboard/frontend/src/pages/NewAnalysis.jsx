import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGenerateBrief, useUploadCSV } from "../hooks/useApi.js";
import AgentActivity from "../components/AgentActivity.jsx";
import { motion } from "framer-motion";

export default function NewAnalysis() {
  const navigate = useNavigate();
  const gen = useGenerateBrief();
  const csv = useUploadCSV();
  const fileInput = useRef(null);

  const [mode, setMode] = useState("csv");
  const [businessName, setBusinessName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState("form");
  const [analysis, setAnalysis] = useState(null);
  const [localError, setLocalError] = useState("");

  const error = localError || gen.error || csv.error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (mode === "json") {
      if (!jsonText.trim()) { setLocalError("Please paste some JSON data first."); return; }
      let parsed;
      try { parsed = JSON.parse(jsonText); } catch { setLocalError("Invalid JSON syntax."); return; }
      
      setPhase("analyzing");
      try {
        const res = await gen.generate(parsed, businessName.trim() || "Untitled source");
        setAnalysis(res);
        setPhase("done");
        setTimeout(() => navigate(`/brief/${res.id}`), 2600);
      } catch { setPhase("form"); }
    } else {
      if (!file) { setLocalError("Please choose a CSV file."); return; }
      
      setPhase("analyzing");
      try {
        const res = await csv.upload(file, businessName.trim() || file.name);
        setAnalysis(res);
        setPhase("done");
        setTimeout(() => navigate(`/brief/${res.id}`), 2600);
      } catch { setPhase("form"); }
    }
  };

  if (phase !== "form") {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text-primary mb-3">
            Running Multi-Agent Analysis
          </h1>
          <p className="text-text-muted text-lg">
            Five specialist AI agents are processing {businessName.trim() || (file ? file.name : "your data")}.
          </p>
        </motion.div>
        <AgentActivity active={phase === "analyzing" || phase === "done"} result={analysis} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-20 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">New Intelligence Run</h1>
          <p className="text-text-muted">Upload raw data to generate a comprehensive executive brief.</p>
        </div>

        <div className="glass-panel rounded-[2rem] p-8 border-t border-t-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-3">
                Analysis Title
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Q3 Performance Data"
                className="glass-input w-full rounded-xl p-4 text-base"
              />
            </div>

            <div>
              <div className="flex p-1 bg-bg-primary/50 rounded-xl border border-bg-border w-fit mb-4">
                <button
                  type="button"
                  onClick={() => setMode("csv")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "csv" ? "bg-brand-red text-white shadow-md" : "text-text-muted hover:text-text-primary"}`}
                >
                  Upload CSV
                </button>
                <button
                  type="button"
                  onClick={() => setMode("json")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "json" ? "bg-brand-red text-white shadow-md" : "text-text-muted hover:text-text-primary"}`}
                >
                  Paste JSON
                </button>
              </div>

              {mode === "csv" ? (
                <div
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files?.[0]); }}
                  className={`cursor-pointer rounded-2xl p-16 text-center border-2 border-dashed transition-all duration-200 ${dragging ? "border-brand-red bg-brand-red/5" : "border-bg-border bg-bg-card hover:bg-bg-border/30"}`}
                >
                  <input ref={fileInput} type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
                  {file ? (
                    <div className="text-status-good font-medium text-lg flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {file.name}
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <div className="text-text-primary font-medium text-lg mb-1">Click to upload or drag and drop</div>
                      <div className="text-text-subtle text-sm">CSV files only</div>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={8}
                  placeholder='{ "revenue": 100000, "active_users": 5000 }'
                  className="glass-input w-full rounded-xl p-4 font-mono text-sm leading-relaxed"
                />
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-status-critical/10 border border-status-critical/20 text-status-critical text-sm font-medium">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-4 rounded-xl text-lg font-semibold shadow-[0_8px_30px_rgba(232,23,61,0.3)]">
              Generate Intelligence Brief
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
