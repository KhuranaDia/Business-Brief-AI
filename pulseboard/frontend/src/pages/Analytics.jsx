import { useBriefs } from "../hooks/useApi.js";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { formatTimestamp } from "../lib.js";
import { motion } from "framer-motion";

export default function Analytics() {
  const { briefs, loading, error } = useBriefs();

  if (loading) return <div className="p-10 animate-pulse text-center">Loading analytics...</div>;
  if (error) return (
    <div className="p-16 text-center">
      <p className="text-status-critical text-lg mb-2">Could not load analytics.</p>
      <p className="text-text-muted text-sm">The intelligence service is unreachable. Please try again shortly.</p>
    </div>
  );
  if (!briefs || briefs.length === 0) return <div className="p-10 text-center">No data available for analytics.</div>;

  const timelineData = briefs.slice(0, 10).reverse().map(b => ({
    name: formatTimestamp(b.created_at).split(',')[0],
    processing: b.processing_time_seconds,
    anomalies: b.anomalies?.length || 0,
    healthValue: b.overall_health === 'critical' ? 3 : b.overall_health === 'at_risk' ? 2 : 1
  }));

  const sevCounts = { critical: 0, warning: 0, normal: 0 };
  briefs.forEach(b => {
    Object.values(b.agent_severities || {}).forEach(s => {
      if (sevCounts[s] !== undefined) sevCounts[s]++;
    });
  });

  const sevData = [
    { name: "Critical", count: sevCounts.critical, fill: "#EF4444" },
    { name: "Warning", count: sevCounts.warning, fill: "#F59E0B" },
    { name: "Normal", count: sevCounts.normal, fill: "#10B981" }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">System Analytics</h1>
        <p className="text-text-muted">Macro trends across all your generated AI briefs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-6">Processing Latency (Seconds)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="processing" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorProc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-3xl p-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-6">Anomalies Detected</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorAnom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8173D" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E8173D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                <Area type="step" dataKey="anomalies" stroke="#E8173D" strokeWidth={2} fillOpacity={1} fill="url(#colorAnom)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-3xl p-8 lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-6">Agent Severity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevData} maxBarSize={60}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
