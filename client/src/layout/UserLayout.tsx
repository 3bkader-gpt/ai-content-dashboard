import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function linkClass(isActive: boolean) {
  return [
    "px-3 py-2 text-sm font-medium transition-colors rounded-md",
    isActive
      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50",
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 antialiased selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900/50 dark:selection:text-indigo-100">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 h-16 sm:px-6">
          
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Social<span className="text-indigo-600 dark:text-indigo-400">Geni</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main navigation">
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

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gray-500 dark:text-gray-400">
              Plan: {entitlements?.plan_code ?? "free"}
            </span>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block mx-1"></div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 -mr-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Toggle theme"
              title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-xl">
                {themeMode === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {session ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/20 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
              >
                <span className="hidden sm:inline">Sign in</span>
                <span className="material-symbols-outlined text-sm sm:hidden">login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:pt-8">
        {demoBanner}
        <Outlet />
      </main>
    </div>
  );
}
