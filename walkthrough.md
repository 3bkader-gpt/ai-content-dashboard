# Task 2: Rate Limiter + Auth Error Logging

## Changes Made

### 1. Rate Limiter for `/api/auth/sync`

#### [MODIFY] [rateLimit.ts](file:///c:/Users/User/Desktop/ai-content-dashboard/server/src/middleware/rateLimit.ts)

- **Refactored** from a single hard-coded limiter into a **configurable factory** (`createRateLimit`) that supports per-route rate limiting with isolated bucket namespaces.
- Each limiter instance gets its own `namespace` so counters never collide between routes.
- Added **`Retry-After` header** (RFC 7231) on 429 responses.
- Added **server-side `console.warn` log** when a request is blocked.
- **`rateLimit`** (global, 60 req/min) — preserved for backward compatibility.
- **`authSyncRateLimit`** (strict, 5 req/min) — new, dedicated to `/api/auth/sync`.
- Configurable via `AUTH_SYNC_RATE_LIMIT` env var.

#### [MODIFY] [auth.ts (routes)](file:///c:/Users/User/Desktop/ai-content-dashboard/server/src/routes/auth.ts)

- Imported `authSyncRateLimit` and applied it as **per-route middleware** on `POST /api/auth/sync`.
- This runs *in addition to* the global `kitsGuard` middleware, giving the sync endpoint a **double layer of protection**.

---

### 2. Structured Auth Error Logging

#### [MODIFY] [userAuth.ts](file:///c:/Users/User/Desktop/ai-content-dashboard/server/src/middleware/userAuth.ts)

- **Replaced the bare `catch {}` block** with a full JWT error classification system.
- New `classifyJwtError()` function categorizes failures into:
  | Reason | When |
  |--------|------|
  | `token_expired` | JWT `exp` claim is in the past |
  | `invalid_signature` | HMAC/RSA signature doesn't match |
  | `claim_check_failed` | `iss`, `aud`, or other claim mismatch |
  | `jwks_fetch_error` | Network error fetching Supabase JWKS |
  | `malformed_token` | Token can't be parsed at all |
  | `unknown` | Anything else |

- **Log format** (structured, grep-friendly):
  ```
  [AUTH] JWT verification failed | reason=token_expired | ip=192.168.1.1 | token=eyJhbGci…xZ4Q | detail="..."
  ```
- **Client response** returns a human-readable message per reason (no internal details leaked).
- **JWKS fetch errors** return `503` instead of `401` so the client knows it's a temporary server issue.
- Added `tokenFingerprint()` helper — logs first 8 + last 4 chars of the token for tracing, without exposing the full JWT.

---

## Verification

- ✅ `tsc --noEmit -p server/tsconfig.json` passes with **zero errors**.
- ✅ No changes to existing API contracts — all responses remain backward compatible.
- ✅ Global rate limiter behavior unchanged for all other routes.
