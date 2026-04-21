import { describe, expect, it, beforeEach } from "vitest";
import { Hono } from "hono";

async function resolveIpFromHeaders(headers: Record<string, string | undefined>) {
  const { resolveClientIp } = await import("./rateLimit.js");
  const app = new Hono();
  app.get("/ip", (c) => c.json({ ip: resolveClientIp(c) }));
  const filtered = Object.fromEntries(
    Object.entries(headers).filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;
  const res = await app.request("/ip", { headers: filtered });
  const body = await res.json();
  return body.ip as string;
}

describe("resolveClientIp", () => {
  beforeEach(() => {
    delete process.env.TRUST_X_FORWARDED_FOR;
  });

  it("prefers cf-connecting-ip then x-real-ip", async () => {
    const ip = await resolveIpFromHeaders({
      "cf-connecting-ip": "198.51.100.10",
      "x-real-ip": "203.0.113.25",
      "x-forwarded-for": "203.0.113.99",
    });
    expect(ip).toBe("198.51.100.10");
  });

  it("falls back to x-real-ip when cf header is absent", async () => {
    const ip = await resolveIpFromHeaders({
      "x-real-ip": "203.0.113.25",
      "x-forwarded-for": "203.0.113.99",
    });
    expect(ip).toBe("203.0.113.25");
  });

  it("ignores x-forwarded-for unless explicit trust is enabled", async () => {
    const ip = await resolveIpFromHeaders({
      "x-forwarded-for": "203.0.113.99",
    });
    expect(ip).toBe("local");
  });

  it("uses first forwarded hop only when trust is enabled", async () => {
    process.env.TRUST_X_FORWARDED_FOR = "true";
    const ip = await resolveIpFromHeaders({
      "x-forwarded-for": "203.0.113.99, 10.0.0.1",
    });
    expect(ip).toBe("203.0.113.99");
  });

  it("rejects malformed spoofed values and falls back safely", async () => {
    process.env.TRUST_X_FORWARDED_FOR = "true";
    const ip = await resolveIpFromHeaders({
      "x-forwarded-for": ",, ,",
    });
    expect(ip).toBe("local");
  });
});

