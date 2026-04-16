import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listKits } from "./api";
import type { KitSummary } from "./types";
import { useToast } from "./useToast";
import { statusKind } from "./kitUiFormatters";
import { logger } from "./logger";

export default function Dashboard() {
  const [kits, setKits] = useState<KitSummary[] | null>(null);
  const { toasts, push } = useToast();

  useEffect(() => {
    listKits()
      .then(setKits)
      .catch((e) => {
        logger.error(e);
        push("Could not load the list", "error");
      });
  }, [push]);

  const stats = useMemo(() => {
    if (!kits?.length) {
      return {
        total: 0,
        successRate: 0,
        done: 0,
        barPct: 0,
      };
    }
    const done = kits.filter((k) => statusKind(k.status_badge) === "done").length;
    const rate = Math.round((done / kits.length) * 1000) / 10;
    const barPct = Math.min(100, Math.max(8, (kits.length % 17) + 35));
    return {
      total: kits.length,
      successRate: rate,
      done,
      barPct,
    };
  }, [kits]);

  return (
    <>
      <div className="toast-host fixed bottom-4 end-4 z-[100] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] px-4 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-xl"
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>

      <section className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 md:mb-14">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">Dashboard</h2>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Open past kits efficiently, or launch a new campaign pipeline.</p>
        </div>
        <div className="flex w-full sm:w-auto">
          <div className="flex items-center gap-2.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3.5 py-1.5 shadow-sm">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Total Kits: <strong className="text-gray-900 dark:text-white ml-0.5">{kits?.length ?? "—"}</strong></span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <section className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-sm p-6 sm:p-8">
          <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-[0.03] pointer-events-none">
            <span className="material-symbols-outlined text-[120px] -m-8">rocket_launch</span>
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 mb-4">
                <span className="material-symbols-outlined text-[12px] text-indigo-600 dark:text-indigo-400">bolt</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Start Here</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Create new campaign</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Launch a social, offer, or deep content generator flow to build your next kit in minutes.
              </p>
              
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/wizard/social" className="rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Social Flow</Link>
                <Link to="/wizard/offer" className="rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Offer Flow</Link>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/[0.05]">
              <Link
                to="/wizard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-black px-6 py-3.5 text-sm font-semibold shadow-sm hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
              >
                Launch Wizard
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <div className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-sm p-6 sm:p-8 flex-1">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-gray-100 dark:bg-white/5 p-2">
                    <span className="material-symbols-outlined text-[20px] text-gray-700 dark:text-gray-300">folder_open</span>
                  </div>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1">Kit Count</p>
                <h3 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{stats.total}</h3>
              </div>
              <div className="mt-6 flex h-2 items-end">
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="absolute inset-y-0 start-0 bg-gray-800 dark:bg-white/60 transition-all duration-1000"
                    style={{ width: `${stats.barPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-sm p-6 sm:p-8 flex-1">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-2">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400">check_circle</span>
                  </div>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-1">Success Rate</p>
                <h3 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {kits?.length ? `${stats.successRate}%` : "—"}
                </h3>
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-500">
                Delivered successfully: <span className="text-gray-700 dark:text-gray-300">{stats.done} of {stats.total || 0}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
