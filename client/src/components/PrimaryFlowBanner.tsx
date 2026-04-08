import { Link } from "react-router-dom";

export default function PrimaryFlowBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-on-surface " +
        className
      }
      role="note"
      aria-label="Primary flow"
      dir="rtl"
    >
      <p className="text-right">
        ابدأ من <strong>Dashboard</strong> لمراجعة الكيتس السابقة، أو ادخل <strong>Content Wizard</strong> لعمل كيت جديد. بعد التوليد ستجد
        النتيجة جاهزة في قسم <strong>الكيتس</strong> وصفحة تفاصيل الكيت.
      </p>
      <Link
        to="/wizard"
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Open Wizard
      </Link>
    </div>
  );
}
