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
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xl font-bold text-gray-900 dark:text-white shadow-sm">
            {(displayName.trim().slice(0, 2) || "AI").toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Account</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your profile and studio preferences.</p>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Dashboard
        </Link>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
           <span className="material-symbols-outlined text-[18px]">check_circle</span>
           {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 shadow-sm">
          <div className="mb-8 border-b border-gray-100 dark:border-white/5 pb-4">
             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile details</h2>
             <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your basic information.</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Display name
              </label>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0c0e] transition-colors focus-within:border-gray-900 dark:focus-within:border-white/30">
                <input
                  type="text"
                  value={displayName}
                  disabled={loading}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full border-none bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Email Address
              </label>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0c0e] transition-colors focus-within:border-gray-900 dark:focus-within:border-white/30">
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full border-none bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
               <button
                 type="button"
                 disabled={loading || saving}
                 className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 px-6 py-2.5 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-[#111] disabled:opacity-50"
                 onClick={() => {
                   setSaving(true);
                   setMessage(null);
                   updateProfile({ display_name: displayName, email })
                     .then((p) => {
                       setDisplayName(p.display_name);
                       setEmail(p.email);
                       setMessage("Profile updated successfully.");
                     })
                     .catch(() => setMessage("Failed to update profile."))
                     .finally(() => setSaving(false));
                 }}
               >
                 {saving ? "Saving..." : "Save Changes"}
               </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 shadow-sm h-fit">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Quick Links</h2>
          <nav className="flex flex-col gap-2">
            <Link to="/help" className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white">
              <span className="material-symbols-outlined text-[18px]">help</span>
              Help & Support
            </Link>
            <Link to="/integrations" className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              Integrations
            </Link>
            <Link to="/brand-voice" className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white">
              <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
              Brand Voice
            </Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
