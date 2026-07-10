import { Link, NavLink, Route, Routes } from "react-router-dom";
import { BoltIcon } from "@heroicons/react/24/solid";
import Dashboard from "./components/Dashboard.jsx";
import UploadData from "./components/UploadData.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? "text-white bg-white/10"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-dark-bg text-gray-200">
      <header className="border-b border-card-border bg-card-bg/60 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BoltIcon className="h-6 w-6 text-brand" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-brand">Pulse</span>
              <span className="text-white">Board</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/upload">New Brief</NavItem>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadData />} />
        </Routes>
      </main>
    </div>
  );
}
