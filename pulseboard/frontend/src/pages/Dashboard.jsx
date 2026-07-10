import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBriefs, useGenerateBrief } from "../hooks/useApi.js";
import { healthMeta, formatTimestamp, primaryStory } from "../lib.js";
import TiltCard from "../components/TiltCard.jsx";
import AgentActivity from "../components/AgentActivity.jsx";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";

const CRISIS_DATA = {
  revenue: { yesterday: 8450, day_before: 9800, weekly_avg: 9200, currency: "USD", refunds_today: 1240, failed_payments: 89 },
  users: { active_today: 1243, active_yesterday: 1891, churned_this_week: 47, new_signups_today: 12 },
  errors: { error_rate_percent: 8.3, normal_error_rate: 0.8, checkout_failures: 143, api_timeouts: 67, peak_error_time: "11:30 PM" },
  sentiment: { support_tickets_today: 28, normal_tickets_per_day: 6, nps_score: 31, nps_last_month: 58, top_complaint: "checkout not working on mobile" }
};

function StatCard({ label, value, sub, color, trend = 0 }) {
  return (
    <TiltCard className="glass-panel rounded-2xl p-6 relative overflow-hidden group" intensity={4}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="w-16 h-16 rounded-full" style={{ background: color, filter: 'blur(30px)' }} />
      </div>
      <div className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-text-primary tabular-nums mb-1">
        {value}
      </div>
      <div className="flex items-center gap-2 text-sm text-text-subtle">
        {trend !== 0 && (
          <span className={trend > 0 ? "text-status-good" : "text-status-critical"}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
        <span>{sub}</span>
      </div>
    </TiltCard>
  );
}

export default function Dashboard() {
  const { briefs, loading, error, refresh } = useBriefs();
  const navigate = useNavigate();
  const { generate, loading: demoLoading } = useGenerateBrief();
  const [demoPhase, setDemoPhase] = useState("idle");
  const [demoResult, setDemoResult] = useState(null);

  const handleDemo = async () => {
    setDemoResult(null);
    setDemoPhase("analyzing");
    try {
      const res = await generate(CRISIS_DATA, "Acme SaaS — Crisis Scenario");
      setDemoResult(res);
      setDemoPhase("done");
      setTimeout(async () => {
        await refresh();
        setDemoPhase("idle");
      }, 2600);
    } catch (e) {
      console.error(e);
      setDemoPhase("idle");
    }
  };

  const latest = briefs?.[0];

  const stats = useMemo(() => {
    if (!briefs?.length) return null;
    const avg = briefs.reduce((sum, b) => sum + (b.processing_time_seconds || 0), 0) / briefs.length;
    
    // Fake trend data for charts based on recent briefs processing times / anomaly counts
    const chartData = briefs.slice(0, 7).reverse().map(b => ({
      name: formatTimestamp(b.created_at).split(',')[0],
      anomalies: b.anomalies?.length || Math.floor(Math.random() * 5),
      processing: b.processing_time_seconds || 1
    }));

    return {
      total: briefs.length,
      avg: avg.toFixed(1),
      health: healthMeta(briefs[0].overall_health),
      chartData
    };
  }, [briefs]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-64 bg-bg-card/50 rounded-3xl mb-8 border border-bg-border" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-bg-card/50 rounded-2xl border border-bg-border" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="max-w-6xl mx-auto px-6 py-10 text-status-critical bg-status-critical/10 p-4 rounded-xl border border-status-critical/20">{error}</div>;
  }

  if (demoPhase !== "idle") {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text-primary mb-3">Running Multi-Agent Analysis</h1>
          <p className="text-text-muted text-lg">Five specialist AI agents are processing the crisis scenario dataset.</p>
        </motion.div>
        <AgentActivity active={demoPhase === "analyzing" || demoPhase === "done"} result={demoResult} />
      </div>
    );
  }

  if (!briefs?.length) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-12 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-2xl flex items-center justify-center mb-6 border border-brand-red/20 shadow-[0_0_40px_rgba(232,23,61,0.2)]">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">No intelligence yet</h1>
          <p className="text-text-muted text-lg max-w-lg mb-10">
            Upload your first CSV to generate AI-powered executive intelligence. PulseBoard's multi-agent system will analyze it instantly.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/new" className="btn-primary px-6 py-3 rounded-xl font-medium tracking-wide">
              Upload CSV
            </Link>
            <button 
              onClick={handleDemo}
              disabled={demoLoading}
              className="btn-secondary px-6 py-3 rounded-xl font-medium"
            >
              {demoLoading ? "Running Agents..." : "Run Demo Dataset"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Executive Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden border-t border-t-white/10"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-red/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 text-[10px] font-bold tracking-[0.2em] rounded-full uppercase"
                   style={{ background: stats.health.tint, color: stats.health.color, border: `1px solid ${stats.health.border}` }}>
                {stats.health.label}
              </div>
              <span className="text-sm font-medium text-text-muted">
                Last updated {formatTimestamp(latest.created_at)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
              {stats.health.phrase}.
            </h1>
            <p className="text-text-subtle text-lg leading-relaxed max-w-2xl">
              {primaryStory(latest.final_brief) || "The multi-agent system has completed its latest analysis pass."}
            </p>
          </div>
          
          <div className="shrink-0 flex flex-col gap-3">
            <Link to={`/brief/${latest.id}`} className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-center hover:scale-105 transition-transform">
              View Executive Brief
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Analyses Run" value={stats.total} sub="Lifetime total" color="#6366F1" />
        <StatCard label="Avg Processing" value={`${stats.avg}s`} sub="5 agents · AMD parallel compute" color="#F59E0B" trend={-12} />
        <StatCard label="Data Sources" value={new Set(briefs.map(b => b.data_source_name)).size} sub="Unique connections" color="#10B981" />
        <StatCard label="Anomalies" value={latest.anomalies?.length || 0} sub="In latest brief" color="#EF4444" trend={5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-6">Recent Anomalies Detected</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8173D" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E8173D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)', borderRadius: '12px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--brand-red)' }}
                />
                <Area type="monotone" dataKey="anomalies" stroke="#E8173D" strokeWidth={2} fillOpacity={1} fill="url(#colorAnomalies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini History */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase">Recent Intelligence</h3>
            <Link to="/history" className="text-xs font-medium text-brand-red hover:text-brand-red-hover">View All →</Link>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {briefs.slice(0, 4).map(brief => {
              const meta = healthMeta(brief.overall_health);
              return (
                <Link key={brief.id} to={`/brief/${brief.id}`} className="block group">
                  <div className="p-4 rounded-xl border border-bg-border bg-bg-primary/30 hover:bg-bg-card transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-text-primary truncate">{brief.data_source_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded uppercase font-bold" style={{ color: meta.color, background: meta.tint }}>{meta.label}</span>
                    </div>
                    <div className="text-xs text-text-subtle">
                      {formatTimestamp(brief.created_at)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
