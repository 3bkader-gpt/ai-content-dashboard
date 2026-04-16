import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function linkClass(isActive: boolean) {
  return [
    "rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
      : "text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-gray-50",
  ].join(" ");
}

export default function UserLayout({ demoBanner }: { demoBanner?: ReactNode }) {
  const { entitlements, session, signInWithGoogle, signOut } = useAuth();
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  const toggleTheme = () => {
    const next = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme_mode", next);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
            Social Geni
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500 sm:inline-flex">
              Plan: {entitlements?.plan_code ?? "free"}
            </span>
            {session ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-bold text-red-500 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-bold text-gray-900 dark:text-gray-50 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2"
              aria-label="Toggle theme"
              title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-sm">{themeMode === "dark" ? "light_mode" : "dark_mode"}</span>
              <span className="hidden sm:inline">{themeMode === "dark" ? "Light" : "Dark"}</span>
            </button>
            <nav className="flex items-center gap-1" aria-label="User navigation">
            <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
              Home
            </NavLink>
            <NavLink to="/wizard" className={({ isActive }) => linkClass(isActive)}>
              Wizard
            </NavLink>
            <NavLink to="/generated-kits" className={({ isActive }) => linkClass(isActive)}>
              Kits
            </NavLink>
            <NavLink to="/pricing" className={({ isActive }) => linkClass(isActive)}>
              Pricing
            </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-2 pb-10 pt-4 sm:px-4 sm:pt-6">
        {demoBanner}
        <Outlet />
      </main>
    </div>
  );
}


