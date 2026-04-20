import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginAgencyAdmin } from "../api";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const target = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/admin";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginAgencyAdmin(username.trim(), password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sign in with your agency admin credentials.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Username</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/20"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
