import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateProfile } from "../api";

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setDisplayName(p.display_name);
        setEmail(p.email);
        setMessage(null);
      })
      .catch(() => setMessage("Could not load profile from API."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {(displayName.trim().slice(0, 2) || "AI").toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">Account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Studio profile · stored on the API</p>
          </div>
        </div>
        <Link
          to="/"
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 dark:text-gray-500 shadow-sm transition hover:bg-gray-50 dark:bg-gray-950"
        >
          Back to dashboard
        </Link>
      </div>

      {message && (
        <p className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 shadow-sm">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-gray-50">Profile details</h2>
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Display name
              <input
                type="text"
                value={displayName}
                disabled={loading}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Email
              <input
                type="email"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              disabled={loading || saving}
              className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              onClick={() => {
                setSaving(true);
                setMessage(null);
                updateProfile({ display_name: displayName, email })
                  .then((p) => {
                    setDisplayName(p.display_name);
                    setEmail(p.email);
                    setMessage("Saved.");
                  })
                  .catch(() => setMessage("Save failed. Please verify API availability."))
                  .finally(() => setSaving(false));
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Shortcuts</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/help" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline">
                Help & support
              </Link>
            </li>
            <li>
              <Link to="/integrations" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline">
                Integrations
              </Link>
            </li>
            <li>
              <Link to="/brand-voice" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline">
                Brand voice
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
