import { useState } from "react";
import { Link } from "react-router-dom";
import { useBriefs } from "../hooks/useApi.js";
import { formatTimestamp, healthMeta, primaryStory } from "../lib.js";
import { motion } from "framer-motion";

export default function History() {
  const { briefs, loading, error } = useBriefs();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = (briefs || []).filter(b => {
    if (search && !b.data_source_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "all" && b.overall_health !== filter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Analysis History</h1>
          <p className="text-text-muted">A complete log of your generated executive briefs.</p>
        </div>
        
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search titles..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input px-4 py-2 rounded-xl text-sm w-64"
          />
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="glass-input px-4 py-2 rounded-xl text-sm outline-none bg-bg-card"
          >
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="at_risk">Warning</option>
            <option value="healthy">Healthy</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted animate-pulse">Loading history...</div>
        ) : error ? (
          <div className="p-16 text-center">
            <p className="text-status-critical text-lg mb-2">Could not load analysis history.</p>
            <p className="text-text-muted text-sm">The intelligence service is unreachable. Please try again shortly.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-text-muted text-lg mb-4">No analysis results found.</p>
            <Link to="/new" className="text-brand-red font-medium hover:underline">Start a new analysis →</Link>
          </div>
        ) : (
          <div className="divide-y divide-bg-border/50">
            {filtered.map((brief, i) => {
              const meta = healthMeta(brief.overall_health);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={brief.id}
                >
                  <Link 
                    to={`/brief/${brief.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-bg-primary/50 transition-colors gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-text-primary truncate text-lg">{brief.data_source_name}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" style={{ background: meta.tint, color: meta.color, border: `1px solid ${meta.border}` }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted truncate">{primaryStory(brief.final_brief)}</p>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-text-subtle shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-text-primary font-medium">{formatTimestamp(brief.created_at).split(',')[0]}</span>
                        <span>{formatTimestamp(brief.created_at).split(',')[1]}</span>
                      </div>
                      <div className="text-brand-red flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        View <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
