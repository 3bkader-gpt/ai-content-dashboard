import { useState, useEffect } from "react";
import { getBrandVoice, updateBrandVoice } from "../api";
import { Skeleton } from "../components/Skeleton";

type Pillar = { title: string; body: string };

export default function BrandVoicePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [avoidWords, setAvoidWords] = useState<string[]>([]);
  const [sampleSnippet, setSampleSnippet] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getBrandVoice()
      .then((bv) => {
        setPillars(bv.pillars);
        setAvoidWords(bv.avoid_words);
        setSampleSnippet(bv.sample_snippet);
      })
      .catch(() => setMessage({ tone: "error", text: "Failed to load brand voice settings." }))
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateBrandVoice({
        pillars,
        avoid_words: avoidWords,
        sample_snippet: sampleSnippet,
      });
      setMessage({ tone: "success", text: "Brand voice updated and ready for next kit generation!" });
    } catch {
      setMessage({ tone: "error", text: "Failed to save brand voice." });
    } finally {
      setSaving(false);
    }
  };

  const addPillar = () => setPillars([...pillars, { title: "", body: "" }]);
  const updatePillar = (idx: number, patch: Partial<Pillar>) => {
    const next = [...pillars];
    next[idx] = { ...next[idx]!, ...patch };
    setPillars(next);
  };
  const removePillar = (idx: number) => setPillars(pillars.filter((_, i) => i !== idx));

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-10">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Skeleton className="h-64 rounded-3xl" />
           <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Brand Voice</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Define your brand's unique character and writing constraints.</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Identity"}
        </button>
      </header>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          message.tone === "success" 
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" 
            : "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Core Pillars</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">The foundational values of your communication.</p>
              </div>
              <button
                onClick={addPillar}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            <div className="space-y-4">
              {pillars.map((p, idx) => (
                <div key={idx} className="group relative space-y-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/50 p-4">
                  <button
                    onClick={() => removePillar(idx)}
                    className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm group-hover:flex"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                  <input
                    type="text"
                    value={p.title}
                    onChange={(e) => updatePillar(idx, { title: e.target.value })}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                    placeholder="Pillar Title (e.g. Radical Transparency)"
                  />
                  <textarea
                    value={p.body}
                    onChange={(e) => updatePillar(idx, { body: e.target.value })}
                    className="w-full bg-transparent text-xs text-gray-600 dark:text-gray-400 outline-none resize-none"
                    rows={2}
                    placeholder="Describe how this pillar should be reflected in writing..."
                  />
                </div>
              ))}
              {pillars.length === 0 && (
                <button onClick={addPillar} className="w-full border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl py-12 text-center text-sm text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-all">
                  Add your first brand pillar
                </button>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Style Sample</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">A snippet of text that perfectly captures your brand's voice.</p>
            <textarea
              value={sampleSnippet}
              onChange={(e) => setSampleSnippet(e.target.value)}
              className="w-full h-40 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black p-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
              placeholder="Paste a well-written post or email here..."
            />
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Avoid List</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Words or phrases the AI should never use.</p>
            <div className="space-y-4">
               <input
                 type="text"
                 placeholder="Type and press enter..."
                 className="w-full rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && e.currentTarget.value) {
                     setAvoidWords([...avoidWords, e.currentTarget.value]);
                     e.currentTarget.value = '';
                   }
                 }}
               />
               <div className="flex flex-wrap gap-2">
                 {avoidWords.map(word => (
                   <span key={word} className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-3 py-1 text-[10px] font-bold text-red-600">
                     {word}
                     <button onClick={() => setAvoidWords(avoidWords.filter(w => w !== word))}>
                       <span className="material-symbols-outlined text-[12px]">close</span>
                     </button>
                   </span>
                 ))}
               </div>
            </div>
          </section>

          <div className="rounded-3xl bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-600/20">
             <span className="material-symbols-outlined text-4xl mb-4">psychology</span>
             <h3 className="text-lg font-bold mb-2">AI Integration</h3>
             <p className="text-sm text-indigo-100 leading-relaxed">
               Settings on this page are automatically injected into every Content Kit you generate. 
               The AI will respect your pillars and avoid your forbidden list.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
