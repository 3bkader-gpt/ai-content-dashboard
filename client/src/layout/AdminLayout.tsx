import { useEffect, useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { getHealth } from "../api/misc";

function navClass(isActive: boolean) {
  return [
    "rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
      : "text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-gray-50",
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">Social Geni</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">Admin Console</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-bold text-gray-900 dark:text-gray-50 md:inline-flex">
              <span
                className={[
                  "material-symbols-outlined text-sm",
                  apiStatus === "active" ? "text-emerald-500" : "",
                  apiStatus === "offline" ? "text-red-500" : "",
                  apiStatus === "checking" ? "text-gray-400 dark:text-gray-500" : "",
                ].join(" ")}
                aria-hidden
              >
                radio_button_checked
              </span>
              {apiStatus === "active" ? "API ON" : apiStatus === "offline" ? "API OFF" : "API…"}
            </div>
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
            <nav className="flex items-center gap-1" aria-label="Admin navigation">
              <NavLink to="/admin/analytics" className={({ isActive }) => navClass(isActive)}>
                Analytics
              </NavLink>
              <NavLink to="/admin/plans" className={({ isActive }) => navClass(isActive)}>
                Plans
              </NavLink>
              <NavLink to="/admin/generated-kits" className={({ isActive }) => navClass(isActive)}>
                Kits Review
              </NavLink>
              <Link
                to="/wizard"
                className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-gray-50"
              >
                Open User App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-2 pb-10 pt-4 sm:px-4 sm:pt-6">
        <Outlet />
      </main>
    </div>
  );
}


