import { useEffect, useState, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useBrief, useImpact, useChat } from "../hooks/useApi.js";
import { healthMeta, severityMeta, formatTimestamp } from "../lib.js";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";

const KPI_REGEX = /(\$?\d+(?:,\d+)?(?:\.\d+)?[%Bmk]?|\+\d+%|-[0-9]+%)/g;

function highlightKpis(line, keyPrefix) {
  const parts = line.split(KPI_REGEX);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span
          key={`${keyPrefix}-k${i}`}
          className="text-text-primary font-bold bg-bg-border/50 px-1 rounded"
        >
          {part}
        </span>
      );
    }
    return <span key={`${keyPrefix}-t${i}`}>{part}</span>;
  });
}

function parseBriefContent(text) {
  if (!text) return null;
  const sections = text.split(/(?=\*\*.*?\*\*:?)/).filter(Boolean);

  return sections.map((section, idx) => {
    const match = section.match(/^\*\*(.*?)\*\*:?\s*([\s\S]*)$/);
    if (!match) {
      return (
        <p key={idx} className="mb-4 text-text-muted leading-relaxed">
          {section}
        </p>
      );
    }

    const [, header, content] = match;
    const isStatus = header.toUpperCase().includes("STATUS");
    const lines = content.trim().split(/\n/);

    return (
      <div key={idx} className="mb-8 last:mb-0">
        <h3 className={`text-xs font-bold tracking-[0.2em] uppercase mb-3 ${isStatus ? 'text-brand-red' : 'text-text-subtle'}`}>
          {header}
        </h3>
        <div className="text-text-muted leading-relaxed space-y-2 text-[15px]">
          {lines.map((line, i) => (
            <p key={i} className={line.trim() ? "" : "h-2"}>
              {highlightKpis(line, `${idx}-${i}`)}
            </p>
          ))}
        </div>
      </div>
    );
  });
}

function ChatInterface({ briefId }) {
  const { ask, loading } = useChat();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "I've analyzed this brief. What would you like to know?" }]);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToUse) => {
    const q = textToUse || query;
    if (!q.trim() || loading) return;
    
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setQuery("");
    
    try {
      const answer = await ask(q, briefId);
      setMessages(prev => [...prev, { role: "ai", text: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: "I encountered an error processing that request." }]);
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[500px]">
      <div className="p-4 border-b border-bg-border bg-bg-card rounded-t-2xl font-semibold text-sm tracking-wider uppercase text-text-muted flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        Executive Assistant
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-brand-red text-white rounded-br-none' : 'bg-bg-secondary text-text-primary rounded-bl-none border border-bg-border'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-secondary border border-bg-border text-text-muted p-3 rounded-xl rounded-bl-none flex gap-1 items-center h-10">
              <span className="w-2 h-2 bg-text-subtle rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-text-subtle rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 bg-text-subtle rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-bg-border">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          {["Generate board summary", "Why did revenue drop?", "Draft team email"].map(prompt => (
            <button key={prompt} onClick={() => handleSend(prompt)} className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-bg-secondary border border-bg-border hover:bg-bg-border/50 text-text-muted transition-colors whitespace-nowrap">
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" value={query} onChange={e => setQuery(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..." 
            className="glass-input flex-1 rounded-lg px-4 py-2 text-sm"
          />
          <button onClick={() => handleSend()} disabled={loading} className="btn-primary px-4 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BriefViewer() {
  const { id } = useParams();
  const isValidId = id && id !== "undefined" && id !== "null";
  const { brief, loading, error } = useBrief(isValidId ? id : undefined);
  const { impact, loading: impactLoading, fetchImpact } = useImpact();

  useEffect(() => {
    if (brief?.id) fetchImpact(brief.id);
  }, [brief?.id, fetchImpact]);

  if (!isValidId) return <Navigate to="/" replace />;

  if (loading) return <div className="max-w-5xl mx-auto p-10 animate-pulse text-text-muted">Loading brief...</div>;
  if (error || !brief) return <div className="max-w-5xl mx-auto p-10 text-status-critical">{error || "Not found"}</div>;

  const meta = healthMeta(brief.overall_health);

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`PulseBoard Brief: ${brief.data_source_name}`, 10, 20);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(brief.final_brief, 180);
    doc.text(lines, 10, 30);
    doc.save(`brief-${brief.id}.pdf`);
  };

  const handleExportMarkdown = () => downloadFile(brief.final_brief, `brief-${brief.id}.md`, "text/markdown");
  const handleExportJSON = () => downloadFile(JSON.stringify(brief, null, 2), `brief-${brief.id}.json`, "application/json");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: meta.tint, color: meta.color, border: `1px solid ${meta.border}` }}>
            {meta.label}
          </span>
          <span className="text-text-subtle text-sm font-medium">{formatTimestamp(brief.created_at)}</span>
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">{brief.data_source_name}</h1>
        <div className="flex gap-4 text-sm text-text-subtle border-b border-bg-border pb-6">
          <span>Processing time: <strong className="text-text-primary">{brief.processing_time_seconds}s</strong></span>
          <span>ID: <strong className="text-text-primary">#{brief.id}</strong></span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Brief Content */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-8 md:p-10 shadow-xl border-t border-t-white/5 relative">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: meta.color }} />
            {parseBriefContent(brief.final_brief)}
          </motion.div>

          {/* Impact Section */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-2xl p-8 border-l-4" style={{ borderLeftColor: impact?.priority === 'critical' ? '#EF4444' : '#F59E0B' }}>
            <h2 className="text-sm font-bold tracking-wider uppercase text-text-primary mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Business Impact Analysis
            </h2>
            {impactLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-bg-secondary rounded w-3/4" />
                <div className="h-4 bg-bg-secondary rounded w-1/2" />
              </div>
            ) : impact ? (
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-6">{impact.headline}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-text-subtle uppercase mb-1">Rev at Risk</div>
                    <div className="text-lg font-bold text-status-critical">{impact.revenue_at_risk}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-subtle uppercase mb-1">Impacted</div>
                    <div className="text-lg font-bold text-status-warning">{impact.customers_affected}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-subtle uppercase mb-1">Time to fix</div>
                    <div className="text-lg font-bold text-text-primary">{impact.resolve_within}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-subtle uppercase mb-1">24h Loss Proj.</div>
                    <div className="text-lg font-bold text-brand-red">{impact.projected_loss_24h}</div>
                  </div>
                </div>
                <p className="text-sm text-text-muted bg-bg-secondary p-4 rounded-xl border border-bg-border">{impact.reasoning}</p>
              </div>
            ) : (
              <div className="text-text-subtle text-sm">Impact analysis unavailable.</div>
            )}
          </motion.div>

          {/* Agent Transparency */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wider uppercase text-text-muted mb-4 pl-2">Specialist Agent Logs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(brief.agent_results || {}).map(([key, data]) => {
                if (!data) return null;
                const sev = severityMeta(data.severity);
                return (
                  <div key={key} className="glass-panel rounded-xl p-5 border border-bg-border flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-text-primary capitalize">{key}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: sev.tint, color: sev.color }}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted flex-1">{data.insight}</p>
                    {data.anomalies?.length > 0 && (
                      <div className="mt-2 text-xs text-status-warning bg-status-warning/10 p-2 rounded border border-status-warning/20">
                        {data.anomalies.length} anomalies detected
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ChatInterface briefId={brief.id} />

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Export Options</h3>
            <div className="space-y-2">
              <button onClick={() => { navigator.clipboard.writeText(brief.final_brief); }} className="w-full text-left px-4 py-3 rounded-xl bg-bg-secondary hover:bg-bg-border/50 text-sm font-medium transition-colors text-text-primary flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy Summary
              </button>
              <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 rounded-xl bg-bg-secondary hover:bg-bg-border/50 text-sm font-medium transition-colors text-text-primary flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export PDF
              </button>
              <button onClick={handleExportMarkdown} className="w-full text-left px-4 py-3 rounded-xl bg-bg-secondary hover:bg-bg-border/50 text-sm font-medium transition-colors text-text-primary flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export Markdown
              </button>
              <button onClick={handleExportJSON} className="w-full text-left px-4 py-3 rounded-xl bg-bg-secondary hover:bg-bg-border/50 text-sm font-medium transition-colors text-text-primary flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                Export JSON
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="w-full text-left px-4 py-3 rounded-xl bg-bg-secondary hover:bg-bg-border/50 text-sm font-medium transition-colors text-text-primary flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Share Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
