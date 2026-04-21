import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthUser = vi.fn();
const ensureUserFromSupabase = vi.fn();
const createPremiumLead = vi.fn();
const sendPremiumLeadNotification = vi.fn();

vi.mock("../middleware/userAuth.js", () => ({
  getAuthUser,
}));

vi.mock("../services/subscriptionService.js", () => ({
  ensureUserFromSupabase,
}));

vi.mock("../services/premiumLeadService.js", () => ({
  createPremiumLead,
  sendPremiumLeadNotification,
}));

vi.mock("../db/index.js", () => ({
  db: {},
}));

describe("premium leads route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthUser.mockReturnValue(null);
    ensureUserFromSupabase.mockResolvedValue({ id: "user-1" });
  });

  it("validates request body", async () => {
    const { createLeadsRouter } = await import("./leads.js");
    const app = createLeadsRouter();
    const res = await app.request("/api/leads/premium-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", phone: "abc" }),
    });
    expect(res.status).toBe(400);
  });

  it("stores and notifies for valid requests", async () => {
    const { createLeadsRouter } = await import("./leads.js");
    const app = createLeadsRouter();
    const res = await app.request("/api/leads/premium-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ahmed Ali", phone: "+20100111222", email: "a@b.com" }),
    });

    expect(res.status).toBe(200);
    expect(createPremiumLead).toHaveBeenCalledTimes(1);
    expect(sendPremiumLeadNotification).toHaveBeenCalledTimes(1);
  });
});
