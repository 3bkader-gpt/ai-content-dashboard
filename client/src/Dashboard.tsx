import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listKits } from "./api";
import type { KitSummary } from "./types";
import { useCompactTable } from "./layout/compactTableContext";
import { useToast } from "./useToast";
import PrimaryFlowBanner from "./components/PrimaryFlowBanner";

function briefBrand(json: string): string {
  try {
    const o = JSON.parse(json) as { brand_name?: string };
    return o.brand_name ?? "";
  } catch {
    return "";
  }
}

function briefIndustry(json: string): string {
  try {
    const o = JSON.parse(json) as { industry?: string };
    return o.industry ?? "—";
  } catch {
    return "—";
  }
}

function initials(name: string, id: string): string {
  const s = name.trim() || id;
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return s.slice(0, 2).toUpperCase() || "—";
}

function statusKind(badge: string): "done" | "running" | "failed" {
  const b = badge.toLowerCase();
  if (b.includes("fail")) return "failed";
  if (b.includes("run")) return "running";
  return "done";
}

export default function Dashboard() {
  const compactTable = useCompactTable();
  const [kits, setKits] = useState<KitSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { toasts, push } = useToast();
  const thPad = compactTable ? "px-6 py-2" : "px-8 py-4";
  const tdPad = compactTable ? "px-6 py-3" : "px-8 py-6";
  const avSize = compactTable ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-sm";

  useEffect(() => {
    listKits()
      .then(setKits)
      .catch((e) => {
        setErr(String(e));
        push("Could not load the list", "error");
      });
  }, [push]);

  const stats = useMemo(() => {
    if (!kits?.length) {
      return {
        total: 0,
        successRate: 0,
        modelCount: 0,
        done: 0,
        barPct: 0,
      };
    }
    const done = kits.filter((k) => statusKind(k.status_badge) === "done").length;
    const rate = Math.round((done / kits.length) * 1000) / 10;
    const models = new Set(kits.map((k) => k.model_used).filter(Boolean)).size;
    const barPct = Math.min(100, Math.max(8, (kits.length % 17) + 35));
    return {
      total: kits.length,
      successRate: rate,
      modelCount: models,
      done,
      barPct,
    };
  }, [kits]);

  const latestKits = useMemo(() => (kits?.length ? kits.slice(0, 5) : []), [kits]);

  return (
    <>
      <div className="toast-host fixed bottom-4 end-4 z-[100] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-outline/30 bg-surface-container-high px-4 py-2 text-sm text-on-surface shadow-lg"
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>

      <section className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="headline mb-2 text-4xl font-extrabold tracking-tight text-on-surface">Dashboard</h2>
          <p className="text-lg text-on-surface-variant">Open past kits quickly, or start a new campaign from the wizard.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-outline/25 bg-surface-container-high px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-tertiary shadow-[0_0_8px_rgb(var(--c-tertiary)/0.55)]" />
            <span className="font-manrope text-sm font-semibold tracking-tight">Records: {kits?.length ?? "…"}</span>
          </div>
        </div>
      </section>

      <section className="mb-10 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-surface-container-low to-secondary/10 p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Start here</p>
            <h3 className="headline mt-2 text-2xl font-extrabold text-on-surface md:text-3xl">New campaign</h3>
            <p className="mt-2 text-on-surface-variant">
              Pick a flow — social, offer, or deep content — then generate your kit in minutes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/wizard/social"
                className="rounded-full border border-outline/30 bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest"
              >
                Social
              </Link>
              <Link
                to="/wizard/offer"
                className="rounded-full border border-outline/30 bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest"
              >
                Offer
              </Link>
              <Link
                to="/wizard/deep"
                className="rounded-full border border-outline/30 bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest"
              >
                Deep
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/wizard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-container px-8 py-4 font-headline text-sm font-bold uppercase tracking-widest text-on-primary-container shadow-lg shadow-primary/25 transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
              Start new campaign
            </Link>
          </div>
        </div>
      </section>

      <PrimaryFlowBanner className="mb-8" />

      {latestKits.length > 0 && (
        <section className="mb-12" aria-labelledby="latest-kits-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h3 id="latest-kits-heading" className="font-headline text-xl font-bold text-on-surface">
              Latest kits
            </h3>
            <Link
              to="/wizard"
              className="text-xs font-bold uppercase tracking-widest text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/45"
            >
              New kit
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {latestKits.map((k) => {
              const brand = briefBrand(k.brief_json);
              const ind = briefIndustry(k.brief_json);
              const ini = initials(brand, k.id);
              const dt = new Date(k.created_at);
              return (
                <li key={k.id}>
                  <Link
                    to={"/kits/" + k.id}
                    className="flex h-full flex-col rounded-2xl border border-outline/25 bg-surface-container-low p-4 transition hover:border-primary/35 hover:bg-surface-container-high/50 focus-visible:ring-2 focus-visible:ring-primary/45"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-tertiary/35 bg-gradient-to-br from-tertiary/30 to-tertiary/10 text-xs font-bold">
                        {ini}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-on-surface">{brand || "Kit"}</p>
                        <p className="truncate text-xs text-on-surface-variant">{ind}</p>
                      </div>
                    </div>
                    <p className="mt-auto text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                      {dt.toLocaleDateString()} · {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-8 transition-transform duration-500 hover:scale-[1.01]">
          <div className="absolute -end-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-primary/10 p-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  inventory_2
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-tertiary">Total</span>
            </div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Kit count</p>
            <h3 className="headline text-5xl font-extrabold tracking-tighter text-on-surface">{stats.total}</h3>
            <div className="mt-6 flex h-12 items-end gap-1">
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-primary/20">
                <div
                  className="absolute inset-y-0 start-0 bg-primary shadow-[0_0_15px_rgb(var(--c-primary)/0.55)]"
                  style={{ width: `${stats.barPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-8 transition-transform duration-500 hover:scale-[1.01]">
          <div className="absolute -end-16 -top-16 h-32 w-32 rounded-full bg-tertiary/5 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-tertiary/10 p-3">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-tertiary">Complete</span>
            </div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Success rate</p>
            <h3 className="headline text-5xl font-extrabold tracking-tighter text-on-surface">
              {kits?.length ? `${stats.successRate}%` : "—"}
            </h3>
            <p className="mt-4 text-xs text-on-surface-variant">
              Delivered successfully: {stats.done} of {stats.total || 0}
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-8 transition-transform duration-500 hover:scale-[1.01]">
          <div className="absolute -end-16 -top-16 h-32 w-32 rounded-full bg-secondary/5 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-secondary/10 p-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bolt
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Models</span>
            </div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Model diversity</p>
            <h3 className="headline text-5xl font-extrabold tracking-tighter text-on-surface">{stats.modelCount || "—"}</h3>
            <p className="mt-4 text-xs text-on-surface-variant">Distinct `model_used` values in your records</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-outline/20 bg-surface-container-low p-1">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-high/30 px-8 py-6">
          <h3 className="font-manrope text-xl font-bold">Recent activity</h3>
          <div className="flex gap-2">
            <Link
              to="/wizard"
            className="rounded-xl bg-surface-container-highest px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              + New kit
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          {err && (
            <p className="px-8 py-6 text-error" role="alert">
              {err}
            </p>
          )}
          {!kits && !err && <p className="px-8 py-6 text-on-surface-variant">Loading…</p>}
          {kits && kits.length === 0 && !err && (
            <div className="px-8 py-10">
              <div className="rounded-2xl border border-primary/25 bg-primary/10 p-6">
                <h4 className="headline text-xl font-bold text-on-surface">Welcome, let&apos;s create your first kit</h4>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Start from the wizard, answer a short guided flow, then your plan appears مباشرة في صفحة الكيت.
                </p>
                <Link
                  to="/wizard"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-primary"
                >
                  Create your first kit
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>
          )}
          {kits && kits.length > 0 && (
            <table className="w-full border-collapse text-start">
              <thead>
                <tr className="border-b border-outline/25 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  <th className={thPad}>Brand</th>
                  <th className={thPad}>Industry</th>
                  <th className={thPad}>Date</th>
                  <th className={thPad}>Status</th>
                  <th className={thPad + " text-end"}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20">
                {kits.map((k) => {
                  const brand = briefBrand(k.brief_json);
                  const ind = briefIndustry(k.brief_json);
                  const ini = initials(brand, k.id);
                  const sk = statusKind(k.status_badge);
                  const dt = new Date(k.created_at);
                  return (
                    <tr key={k.id} className="transition-colors hover:bg-surface-container-high/35">
                      <td className={tdPad}>
                        <div className={"flex items-center " + (compactTable ? "gap-3" : "gap-4")}>
                          <div
                            className={
                              "flex items-center justify-center rounded-lg border border-tertiary/35 bg-gradient-to-br from-tertiary/30 to-tertiary/10 " +
                              avSize
                            }
                          >
                            <span className="font-bold text-on-surface">{ini}</span>
                          </div>
                          <div>
                            <p className={(compactTable ? "text-xs" : "text-sm") + " font-bold text-on-surface"}>
                              {brand || k.id}
                            </p>
                            <p className="text-xs text-on-surface-variant" dir="ltr">
                              {k.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={tdPad}>
                        <span className="block text-xs font-medium text-on-surface">{ind}</span>
                      </td>
                      <td className={tdPad}>
                        <div className="text-xs">
                          <p className="text-on-surface">{dt.toLocaleDateString()}</p>
                          {!compactTable && (
                            <p className="mt-0.5 text-on-surface-variant">{dt.toLocaleTimeString()}</p>
                          )}
                        </div>
                      </td>
                      <td className={tdPad}>
                        {sk === "done" && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-tertiary-container/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-tertiary-fixed">
                            <span className="h-1 w-1 rounded-full bg-tertiary" />
                            {k.status_badge}
                          </span>
                        )}
                        {sk === "running" && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            <span className="h-1 w-1 animate-pulse rounded-full bg-on-surface-variant" />
                            {k.status_badge}
                          </span>
                        )}
                        {sk === "failed" && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-error-container/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-error">
                            <span className="h-1 w-1 rounded-full bg-error" />
                            {k.status_badge}
                          </span>
                        )}
                      </td>
                      <td className={tdPad + " text-end"}>
                        <Link
                          to={"/kits/" + k.id}
                          className={
                            "rounded-lg bg-primary/10 font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-on-primary focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface " +
                            (compactTable ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs")
                          }
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-8">
        <div className="group relative rounded-3xl border border-primary-container/10 bg-gradient-to-br from-primary-container/20 to-transparent p-10">
          <div className="absolute end-10 top-10 opacity-10 transition-opacity group-hover:opacity-20">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_fix_high
            </span>
          </div>
          <h4 className="headline mb-4 text-2xl font-bold">Start from the wizard</h4>
          <p className="mb-6 max-w-2xl text-on-surface-variant">
            Enter brand details, choose the right wizard path, and generate your full content plan from one clear flow.
          </p>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 rounded-lg px-1 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:gap-4 focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Open wizard
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      <div className="fixed bottom-10 end-10 z-50">
        <Link
          to="/wizard"
          className="flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-4 font-headline font-bold text-on-primary-container shadow-[0_15px_30px_rgb(var(--c-primary)/0.35)] transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
