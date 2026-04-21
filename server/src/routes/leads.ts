import { Hono } from "hono";
import { z } from "zod";
import { getAuthUser } from "../middleware/userAuth.js";
import { ensureUserFromSupabase } from "../services/subscriptionService.js";
import { db } from "../db/index.js";
import { premiumLeadRateLimit } from "../middleware/rateLimit.js";
import { createPremiumLead, sendPremiumLeadNotification } from "../services/premiumLeadService.js";

const premiumRequestBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(40)
    .regex(/^[+()0-9\-\s]+$/),
  email: z.string().trim().email().max(200).optional(),
});

export function createLeadsRouter() {
  const app = new Hono();

  app.post("/api/leads/premium-request", premiumLeadRateLimit, async (c) => {
    let body: z.infer<typeof premiumRequestBodySchema>;
    try {
      body = premiumRequestBodySchema.parse(await c.req.json());
    } catch {
      return c.json({ error: "Invalid body." }, 400);
    }

    const authUser = getAuthUser(c);
    let userId: string | null = null;
    if (authUser) {
      const user = await ensureUserFromSupabase(db, authUser);
      userId = user.id;
    }

    await createPremiumLead({
      userId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      source: "pricing_modal",
    });

    await sendPremiumLeadNotification({
      userId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      source: "pricing_modal",
    });

    return c.json({ ok: true });
  });

  return app;
}
