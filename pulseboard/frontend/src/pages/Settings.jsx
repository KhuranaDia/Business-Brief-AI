import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Settings() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [org, setOrg] = useState(localStorage.getItem('orgName') || 'Acme Corp');
  const [notifs, setNotifs] = useState(localStorage.getItem('notifs') !== 'false');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('orgName', org);
    localStorage.setItem('notifs', notifs);
  }, [theme, org, notifs]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-muted mb-10">Manage your workspace preferences and configurations.</p>
        
        <div className="glass-panel rounded-[2rem] p-8 space-y-10">
          
          <section>
            <h3 className="text-lg font-bold text-text-primary mb-4">Profile & Workspace</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Organization Name</label>
                <input 
                  type="text" 
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="glass-input w-full max-w-md rounded-xl p-3 text-sm"
                />
              </div>
            </div>
          </section>

          <hr className="border-bg-border" />

          <section>
            <h3 className="text-lg font-bold text-text-primary mb-4">Appearance</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => { setTheme('dark'); document.documentElement.classList.add('dark'); }}
                className={`flex-1 py-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-brand-red bg-brand-red/5' : 'border-bg-border hover:border-bg-border/80 bg-bg-secondary'}`}
              >
                <div className="font-semibold text-text-primary mb-1">Dark Mode</div>
                <div className="text-xs text-text-muted">Premium dark aesthetic</div>
              </button>
              <button 
                onClick={() => { setTheme('light'); document.documentElement.classList.remove('dark'); }}
                className={`flex-1 py-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-brand-red bg-brand-red/5' : 'border-bg-border hover:border-bg-border/80 bg-bg-secondary'}`}
              >
                <div className="font-semibold text-text-primary mb-1">Light Mode</div>
                <div className="text-xs text-text-muted">Clean, bright workspace</div>
              </button>
            </div>
          </section>

          <hr className="border-bg-border" />

          <section>
            <h3 className="text-lg font-bold text-text-primary mb-4">AI Configuration</h3>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Fireworks API Key</label>
              <div className="flex gap-3 items-center">
                <input 
                  type="password" 
                  value="••••••••••••••••••••••••••••••••"
                  disabled
                  className="glass-input w-full max-w-md rounded-xl p-3 text-sm opacity-50 cursor-not-allowed"
                />
                <span className="text-xs px-3 py-1.5 rounded-lg bg-status-stable/10 text-status-stable border border-status-stable/20 font-bold uppercase tracking-wider">
                  Configured
                </span>
              </div>
              <p className="text-xs text-text-subtle mt-2">API keys are securely managed server-side by your administrator via environment variables.</p>
            </div>
          </section>

          <hr className="border-bg-border" />

          <section>
            <h3 className="text-lg font-bold text-text-primary mb-4">Notifications</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifs}
                onChange={(e) => setNotifs(e.target.checked)}
                className="w-5 h-5 rounded border-bg-border bg-bg-secondary text-brand-red focus:ring-brand-red focus:ring-offset-bg-primary"
              />
              <span className="text-sm text-text-primary font-medium">Receive critical business health alerts</span>
            </label>
          </section>

          <div style={{marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)'}}>
            <h3 style={{color: 'white', fontWeight: '600', marginBottom: '16px'}}>Infrastructure</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <div style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px'}}>
                <div style={{fontSize: '11px', color: '#6B7280', marginBottom: '4px'}}>COMPUTE</div>
                <div style={{color: 'white', fontWeight: '500'}}>AMD Developer Cloud</div>
                <div style={{fontSize: '12px', color: '#10B981', marginTop: '4px'}}>● Connected</div>
              </div>
              <div style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px'}}>
                <div style={{fontSize: '11px', color: '#6B7280', marginBottom: '4px'}}>LLM INFERENCE</div>
                <div style={{color: 'white', fontWeight: '500'}}>Fireworks AI · LLaMA 3.1 70B</div>
                <div style={{fontSize: '12px', color: '#10B981', marginTop: '4px'}}>● Active</div>
              </div>
              <div style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px'}}>
                <div style={{fontSize: '11px', color: '#6B7280', marginBottom: '4px'}}>AGENT FRAMEWORK</div>
                <div style={{color: 'white', fontWeight: '500'}}>5 Parallel Agents</div>
                <div style={{fontSize: '12px', color: '#6B7280', marginTop: '4px'}}>asyncio.gather()</div>
              </div>
              <div style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px'}}>
                <div style={{fontSize: '11px', color: '#6B7280', marginBottom: '4px'}}>CONTAINERIZATION</div>
                <div style={{color: 'white', fontWeight: '500'}}>Docker + Compose</div>
                <div style={{fontSize: '12px', color: '#6B7280', marginTop: '4px'}}>Submission ready</div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
