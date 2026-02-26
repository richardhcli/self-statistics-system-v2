# 2026-02-25 — Backend file structure refactor

## Summary
Full extraction of shared business logic into monorepo workspace packages.
All EXP math and graph-transform functions now live in `shared/*` and are
consumed identically by the React frontend and the Firebase Cloud Functions backend.

## Changes

### Shared packages created
- `shared/contracts` (`@self-stats/contracts`) — pure TypeScript interfaces:
  CDAG graph types (`NodeData`, `EdgeData`, `GraphState`, `CdagStructure`),
  AI payload contracts (`TextToActionResponse`, `WeightedAction`, `GeneralizationLink`),
  and Firestore document schemas (`UserProfile`, `PlayerStatisticsDoc`, settings types).
- `shared/progression-system` (`@self-stats/progression-system`) — all EXP math:
  constants, logarithmic level curve formulas, PWCA BFS propagation engine,
  immutable state-mutation function, and two high-level orchestrator pipelines.
- `shared/soul-topology` (`@self-stats/soul-topology`) — pure graph transforms:
  `transformAnalysisToTopology` (AI response → full 3-layer GraphState),
  `transformActionsToTopology` (action labels → leaf-only GraphState),
  and entry-pipeline domain contracts.

### Root config
- `package.json` — workspaces expanded to `["apps/*", "shared/*"]`
- `tsconfig.base.json` — created with `@self-stats/*` path aliases pointing at
  `shared/progression-system/src/index.ts` and `shared/soul-topology/src/index.ts`

### Web app refactored (`apps/web`)
- Deleted `src/systems/progression/` (6 files) — moved to `shared/progression-system`
- Deleted 2 topology transform files — moved to `shared/soul-topology`
- All import sites updated to `@self-stats/progression-system`, `@self-stats/soul-topology`,
  `@self-stats/contracts`

### Backend (`apps/api-firebase`)
- New `src/functions/process-journal-entry.ts` — `processJournalEntry` HTTP Cloud Function:
  Gemini AI extraction → shared topology transform → shared progression calc → Firestore persistence
- `src/index.ts` exports the new function

### Documentation
- All `shared/*` source files received heavy JSDoc: every exported type, interface field,
  constant, and function parameter is documented with purpose and AI agent guidance.
- `.ai/action-plans/2026-02-21-backend-filestructure-refactor.md` updated with
  full implementation record.

## Notes
- `@self-stats/contracts` has zero runtime dependencies (pure interfaces only).
- Path aliases in `tsconfig.base.json` use the actual directory names
  (`shared/progression-system/`, `shared/soul-topology/`) which differ from
  the stale paths shown in the original action plan.
- `processJournalEntry` maps unknown CDAG node types to `'characteristic'` as a safe default.
