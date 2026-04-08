# Wizard Competitive Teardown + Execution Notes

## Competitor Journey Summary

Target reviewed: `https://www.creatorpreneur.ae/instagram-quiz-ai-page`

- Single promise headline with clear expected effort (quick audit).
- 11-step quiz using mostly single-choice inputs.
- Low-friction progression (choose option -> continue).
- Personalized diagnostic result page (status + metrics + blockers + roadmap).
- Multi-CTA handoff after value delivery:
  - Program purchase
  - Strategy call
  - Clarity call

## Current `/wizard` Friction Map

Core files:
- `client/src/ContentWizard.tsx`
- `client/src/pages/wizards/WizardCore.tsx`
- `client/src/pages/wizards/SocialCampaignWizard.tsx`
- `client/src/pages/wizards/OfferProductWizard.tsx`
- `client/src/pages/wizards/DeepContentWizard.tsx`
- `client/src/briefSchema.ts`

Observed blockers:
- Extra decision at start (must choose path before first value).
- Final submission had double confirmation.
- CTA copy was functional, not outcome-driven.
- No explicit funnel event instrumentation for drop-off diagnosis.

## Top 10 Improvements (Impact / Effort)

1. Add quick-start path on entry screen (High / Low)
2. Remove final double-confirm before generate (High / Low)
3. Use benefit-driven final CTA text (High / Low)
4. Add final reassurance copy (speed + safety + editability) (High / Low)
5. Track step views and next clicks (High / Medium)
6. Track validation failures per step (High / Medium)
7. Track generate click + success/fail (High / Medium)
8. Reduce early cognitive load in route selection copy (Medium / Low)
9. Add value-preview checkpoint (Sprint B) (High / Medium)
10. Add result handoff ladder with objection handling (Sprint B) (High / Medium)

## Implemented in Sprint A

### 1) Entry friction reduction
- Added a `Quick start` block in `ContentWizard` with:
  - `Start now (recommended)` -> `/wizard/social`
  - `I need offer-focused flow` -> `/wizard/offer`

### 2) Final-step simplification
- Removed double-confirm flow from `WizardCore`.
- Final action is now a single direct submit button:
  - `Generate my kit now`

### 3) Copy and reassurance upgrade
- Added explicit reassurance on final step:
  - Expected generation time
  - Draft safety
  - Ability to edit after generation

### 4) Funnel instrumentation (foundation)
- Added lightweight event emission in `WizardCore`:
  - `wizard_started`
  - `wizard_step_viewed`
  - `wizard_step_next_clicked`
  - `wizard_step_validation_failed`
  - `wizard_generate_clicked`
  - `kit_created_success`
  - `kit_created_failed`

## Implemented in Sprint B (this iteration)

### 1) Standardized analytics payload schema
- Added `client/src/lib/wizardAnalytics.ts` with normalized payload fields:
  - `wizard_type`
  - `draft_key`
  - `step_id` / `step_index`
  - `validation_state`
  - `elapsed_time_ms`
  - `kit_id` / `error`
- Added local analytics buffer in localStorage for quick debugging and before/after KPI checks.

### 2) Early value preview in wizard flow
- Added a non-blocking `Early value preview` panel in `WizardCore` (appears after core brand/goal context is known).
- Purpose: shorten time-to-first-value perception without adding any extra required step.

### 3) Result handoff optimization (`/kits/:id`)
- Added a `Next best action` section in `KitDetail`:
  - Quick win lane
  - Optimization lane
  - Scale lane
- Added CTA ladder:
  - Create another kit
  - Open generated kits
- Added trust cue copy to reduce post-result uncertainty.

## Sprint B Backlog (Next)

1. Value preview before full completion.
2. CTA ladder on post-result handoff.
3. Social-proof and objection-handling content blocks near conversion points.
4. Persist and ship analytics events to your preferred provider.

## Verification Checklist

- Entry page offers immediate recommended start.
- Last step has one clear generate action.
- Generate flow still opens `/kits/:id` on success.
- Validation errors still block step progression correctly.
- Wizard analytics events fire during normal flow and failures.

