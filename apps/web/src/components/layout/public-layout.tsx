/**
 * PublicLayout
 *
 * Lightweight shell for public-facing routes (landing, about, usage, auth).
 * Provides a simple nav, content outlet, and footer without pulling in
 * authenticated app chrome or store synchronization.
 */
import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight, BookMarked } from "lucide-react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/usage", label: "Usage" },
  { to: "/docs", label: "User Instructions" },
];

const getNavClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "px-3 py-2 text-sm font-semibold transition-colors rounded-md",
    "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
    isActive ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "",
  ]
    .filter(Boolean)
    .join(" ");

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50">
      <header className="border-b border-slate-200/70 dark:border-slate-800/70 backdrop-blur bg-white/70 dark:bg-slate-950/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200/50 dark:shadow-none">
              <BookMarked className="w-5 h-5 text-white" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">
                IncSys
              </p>
              <p className="text-lg font-extrabold leading-tight">Self Statistics System</p>
            </div>
          </Link>

          <nav className="flex-1 hidden sm:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={getNavClassName} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
          >
            Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Self Statistics System</p>
          </div>
          <div className="flex gap-4">
            <Link to="/usage" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              How it works
            </Link>
            <Link to="/auth/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};