import { Hono } from "hono";
import { z } from "zod";
import type { Next } from "hono";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "../db/index.js";
import { getAuthUser } from "../middleware/userAuth.js";
import {
  authSyncRateLimit,
  authSyncUserRateLimit,
  authSyncDeviceRateLimit,
  agencyAdminLoginRateLimit,
} from "../middleware/rateLimit.js";
import {
  ensureUserFromSupabase,
  linkDeviceToUserAndClaimKits,
  resolveAccessContext,
} from "../services/subscriptionService.js";
import {
  issueAgencyAdminSessionToken,
  isAgencyAdminRequest,
} from "../middleware/agencyAdminAuth.js";

const deviceSchema = z.string().uuid();

function requireDeviceId(c: import("hono").Context): { ok: true; deviceId: string } | { ok: false; response: Response } {
  const raw = c.req.header("X-Device-ID")?.trim() ?? "";
  const parsed = deviceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json({ error: "Missing or invalid X-Device-ID header." }, 400),
    };
  }
  return { ok: true, deviceId: parsed.data };
}

const syncBodySchema = z.object({
  device_id: z.string().uuid(),
});

const agencyAdminLoginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(512),
});

function isAgencyEdition() {
  return String(process.env.APP_EDITION ?? "").trim().toLowerCase() === "agency";
}

function timingSafeStringEquals(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (inputBuffer.length !== expectedBuffer.length) {
    // Equal-length fallback to keep timing profile closer for mismatch lengths.
    const padding = Buffer.alloc(Math.max(inputBuffer.length, expectedBuffer.length, 1));
    timingSafeEqual(padding, padding);
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}

function utf8ByteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function sha256Prefix(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}

export function createAuthRouter(mw: (c: import("hono").Context, next: Next) => Promise<void | Response>) {
  const app = new Hono();

  app.get("/api/auth/me", async (c, next) => await mw(c, next), async (c) => {
    const device = requireDeviceId(c);
    if (!device.ok) return device.response;
    const authUser = getAuthUser(c);
    let userId: string | null = null;
    let email = "";
    let displayName = "";
    let isPremium = false;
    if (authUser) {
      const user = await ensureUserFromSupabase(db, authUser);
      userId = user.id;
      email = user.email;
      displayName = user.displayName;
      isPremium = user.isPremium;
    }
    const access = await resolveAccessContext(db, {
      userId,
      deviceId: device.deviceId,
    });
    return c.json({
      authenticated: Boolean(authUser),
      user_id: access.userId,
      email,
      display_name: displayName,
      is_premium: isPremium,
      plan_code: access.planCode,
      usage: {
        period_key: access.usage.periodKey,
        video_prompts_used: access.usage.videoPromptsUsed,
        image_prompts_used: access.usage.imagePromptsUsed,
        retry_used: access.usage.retryUsed,
        regenerate_used: access.usage.regenerateUsed,
      },
    });
  });

  /* ── POST /api/auth/sync ──────────────────────────────────────────
   * Triple-layer rate-limit applied *in addition to* the global
   * guard (mw) so that spam on this endpoint doesn't burn the
   * global budget:
   *   Layer 1 – IP-based        (stops basic flooding)
   *   Layer 2 – User ID-based   (stops IP-rotation attacks)
   *   Layer 3 – Device ID-based (stops multi-account attacks)
   * ---------------------------------------------------------------- */
  app.post(
    "/api/auth/sync",
    async (c, next) => await mw(c, next),
    async (c, next) => await authSyncRateLimit(c, next),
    async (c, next) => await authSyncUserRateLimit(c, next),
    async (c, next) => await authSyncDeviceRateLimit(c, next),
    async (c) => {
    const authUser = getAuthUser(c);
    if (!authUser) return c.json({ error: "Login required." }, 401);
    let body: z.infer<typeof syncBodySchema>;
    try {
      body = syncBodySchema.parse(await c.req.json());
    } catch {
      return c.json({ error: "Invalid body: device_id required." }, 400);
    }
    const user = await ensureUserFromSupabase(db, authUser);
    await linkDeviceToUserAndClaimKits(db, user.id, body.device_id);
    const access = await resolveAccessContext(db, {
      userId: user.id,
      deviceId: body.device_id,
    });
    return c.json({
      ok: true,
      user_id: user.id,
      plan_code: access.planCode,
      usage: {
        period_key: access.usage.periodKey,
        video_prompts_used: access.usage.videoPromptsUsed,
        image_prompts_used: access.usage.imagePromptsUsed,
        retry_used: access.usage.retryUsed,
        regenerate_used: access.usage.regenerateUsed,
      },
    });
  });

  app.post("/api/auth/agency-admin/login", async (c, next) => await agencyAdminLoginRateLimit(c, next), async (c) => {
    if (!isAgencyEdition()) return c.json({ error: "Not available in this edition." }, 404);
    let body: z.infer<typeof agencyAdminLoginSchema>;
    try {
      body = agencyAdminLoginSchema.parse(await c.req.json());
    } catch {
      return c.json({ error: "Invalid body." }, 400);
    }

    if (utf8ByteLength(body.username) > 64 || utf8ByteLength(body.password) > 512) {
      return c.json({ error: "Invalid body." }, 400);
    }

    const expectedUsername = String(process.env.ADMIN_USERNAME ?? "admin").trim() || "admin";
    const expectedPassword = String(process.env.ADMIN_PASSWORD ?? "").trim();
    if (!expectedPassword) {
      return c.json({ error: "Server misconfiguration: ADMIN_PASSWORD is missing." }, 503);
    }
    const usernameMatches = timingSafeStringEquals(body.username, expectedUsername);
    const passwordMatches = timingSafeStringEquals(body.password, expectedPassword);
    if (!usernameMatches || !passwordMatches) {
      return c.json({ error: "Invalid username or password." }, 401);
    }

    const token = await issueAgencyAdminSessionToken(body.username);
    if (!token) {
      return c.json({ error: "Server misconfiguration: ADMIN_AUTH_SECRET is missing." }, 503);
    }
    return c.json({
      ok: true,
      username: body.username,
      token,
    });
  });

  app.get("/api/auth/agency-admin/session", async (c) => {
    if (!isAgencyEdition()) return c.json({ error: "Not available in this edition." }, 404);
    const ok = await isAgencyAdminRequest(c);
    if (!ok) return c.json({ valid: false }, 401);
    return c.json({ valid: true });
  });

  app.get("/api/auth/agency-admin/debug-env", async (c) => {
    const debugSecret = String(process.env.ADMIN_DEBUG_SECRET ?? "").trim();
    if (!debugSecret) {
      return c.json({ error: "Not found." }, 404);
    }
    const providedSecret = String(c.req.header("X-Admin-Debug-Secret") ?? "").trim();
    if (!providedSecret || !timingSafeStringEquals(providedSecret, debugSecret)) {
      return c.json({ error: "Unauthorized." }, 401);
    }

    const username = String(process.env.ADMIN_USERNAME ?? "admin").trim() || "admin";
    const password = String(process.env.ADMIN_PASSWORD ?? "").trim();
    const edition = String(process.env.APP_EDITION ?? "").trim().toLowerCase();
    const authSecret = String(process.env.ADMIN_AUTH_SECRET ?? "").trim();

    return c.json({
      app_edition: edition || "(empty)",
      admin_username: {
        value_preview: username.slice(0, 2) + "***",
        length: username.length,
        hash12: sha256Prefix(username),
      },
      admin_password: {
        present: Boolean(password),
        length: password.length,
        hash12: password ? sha256Prefix(password) : null,
      },
      admin_auth_secret: {
        present: Boolean(authSecret),
        length: authSecret.length,
      },
    });
  });

  return app;
}

