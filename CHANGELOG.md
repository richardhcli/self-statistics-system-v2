# Changelog

Last Updated: March 2, 2026

**Purpose**: This file is the official, human-readable record of notable changes for each version of your project.
**Standard**: "Keep a Changelog": group changes by version and then categorizing them under specific headers: Added, Changed, Deprecated, Removed, Fixed, and Security.
**Audience**: Human developers, end-users, and deployment pipelines. The AI will only read this to understand the current version or when asked to draft a new release note.

# Entries

---

## Phase 2.1.0: Monorepo Refactor & Plugin API Integration (Feb 17 – Mar 2, 2026)

A major architectural milestone: the project was restructured into a **pnpm polyglot monorepo** with shared workspace packages, a layered Firebase backend, a universal plugin SDK, and a dedicated Obsidian plugin. All core business logic is now isomorphic and consumed identically by the web frontend and backend.

### Added
- **Monorepo workspace structure** (`pnpm-workspace.yaml`) with `apps/*` and `shared/*` directories.
- **`shared/contracts`** (`@self-stats/contracts`): Pure TypeScript interfaces for CDAG graph types, AI payload contracts, and Firestore document schemas.
- **`shared/progression-system`** (`@self-stats/progression-system`): Isomorphic EXP math — constants, logarithmic level curve formulas, PWCA BFS propagation engine, immutable state mutations, and orchestrator pipelines.
- **`shared/soul-topology`** (`@self-stats/soul-topology`): Pure graph transforms — `transformAnalysisToTopology`, `transformActionsToTopology`, `analyzeAndTransform` (pluggable AI provider), and graph-operations module (`mergeFragmentIntoMaster`, `accumulateEdgeWeight`).
- **`shared/plugin-sdk`** (`@self-stats/plugin-sdk`): Universal platform-agnostic client — `SelfStatsClient` class using native `fetch`, automatic Firebase ID token refresh, `StorageAdapter` interface, zero Firebase SDK dependency.
- **`apps/api-firebase`**: 3-layer Firebase backend (data-access → services → endpoints):
  - **Data-access**: `graph-repo.ts`, `user-repo.ts`, `journal-repo.ts` — all Firestore CRUD.
  - **Services**: `ai-orchestrator.ts` (Gemini provider), `journal-service.ts` (unified AI → topology → progression pipeline), `graph-service.ts`.
  - **Endpoints**: `callable/journal.ts` (Firebase Auth), `rest/api-router.ts` (Bearer token auth), `rest/obsidian-webhook.ts`.
  - **Build**: `esbuild` bundler with `build.mjs` Isolated Dist strategy for Cloud Build compatibility.
  - **Secrets**: `sync-secrets.mjs` pipeline for Google Cloud Secret Manager via `defineSecret()`.
- **`apps/obsidian-plugin`**: Dedicated Obsidian plugin consuming `@self-stats/plugin-sdk`:
  - Native settings UI for Setup Code entry and secure Refresh Token storage.
  - Rich collapsible markdown callouts with per-stat EXP deltas.
  - DataviewJS dashboard integration.
- **Firebase Custom Token authentication** for external integrations:
  - Web app mints 1-hour Setup Code via `admin.auth().createCustomToken(uid)`.
  - SDK exchanges Setup Code for ID Token + Refresh Token via Google Identity Toolkit.
  - Automatic token refresh in SDK fetch interceptor.
- **`ConnectionCode` component** in web app Integration tab for generating/displaying setup codes.
- **`StatChange` response type** — backend returns per-stat `name`, `oldValue`, `newValue`, `increase` in journal results.
- **`tsx`** as root dev dependency for TypeScript script execution.
- **SDK sandbox** and emulator test script (`testing/testing-backend/`).
- **CORS support** for `app://obsidian.md` protocol in Firebase `onRequest`.
- **`ignoreUndefinedProperties: true`** in Firestore initialization to prevent `undefined` value crashes.

### Changed
- **Package manager**: Migrated from **npm** to **pnpm** with strict workspace protocol (`workspace:*`).
- **Web app** moved to `apps/web/`; all imports updated to `@self-stats/*` workspace packages.
- **Progression system** extracted from `src/systems/progression/` → `shared/progression-system/`.
- **Topology logic** extracted from `src/lib/soulTopology/` → `shared/soul-topology/`.
- **Path aliases**: `@systems/*` → `@self-stats/*` workspace resolution.
- **Backend authentication**: Replaced SHA-256 API Key model with Firebase Custom Token + Bearer validation.
- **Backend architecture**: Replaced monolithic functions with layered 3-tier architecture (data-access/services/endpoints).
- **Module resolution**: All shared `tsconfig.json` files use `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`.
- **Journal pipeline**: Eliminated duplicate AI call — single `generateTopology` invocation, result passed to `transformAnalysisToTopology`.
- **Firebase Admin init**: Centralized in `admin-init.ts` using modular imports; replaced 5 duplicated patterns.
- **Root `package.json`**: Added `concurrently` for parallel dev/build, workspace scripts via `pnpm --filter`.
- **Root `tsconfig.base.json`**: `@self-stats/*` path aliases pointing to shared package source.

### Fixed
- **BFS infinite loop** in `calculateParentPropagation` — added `visited` Set for cycle detection.
- **Duplicated `roundExp`** — `engine.ts` now imports from `formulas.ts`.
- **`ProgressionResult` not exported** — added export and barrel re-export.
- **Dual spelling** `canceled`/`cancelled` — normalized to `canceled`.
- **Duplicate `@module` JSDoc tags** across shared packages.
- **ESLint**: Reduced from 50 → 0 errors across backend (object-curly-spacing, import/namespace, no-explicit-any).
- **Plugin SDK compile errors** — `.js` extensions for NodeNext, narrowed `fetchImpl` type.

### Removed
- **Legacy API Key system**: Deleted `api-keys-repo.ts`, `callable/api-keys.ts`, in-memory cache middleware.
- **11 legacy backend files**: `voice-processor.ts`, `bare-metal-api.ts`, `ai-client.ts`, `process-journal-entry.ts`, `journal-pipeline/*`, `ai-gateway.ts`, `genai-topology.ts`, `obsidian-integration/*`, `graph-writer.ts`.
- **Frontend `src/systems/progression/`** (6 files) — replaced by `shared/progression-system`.
- **Frontend topology transforms** (2 files) — replaced by `shared/soul-topology`.
- **`package-lock.json`** — replaced by `pnpm-lock.yaml`.
- **`plugins/obsidian-integration/`** — replaced by `apps/obsidian-plugin/`.

---

## Phase 2: Development
Establishing the foundation for multi-device synchronization and persistent cloud storage.