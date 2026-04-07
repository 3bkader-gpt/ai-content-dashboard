# AI Content Dashboard

Full-stack dashboard: Vite + React client, Hono BFF, SQLite + Drizzle, Gemini (server-side only).

## Quick start

```bash
cd ai-content-dashboard
cp .env.example server/.env
cp .env.example client/.env.local
# Edit server/.env: GEMINI_API_KEY, API_SECRET
# Edit client/.env.local: VITE_API_SECRET (same as API_SECRET for single-agency MVP)
# Optional: DEMO_MODE=true in server/.env and VITE_DEMO_MODE=true in client for demo banner + mock generation

npm install
npm run dev
```

### E2E (Playwright)

From repo root (starts dev servers with demo mode + temp DB):

```bash
npx playwright install
npm run test:e2e
```

- API: http://localhost:8787  
- UI: http://localhost:5173  

The **Content Wizard** auto-saves draft `step` + form fields to **localStorage** (`ai-content-dashboard:wizard-draft:v1`, debounced). The draft is cleared after a successful generate. No API secrets are stored there.

## API

All `/api/*` routes require `Authorization: Bearer <API_SECRET>`.

- `POST /api/kits/generate` — synchronous generation. **Required header:** `Idempotency-Key` (non-empty). Body: brief JSON (see wizard).
- `GET /api/kits` — list kits (newest first).
- `GET /api/kits/:id` — kit detail.
- `POST /api/kits/:id/retry` — Phase 2: retry `failed_generation` only; body `{ "brief_json": "...", "row_version": N }` after migration adds `row_version`.

**Retry semantics:** Retry runs **full kit generation** again from the stored brief (same flow as generate). It does **not** patch individual JSON fields from a partially invalid LLM response. A future optional API (e.g. field-level repair) would be a separate design.

### Future / Phase 2+ (partial JSON repair)

- **Not covered by** `POST /api/kits/:id/retry`: that endpoint always re-runs **end-to-end generation** from `brief_json`. It cannot target a single failed node inside `result_json`.
- **Per-field or per-section “repair”** would need a **new contract**: e.g. structured validation errors with JSON paths, a dedicated route such as `POST /api/kits/:id/repair`, idempotency/cost policies, and UI that only appears once the server supports it.
- **Client validation** (`client/src/briefSchema.ts`) is aligned with wizard limits **manually** with server `G_LIMITS` / `buildSubmissionSnapshot` until a shared package or OpenAPI-generated types exists.

## Intelligence parity

Logic under `server/src/logic/` mirrors `prompt_builder_gemini.js` (prompt, schema, validation, status badges, industry modules).

## Phases

1. Sync generate, idempotency, wizard, dashboard, viewer.  
2. `row_version`, retry, Resend email + admin alerts, badges + toasts.  
3. Rate limit, CSP-style headers baseline, demo mode, RTL/a11y, lazy `KitViewer`, Playwright smoke test.
