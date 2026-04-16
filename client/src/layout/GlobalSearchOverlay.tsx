import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { KitSummary } from "../types";
import { briefBrand, briefIndustry, filterKitsByQuery } from "../kitSearchUtils";
import { useRecentSearches } from "./hooks/useRecentSearches";

export default function GlobalSearchOverlay({
  open,
  onClose,
  kits,
  query,
  onQueryChange,
}: {
  open: boolean;
  onClose: () => void;
  kits: KitSummary[] | null;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = kits ? filterKitsByQuery(kits, query) : [];
  const { recent, pushRecent } = useRecentSearches();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-gray-900/40 px-4 pb-12 pt-24 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Search kits"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-4xl flex-col gap-4" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-2xl">
          <div className="flex h-14 items-center gap-4 px-4">
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">search</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full rounded-xl border-none bg-transparent text-xl font-medium text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:text-gray-500 focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
              placeholder="Search kits, brands, or status…"
              aria-label="Search query"
            />
            <kbd className="hidden items-center justify-center rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-2 py-1 text-[10px] font-bold tracking-widest text-gray-500 dark:text-gray-400 dark:text-gray-500 md:flex">
              ESC
            </kbd>
          </div>
        </div>

        <div className="mb-12 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="space-y-8 border-gray-100 dark:border-gray-800 p-8 lg:col-span-4 lg:border-e lg:bg-gray-50 dark:bg-gray-950">
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400 dark:text-gray-500">Recent searches</h3>
                <div className="space-y-2">
                  {recent.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">No recent searches yet.</p>
                  ) : (
                    recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onQueryChange(r)}
                        className="group flex w-full items-center gap-3 rounded-xl p-3 text-start transition-all hover:bg-white dark:bg-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:text-indigo-400">history</span>
                        <span className="text-sm font-medium text-gray-700">{r}</span>
                      </button>
                    ))
                  )}
                </div>
              </section>
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400 dark:text-gray-500">Quick filters</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onQueryChange("done")}
                    className="cursor-pointer rounded-full border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => onQueryChange("run")}
                    className="cursor-pointer rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-all hover:border-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    Running
                  </button>
                </div>
              </section>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 lg:col-span-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50">
                  Results{" "}
                  <span className="ml-2 font-normal text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    ({kits ? filtered.length : "…"})
                  </span>
                </h3>
              </div>

              {!kits && (
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Loading kits…</p>
              )}

              {kits && filtered.length === 0 && query.trim() && (
                <div className="flex flex-col items-center py-12 text-center">
                  <span className="material-symbols-outlined mb-4 text-4xl text-gray-300">search_off</span>
                  <h3 className="mb-2 text-xl font-extrabold text-gray-900 dark:text-gray-50">No kits found</h3>
                  <p className="mb-6 max-w-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Try another brand name, id, or status keyword.</p>
                  <button
                    type="button"
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={() => onQueryChange("")}
                  >
                    Clear search
                  </button>
                </div>
              )}

              {kits && filtered.length > 0 && (
                <div className="space-y-4">
                  {filtered.slice(0, 12).map((k) => {
                    const brand = briefBrand(k.brief_json) || k.id;
                    const ind = briefIndustry(k.brief_json);
                    const dt = new Date(k.created_at);
                    return (
                      <Link
                        key={k.id}
                        to={"/kits/" + k.id}
                        onClick={() => {
                          pushRecent(query || brand);
                          onClose();
                        }}
                        className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
                        </div>
                        <div className="flex-1">
                          <div className="mb-0.5 flex items-center justify-between">
                            <span className="font-bold text-gray-900 dark:text-gray-50">{brand}</span>
                            <span className="rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              {k.status_badge}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            <span>{ind}</span>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                            <span dir="ltr">{k.id.slice(0, 8)}…</span>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                            <span>{dt.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-indigo-600 dark:text-indigo-400">
                          arrow_forward_ios
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {kits && query.trim() && filtered.length > 0 && (
                <button
                  type="button"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 transition-all hover:bg-white dark:bg-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500"
                  onClick={() => pushRecent(query)}
                >
                  Save “{query.trim()}” to recent
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-8 py-3">
            <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              <kbd className="rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-1.5 py-0.5 shadow-sm">esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
