import { Routes, Route, Navigate, Link } from "react-router-dom";
import KitDetail from "./KitDetail";
import Dashboard from "./Dashboard";
import GeneratedKitsPage from "./GeneratedKitsPage";
import WizardAnalyticsPage from "./pages/WizardAnalyticsPage";
import AdminPlansPage from "./pages/AdminPlansPage";
import SocialCampaignWizard from "./pages/wizards/SocialCampaignWizard";
import OfferProductWizard from "./pages/wizards/OfferProductWizard";
import DeepContentWizard from "./pages/wizards/DeepContentWizard";
import PricingPage from "./pages/PricingPage";
import UserLayout from "./layout/UserLayout";
import AdminLayout from "./layout/AdminLayout";
import { useAuth } from "./auth/AuthContext";

const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

export default function App() {
  const { entitlements } = useAuth();
  const plan = entitlements?.plan_code ?? "free";
  const modeLocked = plan === "free";
  const LockedMode = ({ mode }: { mode: "offer" | "deep" }) => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">🔒 {mode === "offer" ? "Offer" : "Deep"} mode is locked</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-500">
        This mode is available in Creator Pro and Agency plans. Upgrade your account to unlock it.
      </p>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Current plan: {plan}</p>
      <Link
        to="/pricing"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      >
        <span className="material-symbols-outlined text-base">rocket_launch</span>
        Upgrade plan
      </Link>
    </div>
  );
  return (
    <Routes>
      <Route
        element={
          <UserLayout
            demoBanner={
              demoMode ? (
                <div
                  className="mb-4 rounded-xl border border-amber-400/30 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  role="status"
                >
                  Demo mode — the real Gemini path is not invoked
                </div>
              ) : undefined
            }
          />
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/generated-kits" element={<GeneratedKitsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/wizard" element={<Navigate to="/wizard/social" replace />} />
        <Route path="/wizard/social" element={<SocialCampaignWizard />} />
        <Route path="/wizard/offer" element={modeLocked ? <LockedMode mode="offer" /> : <OfferProductWizard />} />
        <Route path="/wizard/deep" element={modeLocked ? <LockedMode mode="deep" /> : <DeepContentWizard />} />
        <Route path="/kits/:id" element={<KitDetail />} />
        <Route path="/help" element={<Navigate to="/wizard" replace />} />
        <Route path="/integrations" element={<Navigate to="/wizard" replace />} />
        <Route path="/extras" element={<Navigate to="/wizard" replace />} />
        <Route path="/brand-voice" element={<Navigate to="/wizard" replace />} />
        <Route path="/profile" element={<Navigate to="/wizard" replace />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/analytics" replace />} />
        <Route path="analytics" element={<WizardAnalyticsPage />} />
        <Route path="plans" element={<AdminPlansPage />} />
        <Route path="generated-kits" element={<GeneratedKitsPage adminMode />} />
        <Route path="kits/:id" element={<KitDetail showTechnical />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Legacy admin routes kept as temporary redirects */}
      <Route path="/prompt-catalog" element={<Navigate to="/admin/analytics" replace />} />
      <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
