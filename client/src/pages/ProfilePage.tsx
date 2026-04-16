import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { getProfile, updateProfile } from "../api";
import { Skeleton } from "../components/Skeleton";

export default function ProfilePage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setDisplayName(p.display_name);
        setEmail(p.email || session?.user?.email || "");
      })
      .catch(() => {
        setMessage({ tone: "error", text: "Failed to load profile settings." });
      })
      .finally(() => setLoading(false));
  }, [session]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({ display_name: displayName, email });
      setMessage({ tone: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ tone: "error", text: "Failed to save profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Account Profile</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your public identity and contact information.</p>
      </header>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.tone === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
              : "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={onSave} className="space-y-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="display_name" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Display Name
            </label>
            <input
              id="display_name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Contact Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black px-4 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              placeholder="your@email.com"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">This is where you'll receive your generated content kits.</p>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-8 py-3 text-sm font-bold text-white dark:text-black shadow-lg transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Authentication Provider</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your account is linked with Google via Supabase Auth.</p>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5">
           <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
           <div>
             <p className="text-sm font-bold text-gray-900 dark:text-white">{session?.user?.email}</p>
             <p className="text-[10px] uppercase tracking-widest text-gray-500">Linked Account</p>
           </div>
        </div>
      </section>
    </div>
  );
}
