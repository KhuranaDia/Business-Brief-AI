import { useEffect, useState, useRef } from "react";
import { severityMeta } from "../lib.js";
import { motion } from "framer-motion";

const AGENTS = [
  { key: "revenue", name: "Revenue", color: "#10B981" },
  { key: "behavior", name: "Behavior", color: "#6366F1" },
  { key: "error", name: "Error", color: "#F59E0B" },
  { key: "sentiment", name: "Sentiment", color: "#8B5CF6" },
];

export default function AgentActivity({ active, result }) {
  const [started, setStarted] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!active) return;
    setStarted(0);
    const id = setInterval(() => setStarted(n => (n < AGENTS.length ? n + 1 : n)), 600);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!result) { setCompleted(0); return; }
    const id = setInterval(() => setCompleted(n => (n < AGENTS.length ? n + 1 : n)), 400);
    return () => clearInterval(id);
  }, [result]);

  const agentResults = result?.agent_results || {};
  const severities = result?.agent_severities || {};
  const allComplete = Boolean(result) && completed >= AGENTS.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {AGENTS.map((agent, i) => {
        const isComplete = Boolean(result) && i < completed;
        const isAnalyzing = !isComplete && started > i;
        const insight = agentResults[agent.key]?.insight;
        const severity = severities[agent.key];
        const sevMeta = severity ? severityMeta(severity) : null;

        return (
          <motion.div
            key={agent.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel rounded-2xl p-5 relative overflow-hidden ${isAnalyzing ? 'animate-pulse' : ''}`}
            style={{ borderColor: isComplete ? 'rgba(16,185,129,0.3)' : '' }}
          >
            {isComplete && <div className="absolute top-0 right-0 w-32 h-32 bg-status-stable/10 rounded-full blur-3xl -mr-10 -mt-10" />}
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: `${agent.color}20`, color: agent.color }}>
                  {agent.name[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name} Agent</h3>
                  <p className="text-xs font-medium tracking-wider uppercase" style={{ color: isComplete ? '#10B981' : isAnalyzing ? '#E8173D' : '#6B7280' }}>
                    {isComplete ? "COMPLETE" : isAnalyzing ? "ANALYZING..." : "QUEUED"}
                  </p>
                </div>
              </div>
              
              {isComplete && sevMeta && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ background: sevMeta.tint, color: sevMeta.color }}>
                  {sevMeta.label}
                </span>
              )}
            </div>
            
            {isComplete && insight && (
              <p className="text-sm text-text-muted mt-2 relative z-10 line-clamp-2">{insight}</p>
            )}
          </motion.div>
        );
      })}

      <motion.div 
        className="md:col-span-2 glass-panel rounded-2xl p-6 flex items-center gap-4 border border-brand-red/20"
        animate={allComplete ? { borderColor: 'rgba(232,23,61,0.5)', backgroundColor: 'rgba(232,23,61,0.05)' } : {}}
      >
        <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
          <h3 className="font-semibold text-text-primary text-lg">Synthesis Engine</h3>
          <p className="text-sm text-text-subtle">
            {allComplete ? <span className="text-gradient font-medium">Finalizing executive brief...</span> : "Waiting for specialist reports..."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
