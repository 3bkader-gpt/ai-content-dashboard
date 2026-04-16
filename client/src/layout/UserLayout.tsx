import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function linkClass(isActive: boolean) {
  return [
    "px-3 py-2 text-sm font-medium transition-colors rounded-md",
    isActive
      ? "text-gray-900 dark:text-white bg-gray-100/80 dark:bg-white/10"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5",
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
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 antialiased selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-100">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[70rem] items-center justify-between px-4 h-16 sm:px-6 md:px-8">
          
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-7 h-7 rounded bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                SocialGeni
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
                Overview
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
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-1 px-2.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[11px] font-medium tracking-wide text-gray-600 dark:text-gray-400 uppercase">
                  {entitlements?.plan_code ?? "Free"}
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block mx-2"></div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20"
              aria-label="Toggle theme"
              title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {themeMode === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {session ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:border-white/10 dark:hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20"
              >
                <span className="hidden sm:inline">Sign out</span>
                <span className="material-symbols-outlined text-sm sm:hidden">logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center px-4 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 text-sm font-medium text-white shadow-sm dark:bg-white dark:text-black dark:hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-black"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[70rem] px-4 pb-16 pt-8 sm:px-6 md:px-8 sm:pt-12">
        {demoBanner}
        <Outlet />
      </main>
    </div>
  );
}
