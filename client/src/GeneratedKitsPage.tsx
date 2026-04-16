import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listKits } from "./api";
import type { KitSummary } from "./types";
import { useCompactTable } from "./layout/compactTableContext";
import { briefBrand, briefIndustry } from "./kitSearchUtils";
import { statusKind } from "./kitUiFormatters";

function initials(name: string, id: string): string {
  const s = name.trim() || id;
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return s.slice(0, 2).toUpperCase() || "—";
}

export default function GeneratedKitsPage({ adminMode = false }: { adminMode?: boolean }) {
  const compactTable = useCompactTable();
  const [kits, setKits] = useState<KitSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const thPad = compactTable ? "px-3 py-2 sm:px-6" : "px-4 py-3 sm:px-8 sm:py-4";
  const tdPad = compactTable ? "px-3 py-2.5 sm:px-6 sm:py-3" : "px-4 py-4 sm:px-8 sm:py-6";
  const avSize = compactTable ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-sm";

  useEffect(() => {
    listKits(adminMode)
      .then(setKits)
      .catch((e) => setErr(String(e)));
  }, [adminMode]);

  const latestKits = useMemo(() => (kits?.length ? kits.slice(0, 5) : []), [kits]);
  const kitDetailsBase = adminMode ? "/admin/kits/" : "/kits/";

  return (
    <>
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10 sm:gap-6">
        <div>
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl md:text-5xl">
            Generated kits
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 dark:text-gray-500 sm:text-lg">Browse and open your previously generated content kits.</p>
        </div>
        <Link
          to="/wizard"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:scale-[1.02] hover:bg-indigo-700 sm:w-auto sm:px-6 sm:text-sm"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New kit
        </Link>
      </section>

      {latestKits.length > 0 && (
        <section className="mb-12" aria-labelledby="latest-kits-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h3 id="latest-kits-heading" className="text-xl font-bold text-gray-900 dark:text-gray-50">
              Latest kits
            </h3>
          </div>
          <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {latestKits.map((k) => {
              const brand = briefBrand(k.brief_json);
              const ind = briefIndustry(k.brief_json);
              const ini = initials(brand, k.id);
              const dt = new Date(k.created_at);
              return (
                <li key={k.id}>
                  <Link
                    to={kitDetailsBase + k.id}
                    className="flex h-full flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {ini}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900 dark:text-gray-50">{brand || "Kit"}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{ind}</p>
                      </div>
                    </div>
                    <p className="mt-auto text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {dt.toLocaleDateString()} · {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-4 sm:px-8 sm:py-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 sm:text-xl">All generated kits</h3>
        </div>
        <div className="overflow-x-auto">
          {err && (
            <p className="px-4 py-6 text-red-500 sm:px-8" role="alert">
              {err}
            </p>
          )}
          {!kits && !err && <p className="px-4 py-6 text-gray-500 dark:text-gray-400 dark:text-gray-500 sm:px-8">Loading…</p>}
          {kits && kits.length === 0 && !err && (
            <p className="px-4 py-10 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 sm:px-8">No kits yet. Start from the wizard.</p>
          )}
          {kits && kits.length > 0 && (
            <table className="w-full border-collapse text-start">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs font-extrabold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400 dark:text-gray-500 bg-gray-50/50">
                  <th className={thPad + " text-start"}>Brand</th>
                  <th className={thPad + " text-start"}>Industry</th>
                  <th className={thPad + " text-start"}>Date</th>
                  <th className={thPad + " text-start"}>Status</th>
                  <th className={thPad + " text-end"}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kits.map((k) => {
                  const brand = briefBrand(k.brief_json);
                  const ind = briefIndustry(k.brief_json);
                  const ini = initials(brand, k.id);
                  const sk = statusKind(k.status_badge);
                  const dt = new Date(k.created_at);
                  return (
                    <tr key={k.id} className="transition-colors hover:bg-gray-50 dark:bg-gray-950">
                      <td className={tdPad + " text-sm"}>
                        <div className={"flex items-center " + (compactTable ? "gap-3" : "gap-4")}>
                          <div
                            className={
                              "flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 " +
                              avSize
                            }
                          >
                            <span className="font-bold">{ini}</span>
                          </div>
                          <div>
                            <p className={(compactTable ? "text-xs" : "text-sm") + " font-bold text-gray-900 dark:text-gray-50"}>
                              {brand || k.id}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500" dir="ltr">
                              {k.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={tdPad + " text-sm"}>
                        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-50">{ind}</span>
                      </td>
                      <td className={tdPad + " text-sm"}>
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-gray-50">{dt.toLocaleDateString()}</p>
                          {!compactTable && <p className="mt-0.5 text-gray-500 dark:text-gray-400 dark:text-gray-500">{dt.toLocaleTimeString()}</p>}
                        </div>
                      </td>
                      <td className={tdPad + " text-sm"}>
                        {sk === "done" && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
                            <span className="h-1 w-1 rounded-full bg-green-500" />
                            {k.status_badge}
                          </span>
                        )}
                        {sk === "running" && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-700">
                            <span className="h-1 w-1 animate-pulse rounded-full bg-yellow-500" />
                            {k.status_badge}
                          </span>
                        )}
                        {sk === "failed" && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
                            <span className="h-1 w-1 rounded-full bg-red-500" />
                            {k.status_badge}
                          </span>
                        )}
                      </td>
                      <td className={tdPad + " text-end"}>
                        <Link
                          to={kitDetailsBase + k.id}
                          className={
                            "rounded-lg bg-indigo-50 dark:bg-indigo-900/30 font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 transition-all hover:bg-indigo-600 hover:text-white " +
                            (compactTable ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm")
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
    </>
  );
}
