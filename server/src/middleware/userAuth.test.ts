import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const createRemoteJWKSet = vi.fn();
const jwtVerify = vi.fn();

vi.mock("jose", () => ({
  createRemoteJWKSet,
  jwtVerify,
  errors: {
    JWTExpired: class JWTExpired extends Error {},
    JWTClaimValidationFailed: class JWTClaimValidationFailed extends Error {},
    JWSSignatureVerificationFailed: class JWSSignatureVerificationFailed extends Error {},
    JOSEError: class JOSEError extends Error {},
  },
}));

async function secureRequest(token: string) {
  const { optionalSupabaseUser } = await import("./userAuth.js");
  const app = new Hono();
  app.use("*", optionalSupabaseUser);
  app.get("/secure", (c) => c.json({ ok: true, authUser: (c as any).get("authUser") ?? null }));
  return app.request("/secure", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

describe("userAuth JWKS cache TTL", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.API_SECRET = "service-secret";
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_JWKS_CACHE_TTL_MS = "60000";
    createRemoteJWKSet.mockImplementation((url: URL) => ({ url: String(url) }));
    jwtVerify.mockResolvedValue({
      payload: { sub: "user-1", email: "u@example.com" },
    });
  });

  it("reuses resolver before TTL and refreshes after TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    try {
      const token = "aaa.bbb.ccc";
      const first = await secureRequest(token);
      expect(first.status).toBe(200);
      expect(createRemoteJWKSet).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date("2026-01-01T00:00:30.000Z"));
      const second = await secureRequest(token);
      expect(second.status).toBe(200);
      expect(createRemoteJWKSet).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date("2026-01-01T00:02:30.000Z"));
      const third = await secureRequest(token);
      expect(third.status).toBe(200);
      expect(createRemoteJWKSet).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

