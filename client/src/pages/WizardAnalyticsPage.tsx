import { useMemo, useState } from "react";
import {
  clearWizardAnalyticsBuffer,
  readWizardAnalyticsBuffer,
  summarizeWizardEvents,
} from "../lib/wizardAnalyticsQuery";

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-gray-50">{value}</p>
    </div>
  );
}

export default function WizardAnalyticsPage() {
  const [tick, setTick] = useState(0);
  const events = useMemo(() => readWizardAnalyticsBuffer(), [tick]);
  const summary = useMemo(() => summarizeWizardEvents(events), [events]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 sm:px-4">
      <header className="rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Wizard KPI Dashboard v1</p>
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-50">Funnel snapshot (local buffer)</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
          Source: <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded text-gray-800 border border-gray-200 dark:border-gray-800">wizard:analytics</code> local buffer. Use this to detect drop-off and validate conversion changes quickly.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-50 shadow-sm transition hover:bg-gray-50 dark:bg-gray-950"
            onClick={() => setTick((v) => v + 1)}
          >
            Refresh
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
            onClick={() => {
              clearWizardAnalyticsBuffer();
              setTick((v) => v + 1);
            }}
          >
            Clear buffer
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total events" value={String(summary.totalEvents)} />
        <Card label="Wizard starts" value={String(summary.started)} />
        <Card label="Diagnosis completed" value={String(summary.diagnosisCompleted)} />
        <Card label="Generate clicks" value={String(summary.generateClicks)} />
        <Card label="Successful kits" value={String(summary.success)} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card label="Start → Generate rate" value={`${summary.startToGenerateRate.toFixed(1)}%`} />
        <Card label="Generate success rate" value={`${summary.generateSuccessRate.toFixed(1)}%`} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card label="Diagnosis → Generate rate" value={`${summary.diagnosisToGenerateRate.toFixed(1)}%`} />
        <Card label="Avg TTFPV" value={`${Math.round(summary.avgTimeToFirstPerceivedValueMs)} ms`} />
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Events by wizard type</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="social" value={String(summary.byWizardType.social)} />
          <Card label="offer" value={String(summary.byWizardType.offer)} />
          <Card label="deep" value={String(summary.byWizardType.deep)} />
          <Card label="unknown" value={String(summary.byWizardType.unknown)} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">A/B split visibility</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card label="Variant A events" value={String(summary.byVariant.A)} />
          <Card label="Variant B events" value={String(summary.byVariant.B)} />
          <Card label="Unknown variant events" value={String(summary.byVariant.unknown)} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Step performance</h2>
        {summary.byStep.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">No step data yet. Run the wizard flow first.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  <th className="px-4 py-3">Step</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Next</th>
                  <th className="px-4 py-3">Validation fails</th>
                  <th className="px-4 py-3">Advance rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.byStep.map((s) => (
                  <tr key={s.stepId} className="hover:bg-gray-50 dark:bg-gray-950 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-50">{s.stepId}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{s.stepViews}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{s.nextClicks}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{s.validationFails}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{s.advanceRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
