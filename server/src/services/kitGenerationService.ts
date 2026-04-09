import { createHash } from "node:crypto";
import { and, desc, eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { idempotencyKeys, kits, type KitRow } from "../db/schema.js";
import { resolveDeliveryStatus, sendAdminFailureAlert, sendClientDelayEmail, sendKitEmail } from "../email/send.js";
import { buildDemoKitContent } from "../logic/demoKit.js";
import { callGeminiAPI, loadGeminiSettingsFromEnv, type GeminiReferenceImage, type GeminiSettings } from "../logic/geminiClient.js";
import type { SubmissionSnapshot } from "../logic/constants.js";
import { recordKitNotification } from "../logic/notifyKit.js";
import { buildSubmissionSnapshot, briefFingerprint, isPlainObject, parseSubmissionSnapshotJson } from "../logic/parse.js";
import { resolvePrompt } from "../logic/promptResolver.js";
import { getStatusBadgeLabel, getStatusBadgePalette, normalizeDeliveryStatus } from "../logic/status.js";
import { validateGeminiResponse } from "../logic/validate.js";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_PENDING_KIT = "__pending__";
const MAX_REFERENCE_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_REFERENCE_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type RegenerateItemType = "post" | "image" | "video";

const SECTION_KEYS: Record<RegenerateItemType, string[]> = {
  post: ["posts"],
  image: ["image_designs", "image_prompts", "creative_prompts", "design_prompts", "visual_prompts"],
  video: ["video_prompts", "video_assets", "ai_video_assets", "assets"],
};

export function getSectionArray(result: Record<string, unknown>, type: RegenerateItemType): { key: string; items: unknown[] } | null {
  const keys = SECTION_KEYS[type];
  for (const key of keys) {
    const v = result[key];
    if (Array.isArray(v)) return { key, items: v };
  }
  return null;
}

export function getRegenerateItemSchema(type: RegenerateItemType): Record<string, unknown> {
  if (type === "post") {
    return {
      type: "OBJECT",
      required: ["item"],
      properties: {
        item: {
          type: "OBJECT",
          required: ["platform", "format", "goal", "post_ar", "post_en", "hashtags", "cta"],
          properties: {
            platform: { type: "STRING" },
            format: { type: "STRING" },
            goal: { type: "STRING" },
            post_ar: { type: "STRING" },
            post_en: { type: "STRING" },
            hashtags: { type: "ARRAY", items: { type: "STRING" } },
            cta: { type: "STRING" },
          },
        },
      },
    };
  }
  if (type === "image") {
    return {
      type: "OBJECT",
      required: ["item"],
      properties: {
        item: {
          type: "OBJECT",
          required: [
            "platform_format",
            "design_type",
            "goal",
            "visual_scene",
            "headline_text_overlay",
            "supporting_copy",
            "full_ai_image_prompt",
            "caption_ar",
            "caption_en",
            "text_policy",
            "conversion_trigger",
          ],
          properties: {
            platform_format: { type: "STRING" },
            design_type: { type: "STRING" },
            goal: { type: "STRING" },
            visual_scene: { type: "STRING" },
            headline_text_overlay: { type: "STRING" },
            supporting_copy: { type: "STRING" },
            full_ai_image_prompt: { type: "STRING" },
            caption_ar: { type: "STRING" },
            caption_en: { type: "STRING" },
            text_policy: { type: "STRING" },
            conversion_trigger: { type: "STRING" },
          },
        },
      },
    };
  }
  return {
    type: "OBJECT",
    required: ["item"],
    properties: {
      item: {
        type: "OBJECT",
        required: ["platform", "duration", "style", "hook_type", "scenes", "caption_ar", "caption_en", "ai_tool_instructions", "why_this_converts"],
        properties: {
          platform: { type: "STRING" },
          duration: { type: "STRING" },
          style: { type: "STRING" },
          hook_type: { type: "STRING" },
          scenes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["time", "label", "visual", "text", "audio"],
              properties: {
                time: { type: "STRING" },
                label: { type: "STRING" },
                visual: { type: "STRING" },
                text: { type: "STRING" },
                audio: { type: "STRING" },
              },
            },
          },
          caption_ar: { type: "STRING" },
          caption_en: { type: "STRING" },
          ai_tool_instructions: { type: "STRING" },
          why_this_converts: { type: "STRING" },
        },
      },
    },
  };
}

function hashIdempotencyKey(key: string): string {
  return createHash("sha256").update(String(key).trim(), "utf8").digest("hex");
}

function estimateBase64ByteLength(base64Text: string): number {
  const clean = String(base64Text ?? "").replace(/\s+/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function parseReferenceImageFromDataUrl(referenceImageValue: string): GeminiReferenceImage | undefined {
  const raw = String(referenceImageValue ?? "").trim();
  if (!raw) return undefined;
  const match = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new HttpError(400, "reference_image must be a valid base64 data URL.");
  }
  const mimeType = String(match[1] ?? "").trim().toLowerCase();
  const dataBase64 = String(match[2] ?? "").trim();
  if (!ALLOWED_REFERENCE_IMAGE_MIME.has(mimeType)) {
    throw new HttpError(400, "reference_image mime type is not supported.");
  }
  if (!dataBase64) {
    throw new HttpError(400, "reference_image payload is empty.");
  }
  const bytes = estimateBase64ByteLength(dataBase64);
  if (bytes <= 0 || bytes > MAX_REFERENCE_IMAGE_BYTES) {
    throw new HttpError(400, `reference_image is too large. Max allowed is ${MAX_REFERENCE_IMAGE_BYTES} bytes.`);
  }
  return { mimeType, dataBase64 };
}

function buildJsonCorrectionPrompt(basePrompt: string, validationErrors: string[]): string {
  return [
    basePrompt,
    "",
    "STRICT CORRECTION:",
    "Your previous output violated the JSON contract.",
    "Return ONLY valid JSON that strictly matches the required schema.",
    "Do not include markdown, code fences, or explanation text.",
    validationErrors.length ? `Fix these errors exactly: ${validationErrors.join(" | ")}` : "Fix structural JSON issues and return valid object JSON.",
  ].join("\n");
}

async function generateWithGuardrails(
  basePrompt: string,
  snapshot: SubmissionSnapshot,
  settings: GeminiSettings,
  referenceImage?: GeminiReferenceImage
): Promise<{ aiContent: Record<string, unknown>; jsonValid: boolean; retryCount: number }> {
  let retryCount = 0;
  let promptText = basePrompt;
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await callGeminiAPI(promptText, settings, undefined, referenceImage);
    if (!isPlainObject(raw)) {
      lastErrors = ["Gemini returned non-object JSON."];
    } else {
      const validationErrors = validateGeminiResponse(raw, snapshot);
      if (validationErrors.length === 0) {
        return { aiContent: raw as Record<string, unknown>, jsonValid: true, retryCount };
      }
      lastErrors = validationErrors;
    }
    if (attempt === 0) {
      retryCount += 1;
      promptText = buildJsonCorrectionPrompt(basePrompt, lastErrors);
      continue;
    }
  }
  throw new Error("Gemini validation failed after corrective retry: " + lastErrors.join(" | "));
}

function logGenerationTelemetry(meta: {
  phase: "generate" | "retry";
  promptMode: "meta" | "catalog";
  industrySource: "brief" | "fallback";
  jsonValid: boolean;
  retryCount: number;
  has_reference_image: boolean;
  correlationId: string;
  kitId?: string;
}) {
  console.info("[prompt_telemetry]", JSON.stringify(meta));
}

function serializeKit(row: KitRow) {
  const status = row.deliveryStatus;
  const palette = getStatusBadgePalette(status);
  let result: unknown = null;
  if (row.resultJson) {
    try {
      result = JSON.parse(row.resultJson);
    } catch {
      result = null;
    }
  }
  return {
    id: row.id,
    brief_json: row.briefJson,
    result_json: result,
    delivery_status: row.deliveryStatus,
    status_badge: getStatusBadgeLabel(status),
    badge_palette: palette,
    model_used: row.modelUsed,
    last_error: row.lastError,
    correlation_id: row.correlationId,
    prompt_version_id: row.promptVersionId ?? null,
    is_fallback: Boolean(row.isFallback),
    row_version: row.rowVersion,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

async function pruneExpiredIdempotency() {
  const now = Date.now();
  await db.delete(idempotencyKeys).where(lt(idempotencyKeys.expiresAt, now));
}

async function reserveIdempotencyKey(params: { keyHash: string; briefHash: string }) {
  const inserted = await db
    .insert(idempotencyKeys)
    .values({
      keyHash: params.keyHash,
      briefHash: params.briefHash,
      kitId: IDEMPOTENCY_PENDING_KIT,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    })
    .onConflictDoNothing({ target: idempotencyKeys.keyHash })
    .returning();
  return inserted[0] ?? null;
}

async function finalizeIdempotencyKey(params: { keyHash: string; briefHash: string; kitId: string }) {
  await db
    .update(idempotencyKeys)
    .set({
      kitId: params.kitId,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    })
    .where(and(eq(idempotencyKeys.keyHash, params.keyHash), eq(idempotencyKeys.briefHash, params.briefHash)));
}

function safeClientError(err: unknown, fallback = "Generation failed. Please retry."): string {
  if (err instanceof HttpError) return err.message;
  return fallback;
}

export function startIdempotencyCleanupJob(intervalMs = 10 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    void pruneExpiredIdempotency().catch((err) => {
      console.warn("[idempotency_cleanup_failed]", String(err));
    });
  }, intervalMs);
}

async function persistKit(
  snapshot: ReturnType<typeof buildSubmissionSnapshot>,
  aiContent: Record<string, unknown> | null,
  meta: {
    deliveryStatus: string;
    modelUsed: string;
    lastError: string;
    correlationId: string;
    promptVersionId?: string | null;
    isFallback?: boolean;
    rowVersion?: number;
  }
) {
  const id = nanoid();
  const now = new Date();
  const briefJson = JSON.stringify({ ...snapshot, submitted_at: snapshot.submitted_at.toISOString() });
  const inserted = await db
    .insert(kits)
    .values({
      id,
      briefJson,
      resultJson: aiContent ? JSON.stringify(aiContent) : null,
      deliveryStatus: meta.deliveryStatus,
      modelUsed: meta.modelUsed,
      lastError: meta.lastError,
      correlationId: meta.correlationId,
      promptVersionId: meta.promptVersionId ?? null,
      isFallback: meta.isFallback ?? false,
      rowVersion: meta.rowVersion ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const row = inserted[0];
  if (!row) throw new Error("Failed to read inserted kit");
  return row;
}

async function updateKit(
  id: string,
  snapshot: ReturnType<typeof buildSubmissionSnapshot>,
  aiContent: Record<string, unknown> | null,
  meta: {
    deliveryStatus: string;
    modelUsed: string;
    lastError: string;
    correlationId: string;
    promptVersionId?: string | null;
    isFallback?: boolean;
    rowVersion: number;
  }
) {
  const now = new Date();
  const briefJson = JSON.stringify({ ...snapshot, submitted_at: snapshot.submitted_at.toISOString() });
  const updated = await db
    .update(kits)
    .set({
      briefJson,
      resultJson: aiContent ? JSON.stringify(aiContent) : null,
      deliveryStatus: meta.deliveryStatus,
      modelUsed: meta.modelUsed,
      lastError: meta.lastError,
      correlationId: meta.correlationId,
      promptVersionId: meta.promptVersionId ?? null,
      isFallback: meta.isFallback ?? false,
      rowVersion: meta.rowVersion,
      updatedAt: now,
    })
    .where(and(eq(kits.id, id), eq(kits.rowVersion, meta.rowVersion - 1)))
    .returning();
  return updated[0] ?? null;
}

async function persistGenerationFailure(params: {
  snapshot: ReturnType<typeof buildSubmissionSnapshot>;
  settingsModel: string;
  reason: string;
  correlationId: string;
  promptVersionId?: string | null;
  isFallback?: boolean;
}) {
  return persistKit(params.snapshot, null, {
    deliveryStatus: "failed_generation",
    modelUsed: params.settingsModel,
    lastError: params.reason,
    correlationId: params.correlationId,
    promptVersionId: params.promptVersionId,
    isFallback: params.isFallback,
  });
}

export async function generateKitService(input: {
  idempotencyKey: string;
  body: Record<string, unknown>;
}) {
  const idemHeader = input.idempotencyKey?.trim();
  if (!idemHeader) throw new HttpError(400, "Idempotency-Key header is required.");

  const snapshot = buildSubmissionSnapshot(input.body);
  const referenceImage = parseReferenceImageFromDataUrl(snapshot.reference_image);
  const fp = briefFingerprint(snapshot);
  const keyHash = hashIdempotencyKey(idemHeader);
  const reserved = await reserveIdempotencyKey({ keyHash, briefHash: fp });
  if (!reserved) {
    const existingKey = (await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.keyHash, keyHash)).limit(1))[0];
    if (existingKey) {
      if (existingKey.briefHash !== fp) throw new HttpError(409, "Idempotency-Key already used with a different brief.");
      if (existingKey.kitId !== IDEMPOTENCY_PENDING_KIT) {
        const kit = (await db.select().from(kits).where(eq(kits.id, existingKey.kitId)).limit(1))[0];
        if (kit) return { status: 200, body: serializeKit(kit) };
      }
      throw new HttpError(409, "A request with the same Idempotency-Key is already in progress.");
    }
  }

  const demoMode = String(process.env.DEMO_MODE ?? "").toLowerCase() === "true";
  const settings = loadGeminiSettingsFromEnv();
  const correlationId = nanoid();
  const resolved = await resolvePrompt(snapshot.industry, snapshot);

  if (demoMode) {
    const aiContent = buildDemoKitContent(snapshot) as Record<string, unknown>;
    const emailResult = await sendKitEmail(snapshot, aiContent);
    const row = await persistKit(snapshot, aiContent, {
      deliveryStatus: resolveDeliveryStatus(emailResult),
      modelUsed: "demo-mode",
      lastError: emailResult.error || "",
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
    });
    await recordKitNotification(row);
    await finalizeIdempotencyKey({ keyHash, briefHash: fp, kitId: row.id });
    return { status: 200, body: serializeKit(row) };
  }

  if (!settings.apiKey) {
    const row = await persistGenerationFailure({
      snapshot,
      settingsModel: settings.model,
      reason: "Missing GEMINI_API_KEY.",
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
    });
    await recordKitNotification(row);
    await finalizeIdempotencyKey({ keyHash, briefHash: fp, kitId: row.id });
    return { status: 201, body: serializeKit(row) };
  }

  try {
    const { aiContent, jsonValid, retryCount } = await generateWithGuardrails(resolved.renderedPrompt, snapshot, settings, referenceImage);
    const emailResult = await sendKitEmail(snapshot, aiContent);
    const row = await persistKit(snapshot, aiContent, {
      deliveryStatus: resolveDeliveryStatus(emailResult),
      modelUsed: settings.model,
      lastError: emailResult.error || "",
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
    });
    logGenerationTelemetry({
      phase: "generate",
      promptMode: resolved.promptMode,
      industrySource: resolved.industrySource,
      jsonValid,
      retryCount,
      has_reference_image: Boolean(referenceImage),
      correlationId,
      kitId: row.id,
    });
    await recordKitNotification(row);
    await finalizeIdempotencyKey({ keyHash, briefHash: fp, kitId: row.id });
    return { status: 201, body: serializeKit(row) };
  } catch (err) {
    const reason = safeClientError(err);
    const row = await persistGenerationFailure({
      snapshot,
      settingsModel: settings.model,
      reason,
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
    });
    logGenerationTelemetry({
      phase: "generate",
      promptMode: resolved.promptMode,
      industrySource: resolved.industrySource,
      jsonValid: false,
      retryCount: 1,
      has_reference_image: Boolean(referenceImage),
      correlationId,
      kitId: row.id,
    });
    await recordKitNotification(row);
    const clientDelay = await sendClientDelayEmail(snapshot, correlationId);
    await sendAdminFailureAlert(snapshot, reason, correlationId, row.id, settings.model, clientDelay);
    await finalizeIdempotencyKey({ keyHash, briefHash: fp, kitId: row.id });
    return { status: 201, body: serializeKit(row) };
  }
}

export async function retryKitService(input: { id: string; brief_json: string; row_version: number }) {
  const id = input.id;
  const row = (await db.select().from(kits).where(eq(kits.id, id)).limit(1))[0];
  if (!row) throw new HttpError(404, "Not found");
  if (normalizeDeliveryStatus(row.deliveryStatus) !== "failed_generation") throw new HttpError(400, "Only failed_generation kits can be retried.");
  if (row.rowVersion !== input.row_version) throw new HttpError(409, "row_version mismatch; refresh and try again.");

  let snapshot: ReturnType<typeof buildSubmissionSnapshot>;
  try {
    snapshot = parseSubmissionSnapshotJson(input.brief_json);
  } catch (e) {
    throw new HttpError(400, String(e));
  }
  const settings = loadGeminiSettingsFromEnv();
  const correlationId = nanoid();
  const nextVersion = row.rowVersion + 1;
  const resolved = await resolvePrompt(snapshot.industry, snapshot);
  const referenceImage = parseReferenceImageFromDataUrl(snapshot.reference_image);
  const demoMode = String(process.env.DEMO_MODE ?? "").toLowerCase() === "true";

  const setRetry = await updateKit(id, snapshot, null, {
    deliveryStatus: "retry_in_progress",
    modelUsed: settings.model,
    lastError: "",
    correlationId,
    promptVersionId: resolved.promptVersionId,
    isFallback: resolved.isFallback,
    rowVersion: nextVersion,
  });
  if (!setRetry) throw new HttpError(409, "Concurrent update; refresh and try again.");

  if (demoMode) {
    const aiContent = buildDemoKitContent(snapshot) as Record<string, unknown>;
    const emailResult = await sendKitEmail(snapshot, aiContent);
    const done = (await db.update(kits).set({
      resultJson: JSON.stringify(aiContent),
      deliveryStatus: resolveDeliveryStatus(emailResult),
      lastError: emailResult.error || "",
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
      rowVersion: nextVersion + 1,
      updatedAt: new Date(),
    }).where(and(eq(kits.id, id), eq(kits.rowVersion, nextVersion))).returning())[0];
    if (!done) throw new HttpError(409, "Concurrent update; refresh and try again.");
    await recordKitNotification(done);
    return { status: 200, body: serializeKit(done) };
  }

  if (!settings.apiKey) {
    const fr = (await db.update(kits).set({
      deliveryStatus: "failed_generation",
      lastError: "Missing GEMINI_API_KEY.",
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
      rowVersion: nextVersion + 1,
      updatedAt: new Date(),
    }).where(and(eq(kits.id, id), eq(kits.rowVersion, nextVersion))).returning())[0];
    if (!fr) throw new HttpError(409, "Concurrent update; refresh and try again.");
    await recordKitNotification(fr);
    return { status: 200, body: serializeKit(fr) };
  }

  try {
    const { aiContent, jsonValid, retryCount } = await generateWithGuardrails(resolved.renderedPrompt, snapshot, settings, referenceImage);
    const emailResult = await sendKitEmail(snapshot, aiContent);
    const ok = (await db.update(kits).set({
      briefJson: JSON.stringify({ ...snapshot, submitted_at: snapshot.submitted_at.toISOString() }),
      resultJson: JSON.stringify(aiContent),
      deliveryStatus: resolveDeliveryStatus(emailResult),
      lastError: emailResult.error || "",
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
      rowVersion: nextVersion + 1,
      updatedAt: new Date(),
    }).where(and(eq(kits.id, id), eq(kits.rowVersion, nextVersion))).returning())[0];
    if (!ok) throw new HttpError(409, "Concurrent update; refresh and try again.");
    logGenerationTelemetry({
      phase: "retry",
      promptMode: resolved.promptMode,
      industrySource: resolved.industrySource,
      jsonValid,
      retryCount,
      has_reference_image: Boolean(referenceImage),
      correlationId,
      kitId: ok.id,
    });
    await recordKitNotification(ok);
    return { status: 200, body: serializeKit(ok) };
  } catch (err) {
    const reason = safeClientError(err, "Retry generation failed. Please retry.");
    const clientDelay = await sendClientDelayEmail(snapshot, correlationId);
    await sendAdminFailureAlert(snapshot, reason, correlationId, id, settings.model, clientDelay);
    const fr = (await db.update(kits).set({
      deliveryStatus: "failed_generation",
      lastError: reason,
      correlationId,
      promptVersionId: resolved.promptVersionId,
      isFallback: resolved.isFallback,
      rowVersion: nextVersion + 1,
      updatedAt: new Date(),
    }).where(and(eq(kits.id, id), eq(kits.rowVersion, nextVersion))).returning())[0];
    if (!fr) throw new HttpError(409, "Concurrent update; refresh and try again.");
    logGenerationTelemetry({
      phase: "retry",
      promptMode: resolved.promptMode,
      industrySource: resolved.industrySource,
      jsonValid: false,
      retryCount: 1,
      has_reference_image: Boolean(referenceImage),
      correlationId,
      kitId: fr.id,
    });
    await recordKitNotification(fr);
    return { status: 200, body: serializeKit(fr) };
  }
}

export async function regenerateKitItemService(input: {
  id: string;
  item_type: RegenerateItemType;
  index: number;
  row_version: number;
  feedback?: string;
}) {
  const row = (await db.select().from(kits).where(eq(kits.id, input.id)).limit(1))[0];
  if (!row) throw new HttpError(404, "Not found");
  if (row.rowVersion !== input.row_version) throw new HttpError(409, "row_version mismatch; refresh and try again.");
  if (!row.resultJson) throw new HttpError(422, "Kit has no generated content to regenerate.");

  let snapshot: ReturnType<typeof buildSubmissionSnapshot>;
  try {
    snapshot = parseSubmissionSnapshotJson(row.briefJson);
  } catch (e) {
    throw new HttpError(400, String(e));
  }
  const referenceImage = parseReferenceImageFromDataUrl(snapshot.reference_image);

  let resultObj: Record<string, unknown>;
  try {
    const parsed = JSON.parse(row.resultJson);
    if (!isPlainObject(parsed)) throw new Error("invalid");
    resultObj = parsed as Record<string, unknown>;
  } catch {
    throw new HttpError(422, "Existing result_json is invalid JSON.");
  }
  const section = getSectionArray(resultObj, input.item_type);
  if (!section) throw new HttpError(422, `No ${input.item_type} section found in kit.`);
  if (input.index >= section.items.length) throw new HttpError(422, `Index out of range. max=${section.items.length - 1}`);

  const settings = loadGeminiSettingsFromEnv();
  if (!settings.apiKey) throw new HttpError(500, "Missing GEMINI_API_KEY.");
  const correlationId = nanoid();
  const resolved = await resolvePrompt(snapshot.industry, snapshot);
  const schema = getRegenerateItemSchema(input.item_type);
  const feedbackLine = input.feedback?.trim()
    ? `User feedback (must be applied): ${input.feedback.trim()}`
    : "User feedback: none provided.";
  const promptText = [
    "You are regenerating exactly ONE item inside an existing content kit.",
    "Return JSON with shape: {\"item\": { ... }} matching the provided schema exactly.",
    "Do not return arrays, wrappers, markdown, or extra keys.",
    `Target item type: ${input.item_type}`,
    `Target section key: ${section.key}`,
    `Target index: ${input.index}`,
    feedbackLine,
    "",
    "Original full creative context:",
    resolved.renderedPrompt,
    referenceImage
      ? "A visual reference image is attached for this request. Preserve its visual style and color direction in the regenerated item."
      : "No visual reference image is attached for this request.",
    "",
    "Current item to replace:",
    JSON.stringify(section.items[input.index], null, 2),
  ].join("\n");

  let generated: unknown;
  try {
    generated = await callGeminiAPI(promptText, settings, schema, referenceImage);
  } catch (e) {
    throw new HttpError(502, `Regenerate failed: ${String(e)}`);
  }
  if (!isPlainObject(generated) || !("item" in generated) || !isPlainObject(generated.item)) {
    throw new HttpError(502, "Model returned invalid regenerate payload.");
  }

  const merged = { ...resultObj } as Record<string, unknown>;
  const updatedItems = [...section.items];
  updatedItems[input.index] = generated.item as Record<string, unknown>;
  merged[section.key] = updatedItems;
  const updated = await db
    .update(kits)
    .set({
      resultJson: JSON.stringify(merged),
      correlationId,
      modelUsed: settings.model,
      lastError: "",
      rowVersion: row.rowVersion + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(kits.id, input.id), eq(kits.rowVersion, input.row_version)))
    .returning();
  if (!updated.length) throw new HttpError(409, "Concurrent update; refresh and try again.");
  return { status: 200, body: serializeKit(updated[0]!) };
}

export async function listKitsService() {
  const rows = await db.select().from(kits).orderBy(desc(kits.createdAt)).limit(200);
  return rows.map(serializeKit);
}

export async function getKitByIdService(id: string) {
  const row = (await db.select().from(kits).where(eq(kits.id, id)).limit(1))[0];
  if (!row) throw new HttpError(404, "Not found");
  return serializeKit(row);
}
