import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  listKits,
  listNotifications,
  markAllNotificationsRead,
  getPreferences,
  updatePreferences,
  getProfile,
  getHealth,
  type NotificationItem,
} from "../api";
import type { KitSummary } from "../types";
import GlobalSearchOverlay from "./GlobalSearchOverlay";
import { CompactTableProvider } from "./compactTableContext";
import { useThemeMode } from "./hooks/useThemeMode";

function icon(name: string) {
  return (
    <span className="material-symbols-outlined" aria-hidden>
      {name}
    </span>
  );
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
    active
      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-e-2 border-indigo-600"
      : "text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-gray-50",
  ].join(" ");
}

export default function AppLayout({
  children,
  demoBanner,
}: {
  children: ReactNode;
  demoBanner?: ReactNode;
}) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [kits, setKits] = useState<KitSummary[] | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [compactTable, setCompactTable] = useState(() => {
    try {
      return localStorage.getItem("ethereal_compact_table") === "1";
    } catch {
      return false;
    }
  });
  const [profileName, setProfileName] = useState("User");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [apiStatus, setApiStatus] = useState<"checking" | "active" | "offline">("checking");
  const { themeMode, toggleTheme } = useThemeMode();

  const notifWrap = useRef<HTMLDivElement>(null);
  const settingsWrap = useRef<HTMLDivElement>(null);
  const userWrap = useRef<HTMLDivElement>(null);

  const closeHeaderPanels = useCallback(() => {
    setNotifOpen(false);
    setSettingsOpen(false);
    setUserOpen(false);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    getPreferences()
      .then((p) => {
        setCompactTable(p.compact_table);
        try {
          localStorage.setItem("ethereal_compact_table", p.compact_table ? "1" : "0");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        try {
          setCompactTable(localStorage.getItem("ethereal_compact_table") === "1");
        } catch {
          /* ignore */
        }
      });
    getProfile()
      .then((p) => setProfileName(p.display_name || "User"))
      .catch(() => {});
    listNotifications()
      .then((r) => setNotifications(r.items))
      .catch(() => setNotifications([]));
  }, []);

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

  useEffect(() => {
    if (!searchOpen) return;
    listKits()
      .then(setKits)
      .catch(() => setKits([]));
  }, [searchOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    listNotifications()
      .then((r) => setNotifications(r.items))
      .catch(() => {});
  }, [notifOpen]);

  useEffect(() => {
    if (!notifOpen && !settingsOpen && !userOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifOpen && !notifWrap.current?.contains(t)) setNotifOpen(false);
      if (settingsOpen && !settingsWrap.current?.contains(t)) setSettingsOpen(false);
      if (userOpen && !userWrap.current?.contains(t)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [notifOpen, settingsOpen, userOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeHeaderPanels();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeHeaderPanels]);

  const openSearch = () => {
    closeHeaderPanels();
    setSearchOpen(true);
  };

  const onNavItemClick = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <GlobalSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        kits={kits}
        query={searchQuery}
        onQueryChange={setSearchQuery}
      />

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
        />
      )}

      <aside
        className={[
          "fixed start-0 top-0 z-50 flex h-screen w-64 flex-col border-e border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-8 shadow-sm transition-transform duration-300",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="mb-3 ms-auto rounded-lg p-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 md:hidden"
          aria-label="Close menu"
        >
          {icon("close")}
        </button>
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-bold tracking-tighter text-indigo-600 dark:text-indigo-400">
            Social Geni
          </h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
            AI Content Kits in Minutes
          </p>
        </div>
        <nav className="flex flex-grow flex-col gap-2" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)} onClick={onNavItemClick}>
            {icon("dashboard")}
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/generated-kits" className={({ isActive }) => navLinkClass(isActive)} onClick={onNavItemClick}>
            {icon("inventory_2")}
            <span>Generated Kits</span>
          </NavLink>
          <NavLink to="/wizard" className={({ isActive }) => navLinkClass(isActive)} onClick={onNavItemClick}>
            {icon("auto_awesome")}
            <span>Content Wizard</span>
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 border-t border-gray-100 dark:border-gray-800 pt-6">
          <Link
            to="/wizard"
            className="mb-6 block w-full rounded-xl bg-indigo-600 py-3 text-center font-bold text-white transition hover:opacity-90"
          >
            Create new Kit
          </Link>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/65 px-4 backdrop-blur-xl md:start-64 md:w-[calc(100%-16rem)] md:px-8">
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-lg p-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-400 md:hidden"
            aria-label="Open menu"
          >
            {icon("menu")}
          </button>
          <button
            type="button"
            onClick={openSearch}
            className="rounded-lg p-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-400 sm:hidden"
            aria-label="Open search"
          >
            {icon("search")}
          </button>
          <div className="group relative hidden sm:block">
            <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="search"
              readOnly
              onFocus={openSearch}
              onClick={openSearch}
              className="w-32 cursor-pointer rounded-full border-none bg-gray-100 dark:bg-gray-800 py-1.5 ps-10 pe-4 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:text-gray-500 transition-all focus:ring-2 focus:ring-indigo-400 sm:w-56 md:w-64"
              placeholder="Search kits…"
              aria-label="Open search"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
            />
          </div>
          <div className="mx-1 hidden h-4 w-px bg-gray-200 sm:block sm:mx-2" />
          <span
            className={[
              "text-sm font-bold tracking-tight transition-colors hidden sm:inline",
              apiStatus === "active" ? "text-green-500" : "",
              apiStatus === "offline" ? "text-red-500" : "",
              apiStatus === "checking" ? "text-gray-400 dark:text-gray-500" : "",
            ]
              .filter(Boolean)
            .join(" ")}
          >
            API: {apiStatus === "active" ? "Active" : apiStatus === "offline" ? "Offline" : "Checking..."}
          </span>
          <span
            className={[
              "text-xs font-bold tracking-tight transition-colors sm:hidden",
              apiStatus === "active" ? "text-green-500" : "",
              apiStatus === "offline" ? "text-red-500" : "",
              apiStatus === "checking" ? "text-gray-400 dark:text-gray-500" : "",
            ]
              .filter(Boolean)
            .join(" ")}
          >
            {apiStatus === "active" ? "API ON" : apiStatus === "offline" ? "API OFF" : "API…"}
          </span>
          <div className="hidden items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 lg:flex">
            <span className="material-symbols-outlined text-sm">north_east</span>
            Start from Content Wizard
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-bold text-gray-900 dark:text-gray-50 transition hover:bg-gray-50 dark:bg-gray-950 focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Toggle theme"
            title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="material-symbols-outlined text-sm">
              {themeMode === "dark" ? "light_mode" : "dark_mode"}
            </span>
            <span className="hidden sm:inline">{themeMode === "dark" ? "Light" : "Dark"}</span>
          </button>
          <div className="flex items-center gap-1 sm:gap-3">
            <div className="relative" ref={notifWrap}>
              <button
                type="button"
                className="relative rounded-lg p-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-400"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setSettingsOpen(false);
                  setUserOpen(false);
                }}
              >
                {icon("notifications")}
                {notifications.some((n) => !n.read) && (
                  <span className="absolute end-2 top-2 h-2 w-2 rounded-full border border-white bg-indigo-600" />
                )}
              </button>
              {notifOpen && (
                <div
                  className="absolute end-0 top-full z-[70] mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
                  role="region"
                  aria-label="Notifications"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50">Notifications</h3>
                    <button
                      type="button"
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                      onClick={() => {
                        markAllNotificationsRead()
                          .then(() => listNotifications())
                          .then((r) => setNotifications(r.items))
                          .catch(() => {});
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
                    {notifications.length === 0 ? (
                      <li className="rounded-xl p-4 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">No notifications yet.</li>
                    ) : (
                      notifications.map((n) => (
                        <li
                          key={n.id}
                          className={
                            "rounded-xl p-3 " + (n.read ? "hover:bg-gray-50 dark:bg-gray-950" : "bg-indigo-50/50")
                          }
                        >
                          <p className="font-semibold text-gray-900 dark:text-gray-50">{n.title}</p>
                          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">{n.body}</p>
                          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{formatRelativeTime(n.created_at)}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="relative hidden sm:block" ref={settingsWrap}>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-400"
                aria-label="Quick settings"
                aria-expanded={settingsOpen}
                onClick={() => {
                  setSettingsOpen((v) => !v);
                  setNotifOpen(false);
                  setUserOpen(false);
                }}
              >
                {icon("settings_input_component")}
              </button>
              {settingsOpen && (
                <div
                  className="absolute end-0 top-full z-[70] mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
                  role="region"
                  aria-label="Quick settings"
                >
                  <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-50">Quick settings</h3>
                  <label className="flex cursor-pointer items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Compact table rows</span>
                    <input
                      type="checkbox"
                      checked={compactTable}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setCompactTable(v);
                        try {
                          localStorage.setItem("ethereal_compact_table", v ? "1" : "0");
                        } catch {
                          /* ignore */
                        }
                        updatePreferences(v).catch(() => {});
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-600"
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    Synced to the studio API (falls back to this device if offline).
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-2 border-s border-gray-200 dark:border-gray-800 ps-2 sm:gap-3 sm:ps-4" ref={userWrap}>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg px-1 text-end outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-expanded={userOpen}
              aria-haspopup="menu"
              onClick={() => {
                setUserOpen((v) => !v);
                setNotifOpen(false);
                setSettingsOpen(false);
              }}
            >
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{profileName}</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 dark:text-gray-500">Social Geni</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {(profileName.trim().slice(0, 2) || "AI").toUpperCase()}
              </div>
            </button>
            {userOpen && (
              <div
                className="absolute end-0 top-full z-[70] mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2 shadow-sm"
                role="menu"
                aria-label="Account menu"
              >
                <Link
                  to="/admin/analytics"
                  role="menuitem"
                  className="block px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-950 hover:text-gray-900 dark:text-gray-50"
                  onClick={() => setUserOpen(false)}
                >
                  Admin analytics
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <CompactTableProvider value={compactTable}>
        <main className="min-h-screen px-4 pb-12 pt-20 sm:px-6 md:ms-64 md:px-10 md:pt-24">
          {demoBanner}
          {children}
        </main>
      </CompactTableProvider>
    </div>
  );
}
