import { NavLink, Route, Routes, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import UploadPage from "./pages/UploadPage.jsx";

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

export default function App() {
  return (
    <div className="min-h-screen text-[#F0F0FA]">
      <header
        className="fixed top-0 inset-x-0 z-50 h-14"
        style={{
          background: "rgba(5,5,15,0.8)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="mx-auto max-w-6xl h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <PulseIcon className="h-5 w-5 text-[#E8173D]" />
            <span className="ml-2.5 text-sm font-bold tracking-[0.2em] text-white">
              PULSE
            </span>
            <span className="text-sm font-bold tracking-[0.2em] text-[#E8173D]">
              BOARD
            </span>
            <span className="hidden sm:block w-px h-4 bg-white/10 mx-4" />
            <span className="hidden sm:block text-xs text-[#374151] tracking-wider">
              autonomous intelligence
            </span>
          </Link>

          <NavLink
            to="/upload"
            className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold tracking-wide"
          >
            + New Analysis
          </NavLink>
        </div>
      </header>

      <main className="pt-14 relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </div>
  );
}
