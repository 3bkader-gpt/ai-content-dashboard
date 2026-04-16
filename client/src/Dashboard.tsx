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
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50 shadow-sm"
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>

      <section className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-12 md:gap-6">
        <div>
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 md:text-4xl">Dashboard</h2>
          <p className="text-base text-gray-600 dark:text-gray-400 dark:text-gray-500 md:text-lg">Open past kits quickly, or start a new campaign from the wizard.</p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto sm:gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 shadow-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-50 dark:bg-indigo-900/300 shadow-[0_0_8px_rgba(99,102,241,0.55)]" />
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50">Records: {kits?.length ?? "…"}</span>
          </div>
        </div>
      </section>

      <section className="mb-10 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm sm:p-6 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Start here</p>
            <h3 className="mt-2 text-xl font-extrabold text-gray-900 dark:text-gray-50 sm:text-2xl md:text-3xl">New campaign</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-500">
              Pick a flow — social, offer, or deep content — then generate your kit in minutes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/wizard/social"
                className="rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:bg-gray-800"
              >
                Social
              </Link>
              <Link
                to="/wizard/offer"
                className="rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:bg-gray-800"
              >
                Offer
              </Link>
              <Link
                to="/wizard/deep"
                className="rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:bg-gray-800"
              >
                Deep
              </Link>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              to="/wizard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-indigo-700 hover:scale-[1.02] sm:w-auto sm:px-8 sm:py-4 sm:text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
              Start new campaign
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm transition-transform duration-500 hover:scale-[1.01]">
          <div className="absolute -end-16 -top-16 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 p-3">
                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                  inventory_2
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Total</span>
            </div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 dark:text-gray-500">Kit count</p>
            <h3 className="text-5xl font-extrabold tracking-tighter text-gray-900 dark:text-gray-50">{stats.total}</h3>
            <div className="mt-6 flex h-12 items-end gap-1">
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-indigo-100">
                <div
                  className="absolute inset-y-0 start-0 bg-indigo-50 dark:bg-indigo-900/300 shadow-[0_0_15px_rgba(99,102,241,0.55)]"
                  style={{ width: `${stats.barPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm transition-transform duration-500 hover:scale-[1.01]">
          <div className="absolute -end-16 -top-16 h-32 w-32 rounded-full bg-green-100 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-green-50 p-3">
                <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-green-600">Complete</span>
            </div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 dark:text-gray-500">Success rate</p>
            <h3 className="text-5xl font-extrabold tracking-tighter text-gray-900 dark:text-gray-50">
              {kits?.length ? `${stats.successRate}%` : "—"}
            </h3>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Delivered successfully: {stats.done} of {stats.total || 0}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-8">
        <div className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm md:p-10">
          <div className="absolute end-10 top-10 opacity-5 transition-opacity group-hover:opacity-10">
            <span className="material-symbols-outlined text-8xl text-indigo-600 dark:text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_fix_high
            </span>
          </div>
          <h4 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-50">Start from the wizard</h4>
          <p className="mb-6 max-w-2xl text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Enter brand details, choose the right wizard path, and generate your full content plan from one clear flow.
          </p>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 rounded-lg text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 transition-all hover:gap-4 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Open wizard
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      <div className="fixed bottom-4 end-4 z-50 sm:bottom-6 sm:end-6 md:bottom-10 md:end-10">
        <Link
          to="/wizard"
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 sm:gap-3 sm:px-6 sm:py-4 sm:text-base active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 700" }}>
            add
          </span>
          Create new kit
        </Link>
      </div>
    </>
  );
}
