import { useSearchParams, useNavigate } from "react-router-dom";
import { getWhatsAppSalesUrl } from "../lib/whatsappSales";

const SOCIAL_DRAFT_KEY = "ai-content-dashboard:wizard-draft:social:v1";

export default function OrderReceivedPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const trackingKitId = params.get("kit") ?? "";
  const intent = params.get("intent") ?? "free";
  const isPaidIntent = intent === "paid";
  const whatsappUrl = getWhatsAppSalesUrl();
  const clearWizardDraft = () => {
    try {
      localStorage.removeItem(SOCIAL_DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-8 sm:p-10 shadow-sm">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 mb-5">
          <span className="material-symbols-outlined">check_circle</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {isPaidIntent ? "تم استلام طلب الباقة المدفوعة" : "تم استلام طلب العينة المجانية"}
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
          {isPaidIntent
            ? "فريق المبيعات سيتواصل معك قريبًا لتأكيد الدفع وتجهيز التسليم."
            : "فريقنا يراجع طلبك الآن لتحضير النسخة التجريبية المجانية."}
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Order status</p>
          <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
            {isPaidIntent ? "Pending sales confirmation" : "Free test in preparation"}
          </p>
          {trackingKitId ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Reference: {trackingKitId}</p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              إتمام الدفع عبر واتساب
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              clearWizardDraft();
              navigate("/");
            }}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              clearWizardDraft();
              navigate("/wizard/social?step=1");
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            Submit another request
          </button>
        </div>
      </div>
    </section>
  );
}
