import { useEffect, useState } from "react";
import { getBrandVoice, updateBrandVoice, type BrandVoicePillar } from "../api";

export default function BrandVoicePage() {
  const [pillars, setPillars] = useState<BrandVoicePillar[]>([]);
  const [avoidWords, setAvoidWords] = useState<string[]>([]);
  const [sampleSnippet, setSampleSnippet] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getBrandVoice()
      .then((d) => {
        setPillars(d.pillars);
        setAvoidWords(d.avoid_words);
        setSampleSnippet(d.sample_snippet);
        setMessage(null);
      })
      .catch(() => setMessage("Could not load brand voice from API."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Brand Voice Guidelines</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Align generated content with tone, vocabulary, and taboos. Saved to the studio API — reference for your team and the
          Content Wizard.
        </p>
      </div>

      {message && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 shadow-sm animate-in fade-in slide-in-from-top-2">
           <span className="material-symbols-outlined text-[18px]">check_circle</span>
           {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 shadow-sm">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Core Pillars</h2>
          <ul className="space-y-4">
            {loading ? (
              <li className="animate-pulse space-y-2">
                 <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl w-full"></div>
                 <div className="h-20 bg-gray-100 dark:bg-white/5 rounded-xl w-full"></div>
              </li>
            ) : (
              pillars.map((p, i) => (
                <li key={i} className="rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-4 text-sm">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500">Title</label>
                  <input
                    type="text"
                    value={p.title}
                    onChange={(e) => {
                      const next = [...pillars];
                      next[i] = { ...next[i]!, title: e.target.value };
                      setPillars(next);
                    }}
                    className="mb-4 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0c0e] px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition-colors"
                  />
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500">Body</label>
                  <textarea
                    value={p.body}
                    onChange={(e) => {
                      const next = [...pillars];
                      next[i] = { ...next[i]!, body: e.target.value };
                      setPillars(next);
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0c0e] px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition-colors resize-y"
                  />
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 shadow-sm">
            <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Words to Avoid</h2>
            <div className="flex flex-wrap gap-2">
              {avoidWords.map((w, i) => (
                <button
                  key={`${w}-${i}`}
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-red-200/50 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  onClick={() => setAvoidWords(avoidWords.filter((_, j) => j !== i))}
                  title="Remove"
                >
                  {w} <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              ))}
            </div>
            <form
              className="mt-6 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const w = String(fd.get("word") ?? "").trim();
                if (w) setAvoidWords([...avoidWords, w]);
                e.currentTarget.reset();
              }}
            >
              <input
                name="word"
                type="text"
                placeholder="Add word..."
                className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0c0e] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition-colors"
              />
              <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-[#111]">
                Add
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 shadow-sm flex-1">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Sample Voice Snippet</h2>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-500">Provide a paragraph that exemplifies your brand's unique tone.</p>
            <textarea
              value={sampleSnippet}
              disabled={loading}
              onChange={(e) => setSampleSnippet(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0c0e] px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300 italic focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition-colors resize-y"
            />
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={loading || saving}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-[#111] disabled:opacity-50"
                onClick={() => {
                  setSaving(true);
                  setMessage(null);
                  updateBrandVoice({ pillars, avoid_words: avoidWords, sample_snippet: sampleSnippet })
                    .then(() => setMessage("Brand voice saved."))
                    .catch(() => setMessage("Failed to save brand voice."))
                    .finally(() => setSaving(false));
                }}
              >
                {saving ? "Saving..." : "Save Database"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
