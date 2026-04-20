# Testing & self-review

## Commands (from repo root)

| When | Command |
|------|---------|
| Typecheck client | `npx tsc --noEmit -p client/tsconfig.json` |
| Typecheck server | `npx tsc --noEmit -p server/tsconfig.json` |
| Dependency audit (high+) | `npm audit --audit-level=high` |
| E2E smoke (Playwright) | `npx playwright install` (once), then `npm run test:e2e` |

E2E runs dev servers in demo mode with a temporary DB (see [`README.md`](../README.md)).

## When to run what

- **Every push:** `tsc` both packages + `npm audit` (as in README).
- **UI / wizard / API contract changes:** run `npm run test:e2e` or extend Playwright coverage if a gap is found.
- **Server-only logic:** unit/integration tests if present; at minimum `tsc` for `server`.

## Phase 1 focused checks (Auth Boundary Hardening)

Before -> after decision matrix for `bearerAuth`:

- **Before:** `Origin`/`Referer` could allow pass-through without cryptographic auth.
- **After:** only explicit trusted channels are allowed:
  - `Authorization: Bearer <API_SECRET>` (service channel),
  - JWT-shaped bearer token for user channel (verification happens in user middleware),
  - `X-Agency-Admin-Session` valid session token (admin channel).

Acceptance checks:

- **Spoofed origin is rejected:** request without valid bearer/admin session must return `401` even if `Origin`/`Referer` are trusted-looking.
- **JWT pass-through at gate:** request with JWT-like bearer is accepted by auth gate and can continue to user verification middleware.
- **Malformed bearer is rejected:** non-secret/non-JWT bearer must return `401`.
- **Production CORS guard:** startup fails when `NODE_ENV=production` and `CORS_ORIGIN=*`.

## Phase 2 focused checks

- **Schema metadata:** verify `strategic_rationale` + `algorithmic_advantage` are required for posts/images/videos.
- **Localization flag:** verify `localization_check_passed` is validated as boolean.
- **SSE reasoning trace:** verify `/api/kits/generate?stream=1` emits bounded `reasoning` events without breaking `status`/`partial`/`complete`.
- **Wizard UX balance:** verify reasoning trace appears during loading while progress/status behavior remains smooth.
- **Legacy compatibility:** verify historical kits without new Phase 2 fields still render with no crash/no noisy warnings.

## UX/Bugfix batch checks

- **Wizard persistence:** change fields + step, refresh, verify exact step/form restoration from `localStorage`.
- **Brand step contract:** verify `business_links` appears in UI and is present in submitted generate payload.
- **Wizard options:** verify brand tone list is emoji-free and includes `حديث وعصري`; content types include Product Demo + Problem Solving.
- **Platform selector visuals:** verify platform pills render recognizable logos for Facebook/Instagram/X/LinkedIn/TikTok/YouTube.
- **Step transition behavior:** clicking Next scrolls viewport to top smoothly.
- **Viewer posts UX:** verify posts are grouped by platform first then day, and CTA text renders without hardcoded `CTA:` prefix.
- **Quota semantics:** verify failed generation paths do not consume image/video usage counters; success path consumes after persistence success.

## Phase 3 focused checks

- **Telemetry endpoint contract:** `POST /api/telemetry/interaction` rejects malformed payloads, enforces kit ownership, and returns success without blocking UI flow.
- **UI preferences patch contract:** `PATCH /api/kits/:id/ui-preferences` accepts only allowed keys (`lang`, `open_map`, `open_platforms`, `open_days`) and applies owner guard.
- **Viewer state restore:** open/close sections + posts platform/day groups + switch language, refresh page, verify state is restored from `ui_preferences`.
- **Viewer state save:** confirm preference updates are debounced and persisted in background (no blocking spinner).
- **Historical context injection:** verify generation includes bounded historical context only when a prior successful kit exists; malformed legacy `result_json` is ignored safely.
- **Backward compatibility:** historical kits missing `ui_preferences` still render with defaults and no crash.

## Phase 4 focused checks (admin kit delete)

- **Endpoint auth:** non-admin requests to `DELETE /api/kits/:id` return `401/403`.
- **Endpoint success path:** admin can delete an existing kit and receives `{ ok: true, id }`.
- **Not-found path:** deleting unknown id returns `404`.
- **Cleanup path:** related `kit_interactions` (and idempotency rows linked to `kit_id`) are removed with the kit.
- **UI exposure:** Delete button appears only in admin mode (`GeneratedKitsPage` with `adminMode === true`).
- **Confirmation guard:** `window.confirm(...)` appears before delete request is sent.
- **Optimistic UI:** deleted row is removed from table state without full page reload.
- **Feedback:** success/error toasts appear accordingly.

## Audit Phase 3 focused checks

- **SSE error sanitization:** `POST /api/kits/generate?stream=1` must emit a generic `error.message` in production and must not leak raw exception text.
- **Analytics summary guard:** `GET /api/analytics/wizard-summary` returns `401/403` for non-admin requests and returns `200` only for admin channels.
- **Analytics ingestion continuity:** `POST /api/analytics/wizard-events` remains writable for client telemetry ingestion.
- **Agency admin login throttling:** repeated calls to `POST /api/auth/agency-admin/login` from same source eventually return `429` with `Retry-After`.

## Audit Phase 4 focused checks

- **RLS enabled:** confirm `relrowsecurity = true` for `social_geni.kits`, `kit_interactions`, `notifications`, `monthly_usage_counters`, `kit_delete_audit`.
- **Owner isolation:** with non-admin JWT, attempts to read rows owned by other `user_id` must return empty/denied.
- **Owner write guard:** insert/update on owner-scoped tables must fail when `user_id` does not match `auth.uid()`.
- **Admin audit visibility:** `kit_delete_audit` readable only for JWTs carrying admin claim (`is_admin=true`).
- **Service role caveat:** verify service-role pathways still function and document that they bypass RLS by design.

## Agency pivot focused checks

- **Edition routing:** with `VITE_APP_EDITION=agency`, wizard submit redirects to `/order-received` (not `/kits/:id`).
- **Contact contract:** `client_name`, `client_phone`, `client_email` are required in agency wizard mode.
- **Source tagging:** generated brief payload contains `source_mode: "agency"` in V2; V1 defaults remain `self_serve`.
- **Admin-only kits:** with `APP_EDITION=agency`, non-admin requests to `/api/kits` and `/api/kits/:id` are blocked.
- **Admin visibility:** admin kit list/detail surfaces source mode and client contact metadata.
- **Webhook side effect:** successful generation triggers Telegram webhook when `TELEGRAM_WEBHOOK_URL` is configured; webhook failure must not fail generation.

## Self-review checklist (before merge)

- [ ] **Behavior:** matches acceptance criteria; edge cases considered (empty input, errors).
- [ ] **Security:** no secrets in client bundle; auth/env assumptions documented (`API_SECRET`, etc.).
- [ ] **API boundaries:** request/response shapes consistent with existing routes and schemas.
- [ ] **DB:** migrations/schema aligned if tables or columns changed (`server/src/db/schema.ts`).
- [ ] **Docs:** for substantive changes (schema, API, prompts, env, security, stack), update the files required by [`docs/TASKING.md`](TASKING.md) → Documentation sync; optionally adjust routing in [`docs/CONTEXT_INDEX.md`](CONTEXT_INDEX.md) if doc map changes.

## Manual regression quick list (pre-merge gate)

- [ ] `GET /api/analytics/wizard-summary` is blocked without admin context.
- [ ] `POST /api/auth/agency-admin/login` throttles after repeated attempts and returns `429`.
- [ ] `POST /api/kits/generate?stream=1` emits safe `error` payloads in production mode.
- [ ] Playwright smoke (`npm run test:e2e`) passes against local demo stack.
- [ ] Any RLS changes are validated against the target Supabase project before deploy.
