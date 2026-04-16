import { useMemo, useState } from "react";
import { getAdminUserPlans, updateAdminUserPlan, type AdminPlanSubscription } from "../api";

const planOptions = [
  { value: "free", label: "Free" },
  { value: "creator_pro", label: "Creator Pro" },
  { value: "agency", label: "Agency" },
] as const;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
] as const;

function fmtDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function AdminPlansPage() {
  const [apiSecret, setApiSecret] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<{
    user: { id: string; supabase_user_id: string; email: string; display_name: string };
    subscriptions: AdminPlanSubscription[];
  } | null>(null);

  const [planCode, setPlanCode] = useState<"free" | "creator_pro" | "agency">("free");
  const [planStatus, setPlanStatus] = useState<"active" | "trialing" | "cancelled" | "expired">("active");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const latest = useMemo(() => snapshot?.subscriptions[0] ?? null, [snapshot]);

  const loadPlans = async () => {
    if (!apiSecret.trim() || !userId.trim()) {
      setMessage("API secret and user id are required.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await getAdminUserPlans(userId.trim(), apiSecret.trim());
      setSnapshot(data);
      if (data.subscriptions[0]) {
        const current = data.subscriptions[0];
        setPlanCode(current.plan_code);
        setPlanStatus(current.status);
        setPeriodStart(current.period_start.slice(0, 16));
        setPeriodEnd(current.period_end ? current.period_end.slice(0, 16) : "");
      }
    } catch (e) {
      setSnapshot(null);
      setMessage(e instanceof Error ? e.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async () => {
    if (!apiSecret.trim() || !userId.trim()) {
      setMessage("API secret and user id are required.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateAdminUserPlan(userId.trim(), apiSecret.trim(), {
        plan_code: planCode,
        status: planStatus,
        period_start: periodStart ? new Date(periodStart).toISOString() : undefined,
        period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
      });
      setMessage("Plan updated successfully.");
      await loadPlans();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  const applyQuickPlan = async (nextPlan: "creator_pro" | "agency") => {
    setPlanCode(nextPlan);
    setPlanStatus("active");
    setPeriodStart("");
    setPeriodEnd("");
    if (!apiSecret.trim() || !userId.trim()) {
      setMessage("API secret and user id are required.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateAdminUserPlan(userId.trim(), apiSecret.trim(), {
        plan_code: nextPlan,
        status: "active",
      });
      setMessage(`Quick upgrade applied: ${nextPlan}.`);
      await loadPlans();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to apply quick upgrade.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">Plan Management</h1>
        <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-400 dark:text-gray-500">
          Simple admin tool to view and update a user's subscription plan using the existing backend admin endpoint.
        </p>
      </header>

      {message && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 shadow-sm">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-50">Lookup user</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
            API Secret
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              placeholder="API_SECRET"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
            User ID
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              placeholder="internal user id"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void loadPlans()}
              disabled={loading}
              className="h-[40px] w-full rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:hover:bg-indigo-600"
            >
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Security note: API secret is kept in session memory only and is never stored in localStorage.
        </p>
      </div>

      {snapshot && (
        <>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-50">User</h2>
            <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              <p><strong className="text-gray-900 dark:text-gray-50">ID:</strong> {snapshot.user.id}</p>
              <p><strong className="text-gray-900 dark:text-gray-50">Supabase ID:</strong> {snapshot.user.supabase_user_id}</p>
              <p><strong className="text-gray-900 dark:text-gray-50">Email:</strong> {snapshot.user.email || "—"}</p>
              <p><strong className="text-gray-900 dark:text-gray-50">Name:</strong> {snapshot.user.display_name || "—"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-50">Update plan</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Plan
                <select
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value as typeof planCode)}
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {planOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Status
                <select
                  value={planStatus}
                  onChange={(e) => setPlanStatus(e.target.value as typeof planStatus)}
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Period start (optional)
                <input
                  type="datetime-local"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Period end (optional)
                <input
                  type="datetime-local"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void applyPlan()}
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Apply plan"}
              </button>
              {latest && (
                <p className="flex items-center text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  Current latest:&nbsp;<strong className="text-gray-900 dark:text-gray-50">{latest.plan_code}</strong>&nbsp;/&nbsp;<strong className="text-gray-900 dark:text-gray-50">{latest.status}</strong>
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 dark:border-gray-800 pt-6">
              <button
                type="button"
                onClick={() => void applyQuickPlan("creator_pro")}
                disabled={saving}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:bg-gray-950 disabled:opacity-60"
              >
                Quick Upgrade → Creator Pro
              </button>
              <button
                type="button"
                onClick={() => void applyQuickPlan("agency")}
                disabled={saving}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:bg-gray-950 disabled:opacity-60"
              >
                Quick Upgrade → Agency
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-50">History</h2>
            {snapshot.subscriptions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">No subscriptions found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Start</th>
                      <th className="px-4 py-3">End</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {snapshot.subscriptions.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:bg-gray-950">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-50">{s.plan_code}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{s.status}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{fmtDate(s.period_start)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{fmtDate(s.period_end)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">{fmtDate(s.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
