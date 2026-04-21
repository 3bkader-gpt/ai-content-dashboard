import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const verifyAgencyAdminSessionToken = vi.fn();

vi.mock("./agencyAdminAuth.js", () => ({
  verifyAgencyAdminSessionToken,
}));

async function secureRequest(init?: RequestInit) {
  const { bearerAuth } = await import("./auth.js");
  const app = new Hono();
  app.use("*", bearerAuth);
  app.get("/secure", (c) => c.json({ ok: true }));
  return app.request("/secure", init);
}

describe("bearerAuth boundary hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_SECRET = "service-secret";
    process.env.NODE_ENV = "test";
  });

  it("rejects spoofed origin without trusted auth channel", async () => {
    const res = await secureRequest({
      headers: {
        Origin: "https://trusted.example.com",
        Referer: "https://trusted.example.com/app",
        Authorization: "Bearer invalid-garbage-token",
      },
    });
    expect(res.status).toBe(401);
  });

  it("allows JWT-like bearer token pass-through", async () => {
    const res = await secureRequest({
      headers: {
        Authorization: "Bearer aaa.bbb.ccc",
      },
    });
    expect(res.status).toBe(200);
  });

  it("rejects malformed non-secret bearer tokens", async () => {
    const res = await secureRequest({
      headers: {
        Authorization: "Bearer not-a-jwt",
      },
    });
    expect(res.status).toBe(401);
  });

  it("allows valid agency admin session header", async () => {
    verifyAgencyAdminSessionToken.mockResolvedValueOnce({
      sub: "agency-admin",
      username: "admin",
    });

    const res = await secureRequest({
      headers: {
        "X-Agency-Admin-Session": "session-token",
      },
    });

    expect(res.status).toBe(200);
    expect(verifyAgencyAdminSessionToken).toHaveBeenCalledWith("session-token");
  });
});
