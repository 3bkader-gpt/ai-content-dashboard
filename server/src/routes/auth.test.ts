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
    process.env.AGENCY_ADMIN_LOGIN_RATE_LIMIT = "1";
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
    expect(third.status).toBe(429);
    expect(third.headers.get("Retry-After")).toBeTruthy();
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
});

