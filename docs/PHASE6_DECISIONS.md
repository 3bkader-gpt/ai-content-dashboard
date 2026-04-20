# Phase 6 decisions (optional hardening)

## 1) JWKS cache TTL

- Implemented in `server/src/middleware/userAuth.ts`.
- New env: `SUPABASE_JWKS_CACHE_TTL_MS` (default 1 hour, bounded between 1 minute and 24 hours).
- Behavior:
  - Reuse cached JWKS resolver while entry age <= TTL.
  - Recreate resolver after TTL expiry.
  - Periodic cache cleanup removes stale entries.
- Validation:
  - Covered by `server/src/middleware/userAuth.test.ts` with fake timers.

## 2) Analytics persistence evaluation

- Current state:
  - Wizard analytics summary in `server/src/routes/analytics.ts` is backed by in-memory store.
  - Data does not survive process restarts and is node-local.
- Decision for this phase:
  - Keep in-memory implementation for now.
  - Restrict `GET /api/analytics/wizard-summary` to admin channels (already done in Phase 3).
  - Document limitation explicitly.
- Upgrade path (future):
  1. Add `social_geni.wizard_events` table.
  2. Store event batches via transactional insert.
  3. Compute summary via SQL aggregates and optional materialized view.
  4. Add retention policy and periodic pruning.

## 3) Soft delete vs audit

- Current state:
  - Hard delete of kit rows.
  - Immutable delete trail in `social_geni.kit_delete_audit`.
- Decision:
  - Keep current model (hard delete + audit trail) for MVP agency operations.
  - Revisit if restore/undo requirements become product-critical.
