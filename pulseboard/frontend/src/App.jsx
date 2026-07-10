import { Link, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import UploadPage from "./pages/UploadPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <header className="border-b border-bg-border sticky top-0 z-30 bg-bg-primary/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-white">PULSE</span>
              <span className="text-brand-red">BOARD</span>
            </span>
            <span className="hidden sm:flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-text-subtle" />
              <span className="text-xs text-text-muted tracking-wide">
                autonomous business intelligence
              </span>
            </span>
          </Link>

          <NavLink
            to="/upload"
            className="text-sm font-medium px-4 py-2 rounded-lg border border-brand-red text-brand-red hover:bg-brand-red hover:text-white transition-all duration-200"
          >
            Upload Data
          </NavLink>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </div>
  );
}
