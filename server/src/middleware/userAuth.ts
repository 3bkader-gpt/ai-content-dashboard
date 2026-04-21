import {
  createRemoteJWKSet,
  jwtVerify,
  errors as joseErrors,
} from "jose";
import type { Context, Next } from "hono";
import { isGarbageToken } from "../lib/authUtils";

export type AuthUserClaims = {
  supabaseUserId: string;
  email: string;
  displayName: string;
};

type CachedJwks = {
  resolver: ReturnType<typeof createRemoteJWKSet>;
  cachedAtMs: number;
};

const jwksCache = new Map<string, CachedJwks>();

function resolveJwksCacheTtlMs(): number {
  const raw = parseInt(process.env.SUPABASE_JWKS_CACHE_TTL_MS ?? String(60 * 60 * 1000), 10);
  if (!Number.isFinite(raw) || raw <= 0) return 60 * 60 * 1000;
  return Math.min(Math.max(raw, 60_000), 24 * 60 * 60 * 1000);
}

const JWKS_CACHE_TTL_MS = resolveJwksCacheTtlMs();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of jwksCache.entries()) {
    if (now - entry.cachedAtMs > JWKS_CACHE_TTL_MS) {
      jwksCache.delete(key);
    }
  }
}, Math.min(Math.max(Math.floor(JWKS_CACHE_TTL_MS / 2), 60_000), 10 * 60_000)).unref();

function getSupabaseJwks(url: string) {
  const normalized = url.trim().replace(/\/+$/, "");
  const key = `${normalized}/auth/v1/.well-known/jwks.json`;
  const cached = jwksCache.get(key);
  if (cached && Date.now() - cached.cachedAtMs <= JWKS_CACHE_TTL_MS) return cached.resolver;
  const jwks = createRemoteJWKSet(new URL(key));
  jwksCache.set(key, { resolver: jwks, cachedAtMs: Date.now() });
  return jwks;
}

function parseBearerToken(c: Context): string {
  const raw = c.req.header("authorization") ?? "";
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  const token = raw.slice(7).trim();
  return isGarbageToken(token) ? "" : token;
}

function isApiSecretToken(token: string): boolean {
  const secret = String(process.env.API_SECRET ?? "").trim();
  return Boolean(secret) && token === secret;
}

function pickDisplayName(payload: Record<string, unknown>): string {
  const userMeta =
    typeof payload.user_metadata === "object" && payload.user_metadata !== null
      ? (payload.user_metadata as Record<string, unknown>)
      : {};
  const candidates = [
    payload.name,
    userMeta.full_name,
    userMeta.name,
    userMeta.display_name,
    payload.email,
  ];
  for (const v of candidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "User";
}

export function getAuthUser(c: Context): AuthUserClaims | null {
  return (c.get("authUser") as AuthUserClaims | null | undefined) ?? null;
}

/* ------------------------------------------------------------------ */
/*  JWT failure classification for structured logging                 */
/* ------------------------------------------------------------------ */

type JwtFailureReason =
  | "token_expired"
  | "invalid_signature"
  | "claim_check_failed"
  | "jwks_fetch_error"
  | "malformed_token"
  | "unknown";

function classifyJwtError(err: unknown): { reason: JwtFailureReason; detail: string } {
  // JWTExpired extends JWTClaimValidationFailed, so check it first.
  if (err instanceof joseErrors.JWTExpired) {
    return { reason: "token_expired", detail: (err as Error).message };
  }
  if (err instanceof joseErrors.JWTClaimValidationFailed) {
    // claim & reason are public string fields on JWTClaimValidationFailed.
    const e = err as Error & { claim?: string; reason?: string };
    return {
      reason: "claim_check_failed",
      detail: `claim="${e.claim ?? "?"}" reason="${e.reason ?? "?"}"`,
    };
  }
  if (err instanceof joseErrors.JWSSignatureVerificationFailed) {
    return { reason: "invalid_signature", detail: (err as Error).message };
  }
  if (err instanceof joseErrors.JOSEError) {
    return { reason: "malformed_token", detail: (err as Error).message };
  }
  if (err instanceof Error) {
    // Network / JWKS fetch errors surface here.
    const msg = err.message.toLowerCase();
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("getaddrinfo")) {
      return { reason: "jwks_fetch_error", detail: err.message };
    }
    return { reason: "unknown", detail: err.message };
  }
  return { reason: "unknown", detail: String(err) };
}

/** Return a safe fingerprint of a JWT for logging (first 8 + last 4 chars). */
function tokenFingerprint(token: string): string {
  if (token.length < 16) return "***";
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

/* ------------------------------------------------------------------ */

/** Human-readable reason returned to the client (no internal details). */
const CLIENT_REASON: Record<JwtFailureReason, string> = {
  token_expired: "Auth token has expired. Please sign in again.",
  invalid_signature: "Invalid auth token.",
  claim_check_failed: "Invalid auth token.",
  jwks_fetch_error: "Unable to verify auth token at this time. Please retry.",
  malformed_token: "Malformed auth token.",
  unknown: "Invalid or expired auth token.",
};

export async function optionalSupabaseUser(c: Context, next: Next) {
  const token = parseBearerToken(c);
  if (!token || isApiSecretToken(token)) {
    c.set("authUser", null);
    return await next();
  }

  const supabaseUrl = String(process.env.SUPABASE_URL ?? "").trim();
  if (!supabaseUrl) {
    return c.json({ error: "SUPABASE_URL is required for user authentication." }, 503);
  }
  const audience = String(process.env.SUPABASE_JWT_AUDIENCE ?? "authenticated").trim();

  try {
    const { payload } = await jwtVerify(token, getSupabaseJwks(supabaseUrl), {
      issuer: `${supabaseUrl.replace(/\/+$/, "")}/auth/v1`,
      audience,
    });
    const sub = String(payload.sub ?? "").trim();
    if (!sub) return c.json({ error: "Invalid auth token payload." }, 401);
    const email = typeof payload.email === "string" ? payload.email : "";
    c.set("authUser", {
      supabaseUserId: sub,
      email,
      displayName: pickDisplayName(payload as Record<string, unknown>),
    } satisfies AuthUserClaims);
    return await next();
  } catch (err) {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const { reason, detail } = classifyJwtError(err);

    // Structured log line — easy to grep / filter in any log aggregator.
    console.warn(
      `[AUTH] JWT verification failed` +
        ` | reason=${reason}` +
        ` | ip=${ip}` +
        ` | token=${tokenFingerprint(token)}` +
        ` | detail="${detail}"`,
    );

    // IMPORTANT:
    // This middleware is intentionally "optional". If a browser sends a stale/invalid JWT,
    // we degrade to anonymous instead of hard-failing the whole request pipeline.
    // Protected routes still enforce auth by checking getAuthUser(c) downstream.
    c.set("authUser", null);
    c.header("x-auth-warning", CLIENT_REASON[reason]);
    return await next();
  }
}

