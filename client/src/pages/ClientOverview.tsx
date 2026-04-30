import { Link } from "react-router-dom";

const STEPS = [
  {
    icon: "assignment_add",
    title: "Submit your brief",
    titleAr: "أرسل تفاصيل مشروعك",
    body: "Fill out our smart project brief so we capture your brand, goals, and channels in one structured flow.",
  },
  {
    icon: "auto_awesome",
    title: "Expert & AI generation",
    titleAr: "خبراء + ذكاء اصطناعي",
    body: "Our team and platform craft tailored posts, image prompts, video prompts, and strategy aligned to your brief.",
  },
  {
    icon: "package_2",
    title: "Receive premium assets",
    titleAr: "استلم أصول جاهزة",
    body: "Get ready-to-publish content plus exports such as PDF and styled Excel when your package includes them.",
  },
] as const;

const PORTFOLIO = [
  {
    title: "Real Estate Campaign",
    subtitle: "Multi-channel launch + bilingual captions",
    icon: "apartment",
  },
  {
    title: "E-commerce Launch",
    subtitle: "Product hooks, reels scripts, and ad angles",
    icon: "shopping_bag",
  },
  {
    title: "B2B SaaS Thought Leadership",
    subtitle: "LinkedIn-first content mix and weekly plan",
    icon: "hub",
  },
  {
    title: "Hospitality & F&B",
    subtitle: "Seasonal promos and UGC-style video prompts",
    icon: "restaurant",
  },
] as const;

export default function ClientOverview() {
  return (
    <div className="space-y-14 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black px-6 py-12 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gray-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-gray-700/10 dark:bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            SocialGeni Client Portal
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
            Welcome to your agency workspace
          </h1>
          <p dir="rtl" lang="ar" className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300 sm:text-base">
            مرحبًا بك في بوابة الوكالة — محتوى احترافي مدعوم بالذكاء الاصطناعي
          </p>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
            Submit one structured brief. We combine human expertise with AI to deliver production-ready kits—posts,
            visuals, and video prompts—with clear next steps for your team.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/wizard/social"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-gray-100 sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">edit_square</span>
              Start request and get first draft
            </Link>
            <Link
              to="/pricing"
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-100 dark:hover:bg-white/5 sm:w-auto"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading">
        <div className="mb-8 text-center">
          <h2 id="how-it-works-heading" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            How it works
          </h2>
          <p dir="rtl" lang="ar" className="mt-2 text-sm text-gray-500 dark:text-gray-400">كيف نعمل — ثلاث خطوات واضحة</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <article
              key={step.title}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-black">
                <span className="material-symbols-outlined text-[22px]">{step.icon}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{step.title}</h3>
              <p dir="rtl" lang="ar" className="text-sm text-gray-500 dark:text-gray-400">{step.titleAr}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="portfolio-heading">
        <div className="mb-8 text-center">
          <h2 id="portfolio-heading" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Our work
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sample engagement types — representative of packages we deliver (illustrative).
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <article className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-900 lg:col-span-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:border-white/10 dark:text-gray-300">
                <span className="material-symbols-outlined text-sm">verified</span>
                Featured delivery
              </p>
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Cross-channel launch package</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                One brief, one aligned system: platform-specific posts, image concepts, short-form video prompts, and a
                weekly publishing direction your team can execute immediately.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">Bilingual copy</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">Export-ready</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">Review workflow</span>
            </div>
          </article>

          {PORTFOLIO.map((item) => (
            <article
              key={item.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-900 lg:col-span-1"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 dark:bg-white/5">
                <span className="material-symbols-outlined text-5xl text-gray-400 transition-transform group-hover:scale-105 dark:text-gray-500">
                  {item.icon}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-white/10 dark:bg-white/[0.04] sm:p-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Ready to brief your next campaign?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          Open the smart wizard to capture brand, audience, and deliverables. You can save progress and return anytime.
        </p>
        <Link
          to="/wizard/social"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
        >
          <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
          Start request and preview your deliverables
        </Link>
      </section>
    </div>
  );
}
