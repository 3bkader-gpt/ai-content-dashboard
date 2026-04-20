# Phase 3 Execution Spec (Data Continuity + Interaction Telemetry)

This document records the Phase 3 implementation baseline:

- 3.1 first-party interaction telemetry (`kit_interactions` + `/api/telemetry/interaction`)
- 3.2 cross-kit historical prompt context injection
- 3.3 persisted viewer UI state in `kits.ui_preferences`

## 1) Data model additions

- `kits.ui_preferences` (JSONB, default `{}`):
  - `lang`
  - `open_map`
  - `open_platforms`
  - `open_days`
- `kit_interactions` table:
  - `kit_id`, `interaction_type`, optional `meta_json`
  - owner dimensions: `user_id` and `device_id`
  - indexes on `(kit_id, created_at desc)` and `(interaction_type, created_at desc)`

## 2) API additions

- `POST /api/telemetry/interaction`
  - body: `{ kit_id, interaction_type, meta? }`
  - validates payload with Zod
  - enforces ownership (kit belongs to current user/device scope)
  - non-blocking insert path (logging failures must not break UX)
- `PATCH /api/kits/:id/ui-preferences`
  - body: `{ ui_preferences }`
  - accepts constrained keys only
  - owner-scoped patch to avoid cross-user writes

## 3) Viewer behavior

- Hydrates UI state from `kit.ui_preferences` with safe defaults.
- Saves updates in debounced background calls:
  - language switch
  - top-level section expand/collapse
  - grouped posts platform/day expand state
- Emits telemetry for key interactions:
  - copy actions
  - section/group toggles
  - language toggles

## 4) Generation continuity behavior

- Before prompt composition, generation fetches latest successful kit for same owner.
- Extracts bounded historical strategy context from prior `result_json` (safe parse, truncation caps).
- Injects optional `Historical Context` block into composed prompt when available.

## 5) Safety and compatibility

- Telemetry is fire-and-forget from UI; failures are swallowed.
- Historical context block is optional and ignored on malformed legacy data.
- Kits without `ui_preferences` still render with fallback defaults.
