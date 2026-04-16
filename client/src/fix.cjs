const fs = require('fs/promises');
const path = require('path');

async function fix() {
  const p = path.join(process.cwd(), 'client/src/pages/wizards/WizardCore.tsx');
  
  const content = `import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useNavigate } from "react-router-dom";
import { BRIEF_LIMITS, briefSchema, initialBriefForm } from "../../briefSchema";
import {
  BrandStep,
  AudienceStep,
  ChannelsStep,
  OfferStep,
  CreativeStep,
  VolumeStep,
} from "./WizardSteps";
import type { BriefForm } from "../../types";
import { getWizardTypeFromDraftKey } from "../../lib/wizardAnalytics";
import { useWizardTelemetry } from "./hooks/useWizardTelemetry";
import { useWizardSubmission } from "./hooks/useWizardSubmission";
import { useWizardDraft } from "./hooks/useWizardDraft";
import { useWizardOrchestrator } from "./hooks/useWizardOrchestrator";
import { isWizardVariantB } from "../../lib/wizardExperiment";

type StepId = "diagnosis" | "brand" | "audience" | "channels" | "offer" | "creative" | "volume";

type WizardCoreProps = {
  draftKey: string;
  title: string;
  subtitle: string;
  routeHint: string;
  stepOrder: StepId[];
  stepTitles: Record<StepId, string>;
  stepFields?: Partial<Record<StepId, (keyof BriefForm)[]>>;
  defaults?: Partial<BriefForm>;
  formSchema?: z.ZodType<BriefForm, z.ZodTypeDef, unknown>;
};

const LIMITS = BRIEF_LIMITS;
const FALLBACK_INDUSTRY_OPTIONS: { slug: string; name: string }[] = (
  ["ecommerce", "real-estate", "restaurants", "clinics", "education", "general"] as const
).map((slug) => ({ slug, name: slug.replace(/-/g, " ") }));

const WAITING_STAGES = [
  {
    title: "Analyzing your brand",
    hint: "Reading your core inputs and campaign intent to build the right direction.",
  },
  {
    title: "Crafting high-converting hooks",
    hint: "Generating social and messaging angles based on your selected flow.",
  },
  {
    title: "Preparing your visual prompts",
    hint: "Structuring creative outputs and finalizing your kit delivery payload.",
  },
] as const;

const STEP_FIELDS: Record<StepId, (keyof BriefForm)[]> = {
  diagnosis: [
    "diagnostic_role",
    "diagnostic_account_stage",
    "diagnostic_followers_band",
    "diagnostic_primary_blocker",
    "diagnostic_revenue_goal",
  ],
  brand: ["brand_name", "industry"],
  audience: ["target_audience", "main_goal"],
  channels: ["platforms", "brand_tone", "brand_colors"],
  offer: ["offer", "competitors"],
  creative: ["visual_notes", "reference_image", "campaign_duration", "budget_level", "best_content_types"],
  volume: [],
};

function cn(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const btnPrimary =
  "rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-3 font-bold text-on-primary-container shadow-lg shadow-primary/15 transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 dark:from-brand-primary dark:to-brand-accent dark:text-brand-darkText";
const btnSecondary =
  "rounded-xl border border-outline/30 bg-surface-container-high px-5 py-3 font-semibold text-on-surface transition hover:bg-surface-container-highest focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-muted/40 dark:bg-earth-darkCard dark:text-brand-darkText";

export default function WizardCore(props: WizardCoreProps) {
  const nav = useNavigate();
  const maxStep = props.stepOrder.length - 1;
  const wizardType = useMemo(() => getWizardTypeFromDraftKey(props.draftKey), [props.draftKey]);
  const mergedDefaults = useMemo(() => ({ ...initialBriefForm(), ...(props.defaults ?? {}) }), [props.defaults]);
  const stepFieldMap = useMemo(() => ({ ...STEP_FIELDS, ...(props.stepFields ?? {}) }), [props.stepFields]);
  const zodSchema = props.formSchema ?? briefSchema;
  const zodResolverMemo = useMemo(() => zodResolver(zodSchema), [zodSchema]);
  const industryOptions = FALLBACK_INDUSTRY_OPTIONS;
  const variantB = isWizardVariantB();

  const [tipIndex, setTipIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const methods = useForm<BriefForm>({
    resolver: zodResolverMemo,
    defaultValues: mergedDefaults,
    mode: "onTouched",
  });
  
  const {
    watch,
    reset,
    getValues,
    trigger,
    handleSubmit,
  } = methods;
  
  const {
    initialState,
    step,
    setStep,
    showDraftBanner,
    clearStoredDraft,
  } = useWizardDraft({
    draftKey: props.draftKey,
    mergedDefaults,
    maxStep,
    limits: LIMITS as unknown as Record<string, { min: number; max: number }>,
    watch: (cb) => watch(cb),
    getValues,
  });

  function showField(step: string, key: keyof BriefForm): boolean {
    const keys = stepFieldMap[step as StepId] ?? STEP_FIELDS[step as StepId];
    if (!keys || !keys.length) return true;
    return keys.includes(key);
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const fn = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    reset(initialState.form);
  }, [initialState.form, reset]);

  const telemetry = useWizardTelemetry({
    wizardType,
    draftKey: props.draftKey,
    step,
    stepOrder: props.stepOrder,
    maxStep,
    restoredDraft: initialState.hadDraft,
  });

  const clearDraft = () => {
    reset(mergedDefaults);
    setStep(0);
    clearStoredDraft();
  };

  const { next } = useWizardOrchestrator({
    step,
    maxStep,
    stepOrder: props.stepOrder,
    stepFieldMap,
    trigger,
    setStep,
    onStepValidationFailed: (current) => {
      telemetry.emit({
        name: "wizard_step_validation_failed",
        wizard_type: wizardType,
        draft_key: props.draftKey,
        step_index: step,
        step_id: current,
        validation_state: "failed",
        elapsed_time_ms: telemetry.getElapsedMs(),
      });
    },
  });

  const getSubmissionPayload = (form: BriefForm) => ({
    ...form,
    num_posts: clamp(form.num_posts, LIMITS.num_posts.min, LIMITS.num_posts.max),
    num_image_designs: clamp(form.num_image_designs, LIMITS.num_image_designs.min, LIMITS.num_image_designs.max),
    num_video_prompts: clamp(form.num_video_prompts, LIMITS.num_video_prompts.min, LIMITS.num_video_prompts.max),
    content_package_idea_count: clamp(
      form.content_package_idea_count,
      LIMITS.content_package_idea_count.min,
      LIMITS.content_package_idea_count.max
    ),
  });

  const submission = useWizardSubmission({
    wizardType,
    draftKey: props.draftKey,
    clearStoredDraft,
    onSuccess: (data) => nav(\`/briefs/\${data.id}\`, { replace: true }),
    payloadBuilder: getSubmissionPayload,
    emit: telemetry.emit,
    getElapsedMs: telemetry.getElapsedMs,
  });
  const onValidSubmit = submission.onValidSubmit;
  const loading = submission.loading;
  const err = submission.error;

  useEffect(() => {
    if (!loading || reduceMotion) return;
    const id = window.setInterval(() => setTipIndex((i) => (i + 1) % WAITING_STAGES.length), 4500);
    return () => clearInterval(id);
  }, [loading, reduceMotion]);

  const currentStep = props.stepOrder[step]!;
  const isFinalStep = step === maxStep;

  return (
    <div className="mx-auto w-full max-w-6xl px-2 sm:px-4">
      <div className="mb-8 md:mb-10">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl">{props.title}</h2>
        <p className="mt-2 max-w-3xl text-on-surface-variant">{props.subtitle}</p>
      </div>

      {showDraftBanner && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tertiary/25 bg-tertiary/10 px-4 py-3 text-sm text-on-surface dark:border-brand-sand/40 dark:bg-brand-sand/10 dark:text-brand-darkText">
          <span>Restored a saved draft for this path.</span>
          <button type="button" className={btnSecondary + " py-2 text-sm"} onClick={clearDraft}>
            Clear draft
          </button>
        </div>
      )}

      <div className="wizard-root overflow-hidden rounded-2xl border border-outline/30 bg-surface-container-low sm:rounded-3xl dark:border-brand-muted/40 dark:bg-earth-darkCard/75" aria-busy={loading}>
        <div className={cn("wizard-body-wrap relative !rounded-3xl", loading && "wizard-body-wrap--loading")}>
          <div className="wizard-body p-4 sm:p-6 md:p-8">
            <div className="mb-5 rounded-xl border border-outline/30 bg-surface-container-lowest/70 p-3 dark:border-brand-muted/40 dark:bg-earth-darkCard/70">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                <span>Step {step + 1} of {maxStep + 1}</span>
                <span>{props.stepTitles[currentStep]}</span>
              </div>
            </div>

            <div className="mb-6 flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:mb-8 sm:flex-wrap sm:overflow-visible">
              {props.stepOrder.map((id, i) => (
                <span
                  key={id}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    i === step
                      ? "border-primary/30 bg-primary/20 text-primary dark:border-brand-primary/45 dark:bg-brand-primary/15 dark:text-brand-darkText"
                      : "border-transparent bg-surface-container-lowest text-on-surface-variant dark:bg-earth-darkBg/55 dark:text-brand-darkText/70"
                  )}
                >
                  {i + 1}. {props.stepTitles[id]}
                </span>
              ))}
            </div>

            {currentStep === "brand" && <BrandStep form={methods} showField={showField} industryOptions={industryOptions} />}
            {currentStep === "audience" && <AudienceStep form={methods} showField={showField} />}
            {currentStep === "channels" && <ChannelsStep form={methods} showField={showField} />}
            {currentStep === "offer" && <OfferStep form={methods} showField={showField} />}
            {currentStep === "creative" && <CreativeStep form={methods} showField={showField} />}
            {currentStep === "volume" && <VolumeStep form={methods} showField={showField} />}

            {err && <p className="mt-4 text-error dark:text-brand-accent">{err}</p>}

            {isFinalStep && !loading && (
              <div className="mb-5 rounded-xl border border-primary/30 bg-primary/10 p-4 dark:border-brand-primary/40 dark:bg-brand-primary/15">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-on-surface">
                    {variantB ? "Ready to reveal your diagnosis and action plan" : "Ready to generate your kit"}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {variantB
                      ? "Takes around 10-30 seconds. Your diagnosis snapshot is saved with the kit, and you can edit outputs after generation."
                      : "Takes around 10-30 seconds. Your draft stays saved, and you can edit after generation."}
                  </p>
                </div>
              </div>
            )}

            {variantB && isFinalStep && !loading && (
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-outline/25 bg-surface-container-low p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Role</p>
                  <p className="mt-1 text-sm font-semibold text-on-surface">{watch("diagnostic_role") || "Not set"}</p>
                </div>
                <div className="rounded-xl border border-outline/25 bg-surface-container-low p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Primary Blocker</p>
                  <p className="mt-1 text-sm font-semibold text-on-surface">{watch("diagnostic_primary_blocker") || "Not set"}</p>
                </div>
                <div className="rounded-xl border border-outline/25 bg-surface-container-low p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Revenue target</p>
                  <p className="mt-1 text-sm font-semibold text-on-surface">{watch("diagnostic_revenue_goal") || "Not set"}</p>
                </div>
              </div>
            )}

            {variantB && isFinalStep && !loading && (
              <div className="mb-5 rounded-xl border border-tertiary/25 bg-tertiary/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-tertiary">Proof and objections</p>
                <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                  <li>- Built for repeatable execution, not one-time suggestions.</li>
                  <li>- You can regenerate, edit, and iterate every output after creation.</li>
                  <li>- Draft-safe flow: nothing gets lost if you return later.</li>
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" className={btnSecondary + " w-full sm:w-auto"} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
                Back
              </button>
              {step < maxStep ? (
                <button type="button" className={btnPrimary + " w-full sm:w-auto"} onClick={() => void next()} disabled={loading}>
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className={btnPrimary + " w-full sm:w-auto"}
                  onClick={handleSubmit(onValidSubmit)}
                  disabled={loading}
                >
                  {loading ? (variantB ? "Building your diagnosis..." : "Generating...") : variantB ? "Show my diagnosis and plan" : "Generate my kit now"}
                </button>
              )}
            </div>
          </div>

          {loading && (
            <div className="wizard-loading-overlay" role="status" aria-live="polite">
              <div className="wizard-indeterminate-track" aria-hidden>
                <div className="wizard-indeterminate-bar" />
              </div>
              <h3>{WAITING_STAGES[tipIndex]!.title}</h3>
              <p className="wizard-loading-hint">{WAITING_STAGES[tipIndex]!.hint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
  await fs.writeFile(p, content, 'utf8');
  console.log("WizardCore.tsx fully written seamlessly.");
}
fix().catch(console.error);
