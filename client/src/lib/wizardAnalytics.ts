export type WizardEventName =
  | "wizard_started"
  | "wizard_step_viewed"
  | "wizard_step_next_clicked"
  | "wizard_step_validation_failed"
  | "wizard_generate_clicked"
  | "kit_created_success"
  | "kit_created_failed";

export type WizardType = "social" | "offer" | "deep" | "unknown";

export type WizardEventPayload = {
  name: WizardEventName;
  ts: number;
  wizard_type: WizardType;
  draft_key: string;
  step_id?: string;
  step_index?: number;
  total_steps?: number;
  validation_state?: "passed" | "failed";
  elapsed_time_ms?: number;
  kit_id?: string;
  error?: string;
  restored_draft?: boolean;
};

const STORAGE_KEY = "ai-content-dashboard:wizard-analytics-buffer:v1";
const MAX_BUFFER = 200;

export function getWizardTypeFromDraftKey(draftKey: string): WizardType {
  if (draftKey.includes(":social:")) return "social";
  if (draftKey.includes(":offer:")) return "offer";
  if (draftKey.includes(":deep:")) return "deep";
  return "unknown";
}

function appendToLocalBuffer(payload: WizardEventPayload) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev: WizardEventPayload[] = raw ? (JSON.parse(raw) as WizardEventPayload[]) : [];
    const next = [...prev, payload].slice(-MAX_BUFFER);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage issues
  }
}

export function emitWizardEvent(payload: Omit<WizardEventPayload, "ts">) {
  const eventPayload: WizardEventPayload = { ...payload, ts: Date.now() };
  appendToLocalBuffer(eventPayload);
  window.dispatchEvent(new CustomEvent("wizard:analytics", { detail: eventPayload }));
  if (import.meta.env.DEV) {
    console.debug("[wizard]", eventPayload);
  }
}

