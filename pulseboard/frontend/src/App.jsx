import { NavLink, Route, Routes, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import NewAnalysis from "./pages/NewAnalysis.jsx";
import History from "./pages/History.jsx";
import BriefViewer from "./pages/BriefViewer.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import { useBriefs } from "./hooks/useApi.js";

function PulseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
      <path
        d="M2 12h4l2.5-7 4 14 2.5-7H22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Navigation() {
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const links = [
    { name: "Dashboard", path: "/" },
    { name: "History", path: "/history" },
    { name: "Analytics", path: "/analytics" },
    { name: "Settings", path: "/settings" }
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 glass-panel border-x-0 border-t-0 rounded-none">
      <div className="mx-auto max-w-6xl h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <PulseIcon className="h-5 w-5 text-brand-red" />
            <span className="ml-2.5 text-sm font-bold tracking-[0.2em] text-text-primary">
              PULSE
            </span>
            <span className="text-sm font-bold tracking-[0.2em] text-brand-red">
              BOARD
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.path}
                to={l.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === l.path || (l.path !== "/" && location.pathname.startsWith(l.path))
                    ? "bg-bg-border text-text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-border/50"
                }`}
              >
                {l.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-border transition-colors"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <Link
            to="/new"
            className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide"
          >
            + New Analysis
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-200">
      <Navigation />
      <main className="pt-14 relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewAnalysis />} />
          <Route path="/history" element={<History />} />
          <Route path="/brief/:id" element={<BriefViewer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
