import type { SubmissionSnapshot } from "../logic/constants.js";

export async function notifyTelegramNewLead(input: {
  snapshot: SubmissionSnapshot;
  kitId: string;
  correlationId: string;
}) {
  const webhookUrl = String(process.env.TELEGRAM_WEBHOOK_URL ?? "").trim();
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID ?? "").trim();
  const threadId = String(process.env.TELEGRAM_THREAD_ID ?? "").trim();

  const adminBaseUrl = String(process.env.ADMIN_BASE_URL ?? "").trim();
  const adminLink = adminBaseUrl ? `${adminBaseUrl.replace(/\/$/, "")}/admin/kits/${input.kitId}` : "";
  const sourceLabel = input.snapshot.source_mode === "agency" ? "agency" : "self_serve";

  const lines = [
    "New content request received",
    `Source: ${sourceLabel}`,
    `Client: ${input.snapshot.client_name || "-"}`,
    `Phone: ${input.snapshot.client_phone || "-"}`,
    `Email: ${input.snapshot.client_email || input.snapshot.email || "-"}`,
    `Brand: ${input.snapshot.brand_name || "-"}`,
    `Mode: ${input.snapshot.campaign_mode || "-"}`,
    `Kit ID: ${input.kitId}`,
    `Correlation: ${input.correlationId}`,
    adminLink ? `Admin: ${adminLink}` : "",
  ].filter(Boolean);

  const text = lines.join("\n");

  try {
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.warn("[telegram_notify_failed]", JSON.stringify({ status: response.status, body }));
      }
      return;
    }

    if (botToken && chatId) {
      const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const payload: Record<string, unknown> = {
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      };
      if (threadId) {
        const parsedThread = Number(threadId);
        if (Number.isFinite(parsedThread) && parsedThread > 0) {
          payload.message_thread_id = parsedThread;
        }
      }
      const response = await fetch(sendMessageUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.text();
        console.warn("[telegram_bot_notify_failed]", JSON.stringify({ status: response.status, body }));
      }
    }
  } catch (error) {
    console.warn("[telegram_notify_error]", String(error));
  }
}

export async function notifyTelegramPremiumRequest(input: {
  name: string;
  phone: string;
  email?: string;
  userId?: string | null;
  source?: string;
}) {
  const webhookUrl = String(process.env.TELEGRAM_WEBHOOK_URL ?? "").trim();
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID ?? "").trim();
  const threadId = String(process.env.TELEGRAM_THREAD_ID ?? "").trim();

  const lines = [
    "New Premium Package Request",
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email?.trim() || "-"}`,
    `User ID: ${input.userId || "-"}`,
    `Source: ${input.source || "pricing_modal"}`,
  ];
  const text = lines.join("\n");

  try {
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.warn("[telegram_premium_notify_failed]", JSON.stringify({ status: response.status, body }));
      }
      return;
    }

    if (!botToken || !chatId) return;

    const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };
    if (threadId) {
      const parsedThread = Number(threadId);
      if (Number.isFinite(parsedThread) && parsedThread > 0) {
        payload.message_thread_id = parsedThread;
      }
    }
    const response = await fetch(sendMessageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text();
      console.warn("[telegram_premium_bot_notify_failed]", JSON.stringify({ status: response.status, body }));
    }
  } catch (error) {
    console.warn("[telegram_premium_notify_error]", String(error));
  }
}
