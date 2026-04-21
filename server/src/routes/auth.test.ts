import { beforeEach, describe, expect, it, vi } from "vitest";

const issueAgencyAdminSessionToken = vi.fn();
const isAgencyAdminRequest = vi.fn();

vi.mock("../db/index.js", () => ({
  db: {},
}));

vi.mock("../middleware/userAuth.js", () => ({
  getAuthUser: vi.fn(() => null),
}));

vi.mock("../services/subscriptionService.js", () => ({
  ensureUserFromSupabase: vi.fn(),
  linkDeviceToUserAndClaimKits: vi.fn(),
  resolveAccessContext: vi.fn(),
}));

vi.mock("../middleware/agencyAdminAuth.js", () => ({
  issueAgencyAdminSessionToken,
  isAgencyAdminRequest,
}));

async function appRequest(path: string, init?: RequestInit) {
  const { createAuthRouter } = await import("./auth.js");
  const app = createAuthRouter(async (_c, next) => next());
  return app.request(path, init);
}

describe("auth routes admin login throttling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.APP_EDITION = "agency";
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "pass-123";
    process.env.ADMIN_AUTH_SECRET = "secret";
    process.env.AGENCY_ADMIN_LOGIN_RATE_LIMIT = "3";
    process.env.AGENCY_ADMIN_LOGIN_RATE_WINDOW_MS = "60000";
    issueAgencyAdminSessionToken.mockResolvedValue("token-1");
    isAgencyAdminRequest.mockResolvedValue(false);
  });

  it("applies rate-limit on agency-admin login", async () => {
    const body = JSON.stringify({ username: "admin", password: "pass-123" });
    const headers = { "Content-Type": "application/json", "x-real-ip": "2.2.2.2" };
    const first = await appRequest("/api/auth/agency-admin/login", {
      method: "POST",
      headers,
      body,
    });
    expect(first.status).toBe(200);
    const second = await appRequest("/api/auth/agency-admin/login", {
      method: "POST",
      headers,
      body,
    });
    expect(second.status).toBe(200);
    const third = await appRequest("/api/auth/agency-admin/login", {
      method: "POST",
      headers,
      body,
    });
    expect(third.status).toBe(200);
    const fourth = await appRequest("/api/auth/agency-admin/login", {
      method: "POST",
      headers,
      body,
    });
    expect(fourth.status).toBe(429);
    expect(fourth.headers.get("Retry-After")).toBeTruthy();
  });

  it("keeps invalid credentials contract unchanged", async () => {
    const res = await appRequest("/api/auth/agency-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": "2.2.2.3" },
      body: JSON.stringify({ username: "admin", password: "wrong-pass" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid username or password.");
  });

  it("applies minimum clamp when admin login limit is configured too low", async () => {
    process.env.AGENCY_ADMIN_LOGIN_RATE_LIMIT = "1";
    vi.resetModules();
    const body = JSON.stringify({ username: "admin", password: "pass-123" });
    const headers = { "Content-Type": "application/json", "x-real-ip": "2.2.2.9" };
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const res = await appRequest("/api/auth/agency-admin/login", { method: "POST", headers, body });
      statuses.push(res.status);
    }
    expect(statuses[0]).toBe(200);
    expect(statuses[1]).toBe(200);
    expect(statuses[2]).toBe(429);
  });

  it("rejects too-long username/password payloads", async () => {
    const res = await appRequest("/api/auth/agency-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": "2.2.2.10" },
      body: JSON.stringify({ username: "u".repeat(65), password: "p".repeat(513) }),
    });
    expect(res.status).toBe(400);
  });

  it("keeps admin login public even when protected auth middleware blocks other routes", async () => {
    const { createAuthRouter } = await import("./auth.js");
    const guardedApp = createAuthRouter(async (c, _next) => c.json({ error: "Unauthorized" }, 401));

    const login = await guardedApp.request("/api/auth/agency-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": "2.2.2.11" },
      body: JSON.stringify({ username: "admin", password: "pass-123" }),
    });
    expect(login.status).toBe(200);

    const me = await guardedApp.request("/api/auth/me", {
      headers: { "X-Device-ID": "11111111-1111-1111-1111-111111111111" },
    });
    expect(me.status).toBe(401);
  });
});

