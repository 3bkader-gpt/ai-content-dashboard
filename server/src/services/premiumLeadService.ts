import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { premiumLeads } from "../db/schema.js";
import { notifyTelegramPremiumRequest } from "./telegramNotifier.js";

export async function createPremiumLead(input: {
  userId: string | null;
  name: string;
  phone: string;
  email?: string;
  source?: string;
}) {
  await db.insert(premiumLeads).values({
    id: nanoid(),
    userId: input.userId,
    name: input.name,
    phone: input.phone,
    email: input.email?.trim() || null,
    source: input.source ?? "pricing_modal",
    createdAt: new Date(),
  });
}

export async function sendPremiumLeadNotification(input: {
  userId: string | null;
  name: string;
  phone: string;
  email?: string;
  source?: string;
}) {
  await notifyTelegramPremiumRequest({
    userId: input.userId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    source: input.source,
  });
}
