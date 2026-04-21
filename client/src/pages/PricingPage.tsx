import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { submitPremiumLead } from "../api";

type PlanId = "starter" | "early_adopter";

function FeatureItem({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
      <span className="material-symbols-outlined text-[18px] text-gray-900 dark:text-white mt-0.5">check_circle</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

export default function PricingPage() {
  const { entitlements, session } = useAuth();
  const navigate = useNavigate();
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [submittingLead, setSubmittingLead] = useState(false);

  const currentPlan = entitlements?.plan_code ?? "starter";

  const planCards = useMemo(
    () => [
      {
        id: "starter" as const,
        title: "الباقة المجانية",
        price: "مجانًا",
        subtitle: "Free sample lead-magnet",
        highlight: false,
        features: [
          "1 Video Prompt (برومبت فيديو)",
          "2 Image Prompts (برومبت صور)",
          "1 Social Media Content/Post (محتوى سوشيال ميديا)",
          "1 Hook (هوك)",
        ],
      },
      {
        id: "early_adopter" as const,
        title: "الباقة المدفوعة",
        price: "Premium Agency",
        subtitle: "One-Time Service Package (حزم خدمات لمرة واحدة)",
        highlight: true,
        features: [
          "2 to 4 Custom Videos (فيديوهات مخصصة)",
          "10 Image Designs/Prompts (تصميمات/برومبت صور)",
          "15 Ready-to-publish Social Posts (محتوى متكامل للصور والفيديوهات)",
          "Advanced Hooks & Media Strategy (هوكس واستراتيجية ميديا)",
        ],
      },
    ],
    []
  );

  const onPlanClick = (plan: PlanId) => {
    if (plan === "starter") return;
    setLeadName(session?.user?.user_metadata?.full_name ?? "");
    setLeadEmail(session?.user?.email ?? "");
    setLeadPhone("");
    setLeadError(null);
    setShowLeadModal(true);
  };

  const submitLead = async () => {
    if (!leadName.trim() || !leadPhone.trim()) {
      setLeadError("الاسم ورقم الهاتف مطلوبان.");
      return;
    }
    setSubmittingLead(true);
    setLeadError(null);
    try {
      await submitPremiumLead({
        name: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim() || undefined,
      });
      setShowLeadModal(false);
      navigate("/order-received?intent=paid");
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : "تعذر إرسال الطلب الآن، حاول مرة أخرى.");
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <section className="space-y-12">
      <header className="text-center max-w-3xl mx-auto py-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          One-Time Service Packages
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          اختار الباقة المناسبة لخدمتك. الباقات هنا لمرة واحدة وليست اشتراكًا شهريًا.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Current plan:</span>
          <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-1 px-3 text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-white shadow-sm">
            {currentPlan}
          </span>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-indigo-500/10 bg-white dark:bg-[#111] p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-[64px]" />
        <div className="pointer-events-none absolute -bottom-16 left-16 h-48 w-48 rounded-full bg-blue-500/10 blur-[64px]" />
        
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 shadow-sm">
            <span className="material-symbols-outlined text-sm">bolt</span>
            Productized Service
          </p>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            جرب العينة المجانية ثم فعّل الباقة المدفوعة عبر واتساب
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            نموذج الدفع في الـ MVP يدوي لمرة واحدة عبر فريق المبيعات على واتساب (فودافون كاش / انستاباي).
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              Free Sample
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              One-Time Paid Package
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              WhatsApp Payment Flow
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
        {planCards.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const ctaLabel =
            plan.id === "starter"
              ? "ابدأ مجانًا"
              : isCurrent
                ? "الباقة الحالية"
                : "اشترك في الباقة المدفوعة";
          const isDisabled = plan.id === "starter" || isCurrent;
          
          return (
            <article
              key={plan.id}
              className={[
                "relative flex flex-col rounded-3xl p-8 bg-white dark:bg-[#111] shadow-xl transition-transform hover:-translate-y-1 border",
                plan.highlight
                  ? "border-gray-900/50 dark:border-white/30 ring-1 ring-inset ring-gray-900/10 dark:ring-white/10 lg:-mt-4 lg:mb-4 lg:scale-105"
                  : "border-gray-200 dark:border-white/10",
              ].join(" ")}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-gray-900 dark:bg-white px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white dark:text-black shadow-sm">
                    الأكثر طلبًا
                  </span>
                </div>
              )}
              
              <div className="mb-6 mt-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.title}</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{plan.subtitle}</p>
              </div>

              <div className="mb-8 flex items-baseline text-gray-900 dark:text-white">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
              </div>

              <ul className="mb-10 space-y-4 flex-1">
                {plan.features.map((f) => (
                  <FeatureItem key={f}>{f}</FeatureItem>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onPlanClick(plan.id)}
                disabled={isDisabled}
                className={[
                  "w-full rounded-xl px-4 py-3.5 text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#111]",
                  plan.highlight && !isDisabled
                    ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 focus:ring-gray-900 dark:focus:ring-white"
                    : isDisabled
                    ? "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed border border-transparent"
                    : "bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 dark:bg-[#111] dark:text-white dark:border-white/20 dark:hover:bg-white/5 focus:ring-gray-200 dark:focus:ring-white/20"
                ].join(" ")}
              >
                {ctaLabel}
              </button>
            </article>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#111] px-5 py-4 text-center text-sm text-gray-600 dark:text-gray-400 shadow-sm backdrop-blur-sm">
        الدفع يتم حاليًا مباشرة عبر واتساب (فودافون كاش / انستاباي) ضمن نموذج Productized Service لمرة واحدة.
      </div>

      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">طلب الباقة المدفوعة</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">أدخل بيانات التواصل لإرسال طلبك لفريق المبيعات.</p>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                placeholder="الاسم"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                placeholder="رقم الهاتف"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                placeholder="البريد الإلكتروني (اختياري)"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
              />
              {leadError && <p className="text-xs text-red-500">{leadError}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 text-sm"
                onClick={() => setShowLeadModal(false)}
                disabled={submittingLead}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
                onClick={() => void submitLead()}
                disabled={submittingLead}
              >
                {submittingLead ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
