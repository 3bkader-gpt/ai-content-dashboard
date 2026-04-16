import { useState } from "react";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  status: "active" | "beta" | "coming_soon";
};

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Publish posts, reels, and stories directly to your professional account.",
    icon: "https://www.svgrepo.com/show/521711/instagram.svg",
    connected: false,
    status: "coming_soon",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Sync video prompts and assets with TikTok Creative Center.",
    icon: "https://www.svgrepo.com/show/512969/tiktok.svg",
    connected: false,
    status: "coming_soon",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Receive your generated content kits directly via WhatsApp Business.",
    icon: "https://www.svgrepo.com/show/521918/whatsapp.svg",
    connected: false,
    status: "active",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Collaborate with your team by receiving alerts and previews in Slack.",
    icon: "https://www.svgrepo.com/show/521841/slack.svg",
    connected: false,
    status: "beta",
  },
];

export default function IntegrationsPage() {
  const [integrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Integrations</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Connect SocialGeni with your favorite platforms to automate your workflow.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <div key={item.id} className="group relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 shadow-sm transition-all hover:border-indigo-500/30 hover:shadow-md">
            <div className="mb-6 flex items-start justify-between">
              <div className="h-14 w-14 rounded-2xl bg-gray-50 dark:bg-black p-3 border border-gray-100 dark:border-white/5">
                <img src={item.icon} alt={item.name} className="h-full w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  item.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  item.status === 'beta' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' :
                  'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
                {item.connected && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 h-10 overflow-hidden">{item.description}</p>

            <button
              disabled={item.status === 'coming_soon'}
              className={`w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                item.connected 
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 hover:bg-red-100' 
                  : 'bg-gray-900 text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-30 disabled:grayscale'
              }`}
            >
              {item.connected ? 'Disconnect' : item.status === 'coming_soon' ? 'Join Waitlist' : 'Connect Account'}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
         <span className="material-symbols-outlined text-4xl text-gray-300 mb-4 text-gray-500">add_link</span>
         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Need another integration?</h3>
         <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">We're constantly adding new platforms based on your feedback.</p>
         <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">Request a Connection →</button>
      </div>
    </div>
  );
}
