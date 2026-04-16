import { useState } from "react";

type Topic = {
  title: string;
  body: string;
  icon: string;
};

const FAQ: Topic[] = [
  {
    title: "How does the AI generate content?",
    body: "SocialGeni uses Google's Gemini 1.5 Pro, combined with our proprietary strategic marketing engine. It analyzes your brand data, industry trends, and target audience to produce high-conversion copy and cinematic video prompts.",
    icon: "psychology",
  },
  {
    title: "Can I use my own brand voice?",
    body: "Yes! Navigate to the 'Brand Voice' page in your account settings. You can define your core pillars, forbidden words, and provide a writing sample. Our AI will automatically inject these preferences into every generation.",
    icon: "record_voice_over",
  },
  {
    title: "What are 'Video Prompts'?",
    body: "These are specialized cinematic instructions designed for tools like Sora, Runway, or Luma. They include camera work, lighting, and motion control to ensure high-quality video generation without artifacts.",
    icon: "movie",
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const filteredFaq = FAQ.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.body.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl space-y-10 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">How can we help?</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">Search our knowledge base or browse common questions below.</p>
        
        <div className="mt-8 relative max-w-2xl mx-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] py-4 pl-12 pr-4 text-gray-900 dark:text-white shadow-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Search for topics, features, or troubleshooting..."
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 text-center shadow-sm">
           <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
             <span className="material-symbols-outlined">auto_awesome</span>
           </div>
           <h3 className="font-bold text-gray-900 dark:text-white mb-2">Getting Started</h3>
           <p className="text-xs text-gray-500 dark:text-gray-400">Learn the basics of creating your first content kit.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 text-center shadow-sm">
           <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
             <span className="material-symbols-outlined">payments</span>
           </div>
           <h3 className="font-bold text-gray-900 dark:text-white mb-2">Billing & Plans</h3>
           <p className="text-xs text-gray-500 dark:text-gray-400">Manage your subscription and usage quotas.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 text-center shadow-sm">
           <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
             <span className="material-symbols-outlined">api</span>
           </div>
           <h3 className="font-bold text-gray-900 dark:text-white mb-2">API & Webhooks</h3>
           <p className="text-xs text-gray-500 dark:text-gray-400">Advanced integration for developers.</p>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white px-2">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {filteredFaq.map((item, idx) => (
            <div key={idx} className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 flex-shrink-0">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredFaq.length === 0 && (
            <div className="py-20 text-center text-gray-400 border border-dashed rounded-3xl">
              No topics found matching "{query}"
            </div>
          )}
        </div>
      </section>

      <footer className="rounded-3xl bg-gray-900 dark:bg-white p-10 text-center shadow-2xl">
         <h2 className="text-2xl font-bold text-white dark:text-black mb-2">Still need help?</h2>
         <p className="text-gray-400 dark:text-gray-500 mb-8 max-w-sm mx-auto">Our support team is available via WhatsApp for instant technical assistance.</p>
         <button className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900 px-8 py-3.5 text-sm font-bold text-black dark:text-white transition hover:scale-105 active:scale-95">
           <span className="material-symbols-outlined text-[18px]">chat</span>
           Contact Support
         </button>
      </footer>
    </div>
  );
}
