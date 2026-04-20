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

## Phase 1 focused checks

- **Streaming route:** verify `/api/kits/generate?stream=1` emits `status`, `partial`, `complete` in order.
- **Hydration ordering:** verify light fields (`narrative_summary`, `diagnosis_plan`) are emitted before heavy arrays.
- **Graceful degradation:** load kits with missing optional fields and confirm viewer does not crash.
- **Critical missing sections:** confirm viewer surfaces local warning and keeps page interactive.

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

## Self-review checklist (before merge)

- [ ] **Behavior:** matches acceptance criteria; edge cases considered (empty input, errors).
- [ ] **Security:** no secrets in client bundle; auth/env assumptions documented (`API_SECRET`, etc.).
- [ ] **API boundaries:** request/response shapes consistent with existing routes and schemas.
- [ ] **DB:** migrations/schema aligned if tables or columns changed (`server/src/db/schema.ts`).
- [ ] **Docs:** for substantive changes (schema, API, prompts, env, security, stack), update the files required by [`docs/TASKING.md`](TASKING.md) → Documentation sync; optionally adjust routing in [`docs/CONTEXT_INDEX.md`](CONTEXT_INDEX.md) if doc map changes.
