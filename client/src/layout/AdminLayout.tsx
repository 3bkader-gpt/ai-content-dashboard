import { useEffect, useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { getHealth } from "../api/misc";

function navClass(isActive: boolean) {
  return [
    "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "text-gray-900 dark:text-white bg-gray-100/80 dark:bg-white/10"
      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5",
  ].join(" ");
}

export default function AdminLayout() {
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const [apiStatus, setApiStatus] = useState<"checking" | "active" | "offline">("checking");

  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const health = await getHealth();
        if (!cancelled) setApiStatus(health.ok ? "active" : "offline");
      } catch {
        if (!cancelled) setApiStatus("offline");
      }
    };
    void checkHealth();
    const id = window.setInterval(() => {
      void checkHealth();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 antialiased selection:bg-indigo-100 dark:selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[70rem] items-center justify-between px-4 h-16 sm:px-6 md:px-8">
          
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-7 h-7 rounded bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white leading-tight">
                   SocialGeni
                 </span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 leading-tight">Admin Console</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1 text-xs font-semibold shadow-sm sm:flex">
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  apiStatus === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "",
                  apiStatus === "offline" ? "bg-red-500" : "",
                  apiStatus === "checking" ? "bg-gray-400" : "",
                ].join(" ")}
              />
              <span className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-300">
                {apiStatus === "active" ? "API ON" : apiStatus === "offline" ? "API OFF" : "API..."}
              </span>
            </div>
            
            <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block mx-1"></div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20"
              aria-label="Toggle theme"
              title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-[20px]">{themeMode === "dark" ? "light_mode" : "dark_mode"}</span>
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block mx-1"></div>

            <nav className="flex items-center gap-1" aria-label="Admin navigation">
              <NavLink to="/admin/analytics" className={({ isActive }) => navClass(isActive)}>Analytics</NavLink>
              <NavLink to="/admin/plans" className={({ isActive }) => navClass(isActive)}>Plans</NavLink>
              <NavLink to="/admin/generated-kits" className={({ isActive }) => navClass(isActive)}>Kits</NavLink>
            </nav>
            
            <Link
              to="/wizard"
              className="ml-2 hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20"
            >
              Exit Admin
              <span className="material-symbols-outlined text-[14px]">logout</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[70rem] px-4 pb-16 pt-8 sm:px-6 md:px-8 sm:pt-12">
        <Outlet />
      </main>
    </div>
  );
}
