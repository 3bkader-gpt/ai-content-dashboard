export type HelpResource = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  accent: "primary" | "tertiary";
  haystack: string;
};

export type HelpFaqItem = { q: string; a: string };

export const HELP_RESOURCES: HelpResource[] = [
  {
    id: "help-center",
    title: "Help Center",
    desc: "Comprehensive guides on engine mechanics, creative workflows, and asset management.",
    icon: "menu_book",
    accent: "primary",
    haystack: "help center guides workflow asset management documentation",
  },
  {
    id: "api-docs",
    title: "API Docs",
    desc: "Technical specifications for neural integrations, webhooks, and headless deployments.",
    icon: "terminal",
    accent: "tertiary",
    haystack: "api docs schema webhooks rest graphql integration endpoints",
  },
];

export const HELP_FAQ: HelpFaqItem[] = [
  {
    q: 'How does the "Neural Spark" engine process 4K assets?',
    a: "The Neural Spark utilizes a distributed cloud-rendering protocol that prioritizes sub-surface scattering and ambient occlusion in real-time, ensuring zero latency during the preview phase of your project.",
  },
  {
    q: "Can I export my projects for local hosting?",
    a: "Yes — kits can be downloaded from each kit detail view once generation completes. For self-hosted pipelines, use the API webhooks described in API Docs.",
  },
  {
    q: "What are the limitations of the Ethereal Tier?",
    a: "Rate limits and concurrent generations depend on your workspace plan. Contact support if you need higher throughput or dedicated capacity.",
  },
  {
    q: "How do I integrate custom LLMs into my workflow?",
    a: "Use the server configuration for supported models, or route outputs through your own inference layer via webhooks and the kit JSON payloads.",
  },
];

function matchesQuery(text: string, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return text.toLowerCase().includes(s);
}

export function filterHelpTopics(query: string): { resources: HelpResource[]; faq: HelpFaqItem[] } {
  const q = query.trim();
  return {
    resources: HELP_RESOURCES.filter((r) => matchesQuery(`${r.title} ${r.desc} ${r.haystack}`, q)),
    faq: HELP_FAQ.filter((item) => matchesQuery(`${item.q} ${item.a}`, q)),
  };
}
