import { Hono } from "hono";
import { z } from "zod";
import type { Next } from "hono";
import { db } from "../db/index.js";
import { getAuthUser } from "../middleware/userAuth.js";
import {
  authSyncRateLimit,
  authSyncUserRateLimit,
  authSyncDeviceRateLimit,
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
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

function isAgencyEdition() {
  return String(process.env.APP_EDITION ?? "").trim().toLowerCase() === "agency";
}

export function createAuthRouter(mw: (c: import("hono").Context, next: Next) => Promise<void | Response>) {
  const app = new Hono();
  app.use("/api/auth/*", mw);

  app.get("/api/auth/me", async (c) => {
    const device = requireDeviceId(c);
    if (!device.ok) return device.response;
    const authUser = getAuthUser(c);
    let userId: string | null = null;
    let email = "";
    let displayName = "";
    if (authUser) {
      const user = await ensureUserFromSupabase(db, authUser);
      userId = user.id;
      email = user.email;
      displayName = user.displayName;
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

  app.post("/api/auth/agency-admin/login", async (c) => {
    if (!isAgencyEdition()) return c.json({ error: "Not available in this edition." }, 404);
    let body: z.infer<typeof agencyAdminLoginSchema>;
    try {
      body = agencyAdminLoginSchema.parse(await c.req.json());
    } catch {
      return c.json({ error: "Invalid body." }, 400);
    }

    const expectedUsername = String(process.env.ADMIN_USERNAME ?? "admin").trim() || "admin";
    const expectedPassword = String(process.env.ADMIN_PASSWORD ?? "").trim();
    if (!expectedPassword) {
      return c.json({ error: "Server misconfiguration: ADMIN_PASSWORD is missing." }, 503);
    }
    if (body.username !== expectedUsername || body.password !== expectedPassword) {
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

  return app;
}

