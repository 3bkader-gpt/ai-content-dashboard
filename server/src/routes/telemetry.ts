import { Hono } from "hono";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import type { Next } from "hono";
import { db } from "../db/index.js";
import { kitInteractions, kits } from "../db/schema.js";
import { getAuthUser } from "../middleware/userAuth.js";
import { ensureUserFromSupabase } from "../services/subscriptionService.js";

const deviceIdSchema = z.string().uuid();

const telemetryBodySchema = z.object({
  kit_id: z.string().trim().min(1),
  interaction_type: z.string().trim().min(2).max(64),
  meta: z.record(z.string(), z.unknown()).optional(),
});

function requireDeviceId(c: import("hono").Context): { ok: true; deviceId: string } | { ok: false; response: Response } {
  const raw = c.req.header("X-Device-ID")?.trim() ?? "";
  const parsed = deviceIdSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json({ error: "Missing or invalid X-Device-ID header." }, 400),
    };
  }
  return { ok: true, deviceId: parsed.data };
}

async function resolveOwner(c: import("hono").Context) {
  const device = requireDeviceId(c);
  if (!device.ok) return device;
  const authUser = getAuthUser(c);
  if (!authUser) return { ok: true as const, owner: { deviceId: device.deviceId, userId: null as string | null } };
  const user = await ensureUserFromSupabase(db, authUser);
  return { ok: true as const, owner: { deviceId: device.deviceId, userId: user.id } };
}

export function createTelemetryRouter(mw: (c: import("hono").Context, next: Next) => Promise<void | Response>) {
  const app = new Hono();
  app.use("/api/telemetry/*", mw);

  app.post("/api/telemetry/interaction", async (c) => {
    const ownerRes = await resolveOwner(c);
    if (!ownerRes.ok) return ownerRes.response;
    const owner = ownerRes.owner;

    let body: z.infer<typeof telemetryBodySchema>;
    try {
      body = telemetryBodySchema.parse(await c.req.json());
    } catch {
      return c.json({ error: "Invalid telemetry payload." }, 400);
    }

    const kit = (
      await db
        .select({ id: kits.id })
        .from(kits)
        .where(
          and(eq(kits.id, body.kit_id), owner.userId ? eq(kits.userId, owner.userId) : eq(kits.deviceId, owner.deviceId))
        )
        .limit(1)
    )[0];

    if (!kit) {
      return c.json({ error: "Kit not found." }, 404);
    }

    try {
      const { nanoid } = await import("nanoid");
      const now = new Date();
      await db.insert(kitInteractions).values({
        id: nanoid(),
        kitId: body.kit_id,
        userId: owner.userId ?? null,
        deviceId: owner.deviceId,
        interactionType: body.interaction_type,
        metaJson: body.meta ?? {},
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.warn("[telemetry] non-blocking insert failure", String(err));
    }

    return c.json({ ok: true }, 202);
  });

  return app;
}
