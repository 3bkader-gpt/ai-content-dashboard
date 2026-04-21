import type { Context, Next } from "hono";
import { verifyAgencyAdminSessionToken } from "./agencyAdminAuth.js";

function parseBearerToken(raw: string): string {
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
}

function isJwtLikeToken(token: string): boolean {
  // Minimal structural gate: JWTs are 3 dot-separated base64url sections.
  if (!token || token === "undefined" || token === "null") return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export async function bearerAuth(c: Context, next: Next) {
  const secret = String(process.env.API_SECRET ?? "").trim();
  const isProd = String(process.env.NODE_ENV ?? "").toLowerCase() === "production";
  const auth = c.req.header("authorization") ?? "";
  const bearerToken = parseBearerToken(auth);

  // Path 1: explicit bearer auth (service secret or JWT-like bearer token).
  // Filter out common JS garbage tokens like "undefined" or "null" strings.
  if (bearerToken && bearerToken !== "undefined" && bearerToken !== "null") {
    if (!secret) {
      if (isProd) {
        console.error("[SECURITY] Authorization header provided but API_SECRET is missing in production.");
      }
      return c.json({ error: "Server misconfiguration: API auth is not configured." }, 503);
    }

    // Service-to-service secret bearer.
    if (bearerToken === secret) {
      return await next();
    }

    // Browser/user auth bearer (JWT) continues; signature verification happens downstream.
    if (isJwtLikeToken(bearerToken)) {
      return await next();
    }

    return c.json({ error: "Unauthorized" }, 401);
  }

  // Path 2: explicit admin session header (for internal admin channels).
  const adminSessionToken = (c.req.header("x-agency-admin-session") ?? "").trim();
  if (adminSessionToken) {
    const adminSession = await verifyAgencyAdminSessionToken(adminSessionToken);
    if (!adminSession) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("agencyAdminSession", adminSession);
    return await next();
  }
  // Path 3: no auth headers provided.
  // Allow downstream middleware (e.g., optionalSupabaseUser) or route handler to proceed.
  return await next();
}
