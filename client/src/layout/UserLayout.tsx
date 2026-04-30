import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Skeleton } from "../components/Skeleton";

type NavItem = { to: string; label: string; icon: string; end?: boolean };

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview | نظرة عامة", icon: "dashboard", end: true },
  { to: "/my-brands", label: "My Brands | علاماتي التجارية", icon: "storefront" },
  { to: "/wizard/social", label: "Request Content | طلب محتوى جديد", icon: "edit_square" },
  { to: "/pricing", label: "Pricing | باقات الأسعار", icon: "sell" },
];

function navLinkClass(isActive: boolean) {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
    isActive
      ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-black"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
  ].join(" ");
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1" aria-label="Client portal navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function UserLayout({ demoBanner }: { demoBanner?: ReactNode }) {
  const { entitlements, session, signInWithGoogle, signOut, ready } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const initials = useMemo(() => (session?.user?.email || "US").slice(0, 2).toUpperCase(), [session?.user?.email]);

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

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="mx-auto flex max-w-[80rem] gap-4 px-4 py-4 sm:px-6">
          <Skeleton className="hidden h-[85vh] w-72 rounded-3xl lg:block" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-[72vh] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white dark:focus:bg-white dark:focus:text-black"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-[88rem] gap-4 px-3 py-3 sm:px-6">
        <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-80 shrink-0 flex-col rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0f0f10] lg:flex">
          <Link to="/" className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-black">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
            <div>
              <p className="text-base font-semibold leading-tight">SocialGeni Client Portal</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Agency Experience</p>
            </div>
          </Link>

          <SidebarNav />

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-black/40">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Plan</p>
            <p className="mt-1 text-sm font-semibold">{entitlements?.plan_code ?? "starter"}</p>
          </div>

          <div className="mt-auto space-y-3 pt-6">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  {themeMode === "dark" ? "light_mode" : "dark_mode"}
                </span>
                Theme
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{themeMode === "dark" ? "Dark" : "Light"}</span>
            </button>

            {session ? (
              <div className="rounded-2xl border border-gray-200 p-3 dark:border-white/10">
                <p className="truncate text-sm font-semibold">{session.user?.email ?? "Studio user"}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link to="/profile" className="rounded-lg bg-gray-100 px-2 py-1.5 text-xs text-center dark:bg-white/10">
                    Profile
                  </Link>
                  <Link to="/help" className="rounded-lg bg-gray-100 px-2 py-1.5 text-xs text-center dark:bg-white/10">
                    Help
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="w-full rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-3 z-30 mb-4 flex h-14 items-center justify-between rounded-2xl border border-gray-200/80 bg-white/90 px-4 backdrop-blur dark:border-white/10 dark:bg-[#0f0f10]/90 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/15"
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <p className="text-sm font-semibold">Client Portal</p>
            {session ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold dark:bg-white/10">
                {initials}
              </div>
            ) : (
              <button type="button" onClick={() => void signInWithGoogle()} className="text-xs font-semibold">
                Sign in
              </button>
            )}
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute inset-0 bg-black/50"
                aria-label="Close navigation menu"
              />
              <div className="absolute left-0 top-0 h-full w-[85%] max-w-xs border-r border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#0f0f10]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold">Navigation</p>
                  <button type="button" onClick={() => setMobileOpen(false)} className="rounded p-1">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          ) : null}

          <main id="main-content" className="rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0f0f10] sm:p-6">
            {demoBanner}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
