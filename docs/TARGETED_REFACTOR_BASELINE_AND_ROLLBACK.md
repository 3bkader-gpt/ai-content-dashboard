# Targeted Refactor Baseline and Rollback

## Baseline Snapshot

- Timestamp (local): 2026-04-20
- Working branch: `pivot/agency-mode-v2`
- HEAD rollback pointer: `6f488787dc51e5940d26c617a03b8da217a7889e`
- Latest commits at snapshot:
  - `6f48878` fix(v2-auth): force fresh Google handshake for legacy V1 users
  - `f770ea1` fix(v2-auth): allow Google sign-in for agency intake users
  - `48651e4` fix(v2-auth): disable client OAuth entry in agency mode
  - `b0cfb3e` fix(v2-auth): force V2 login redirect and block root dashboard
  - `4388ef4` feat(v2): queue agency requests and notify Telegram immediately

## Render Service Baseline

- Workspace: `tea-csp9orjgbbvc73euebm0`
- V2 static app: `ai-content-dashboard-app-v2` (`srv-d7j3b1tckfvc73fhkha0`)
- V2 API: `ai-content-dashboard-api-v2` (`srv-d7j3avqqqhas739fjgr0`)
- V1 static app: `ai-content-dashboard-app` (`srv-d7aksf6a2pns73cls6r0`)
- V1 API: `ai-content-dashboard-api` (`srv-d7akscn5r7bs739f8u10`)

## Auth and Redirect Baseline Controls

The canonical target for public auth is V2 wizard social:

- `VITE_AUTH_REDIRECT_URL=https://ai-content-dashboard-app-v2.onrender.com/wizard/social`
- `VITE_V2_CANONICAL_URL=https://ai-content-dashboard-app-v2.onrender.com/wizard/social`
- `VITE_V1_PUBLIC_DECOMMISSION=true` (set only on V1 self-serve frontend deploy when cutover is activated)

Supabase dashboard values (must be V2-only during/after cutover):

- Site URL: `https://ai-content-dashboard-app-v2.onrender.com`
- Redirect URLs: V2 URLs only (remove V1 callback paths)

## Rollback Playbook

### Soft rollback (config first)

1. V1 frontend: set `VITE_V1_PUBLIC_DECOMMISSION=false` and redeploy.
2. Restore previous Supabase Site URL / Redirect URLs if callback regressions appear.
3. Keep V2 canonical env keys in place unless redirect loops are confirmed.

### Hard rollback (code)

1. Revert code to baseline pointer:
   - `git checkout 6f488787dc51e5940d26c617a03b8da217a7889e`
2. Redeploy V1 and V2 services.
3. Re-run auth smoke matrix:
   - New user sign-in on V2
   - Legacy V1-era account sign-in on V2
   - Incognito and warm-session checks

### Rollback trigger criteria

- Repeated OAuth callback landings outside V2
- Widespread admin lockout on legacy backdoor
- Lead submission regression (no queued kits / no Telegram lead notifications)
