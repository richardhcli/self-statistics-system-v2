# Application Architecture

**Purpose**: High-level overview of monorepo structure and design philosophy  
**Audience**: Project onboarding and architectural decisions  
**Last Updated**: March 2, 2026  
**Related**: [architecture-distinctions.md](./architecture-distinctions.md), [feature-composition.md](./feature-composition.md)

The Self-Statistics System is a **pnpm polyglot monorepo** built following the **Bulletproof React** pattern. Core business logic is extracted into isomorphic shared packages consumed identically by the React frontend, Firebase backend, and Obsidian plugin.

## Monorepo Structure

```
self-statistics-system-v2/
├── apps/
│   ├── web/                          # React 19 frontend (Vite 6)
│   ├── api-firebase/                 # Firebase Cloud Functions (3-layer architecture)
│   └── obsidian-plugin/              # Obsidian integration plugin
├── shared/
│   ├── contracts/                    # @self-stats/contracts — pure TS interfaces
│   ├── progression-system/           # @self-stats/progression-system — EXP engine
│   ├── soul-topology/                # @self-stats/soul-topology — graph transforms
│   └── plugin-sdk/                   # @self-stats/plugin-sdk — universal API client
├── testing/                          # Emulator test harnesses & SDK sandbox
├── pnpm-workspace.yaml
├── tsconfig.base.json                # @self-stats/* path aliases
└── package.json                      # Root scripts (dev, build, deploy)
```

## Hybrid Read-Aside Philosophy
The application operates on a **Hybrid Read-Aside, Sync-Behind** basis, using Firebase as the Source of Truth and Zustand as a Smart Cache.
- **Source of Truth**: Firebase Firestore (Cloud).
- **Caching**: Independent Zustand stores act as the runtime cache, validated against cloud metadata.
- **Persistence**: `indexedDB` persists the cache for offline support and fast boot times.
- **Write Flow**: UI → Zustand → IndexedDB → Async sync to Firebase.
- **Read Flow**: UI → Zustand/IndexedDB → Fetch from Firebase on cache miss or stale.

**Implementation Status**:
- **Read-aside stores**: Journal, CDAG topology, player statistics.
- **Firestore-backed**: User information, AI config, user integrations (loaded on auth, persisted to Firestore).

---

## Shared Packages (`shared/`)

### `@self-stats/contracts`
Pure TypeScript interfaces — zero runtime dependencies. CDAG graph types (`NodeData`, `EdgeData`, `GraphState`, `CdagStructure`), AI payload contracts (`TextToActionResponse`, `WeightedAction`), and Firestore document schemas (`UserProfile`, `PlayerStatisticsDoc`).

### `@self-stats/progression-system`
Isomorphic EXP math ("The Brain"). Pure, deterministic game rules — no React, no stores, no side-effects.
- EXP propagation engine (PWCA BFS with cycle detection)
- Logarithmic level curve: `Level = floor(log2(EXP + 1))`
- State mutations with level-up detection
- 7 core attribute definitions and orchestration pipelines

### `@self-stats/soul-topology`
Pure graph transforms and operations.
- `transformAnalysisToTopology` — AI response → full 3-layer GraphState
- `transformActionsToTopology` — action labels → leaf-only GraphState
- `analyzeAndTransform` — isomorphic pipeline with pluggable `AiProvider` interface
- `graph-operations/` — `mergeFragmentIntoMaster`, `accumulateEdgeWeight`

### `@self-stats/plugin-sdk`
Universal platform-agnostic API client for external integrations.
- `SelfStatsClient` class using native `fetch` — zero Firebase SDK dependency
- Automatic Firebase ID token refresh via `StorageAdapter` interface
- Exports: `JournalEntryResponse`, `StatChange`, `SelfStatsApiError`

---

## Web App (`apps/web/src/`)

### `/app`
Root entry point and global providers.
- `app.tsx`: Main orchestrator and view navigation logic.
- `provider.tsx`: Global React Context and Suspense boundaries.

### `/features`
Domain-specific modules. Each feature is self-contained with its own components, types, and internal logic.
- **`journal/`**: Voice recording, hierarchical entry management, and AI analysis pipeline.
- **`visual-graph/`**: D3-based stable DAG visualization (The "Concept Graph").
- **`developer-graph/`**: Advanced architectural editor for manual and AI-driven hierarchy design.
- **`statistics/`**: RPG character sheet — radar chart, attribute cards, level views, experience rankings.
- **`settings/`**: Discord-style interface for profile, AI, privacy, and notification configuration.
- **`debug/`**: Debug console with batch injection, datastore inspection, force-sync panel, and auth diagnostics.
- **`auth/`**: Authentication UI (Google Sign-In + Guest).
- **`integration/`**: Connection code generation, webhook config, and data portability.
- **`billing/`**: Billing UI placeholder.
- **`user-info/`**: User identity and RPG session metadata.

### `/lib`
External bridge abstractions — Firebase wrappers, AI pipelines. Pure, data-agnostic functions that don't know about React or Zustand.
- **`firebase/`**: Auth services, CRUD helpers, graph read-aside service, journal service, player statistics sync.
- **`google-ai/`**: Gemini pipeline configuration, prompt templates, and utility functions.

### `/stores`
Global state management as independent Zustand stores (data cache only). Each follows the Separated Selector Facade Pattern.
- **`journal/`**: Journal entries + tree index.
- **`cdag-topology/`**: CDAG graph cache (nodes, edges, structure).
- **`player-statistics/`**: EXP + level stats per node.
- **`user-information/`**: User identity and profile settings.
- **`ai-config/`**: AI processing configurations.
- **`user-integrations/`**: External integration configs and event logs.
- **`root/`**: Composition store for serialization ONLY (import/export).

### `/hooks`
Cross-cutting concerns like persistence, orchestration, and root state access.
- **`use-persistence.ts`**: Hydrates stores from IndexedDB on app load.
- **`use-entry-orchestrator.ts`**: Coordinates cross-store updates (calls `@self-stats/progression-system`).
- **`use-global-store-sync.ts`**: Global store synchronization on auth state changes.
- **`use-cdag-structure.ts`**: CDAG manifest fetch, subscription, and detail expansion.

### `/components`
Shared UI components used across features.

### `/providers`
Global React context providers.
- **`auth-provider.tsx`**: Firebase Auth state observer, exposes `useAuth()` hook.

### `/routes`
Route definitions and protection.

---

## Firebase Backend (`apps/api-firebase/src/`)

3-layer architecture: **data-access → services → endpoints**.

### `data-access/`
Pure Firestore CRUD — `graph-repo.ts`, `user-repo.ts`, `journal-repo.ts`.

### `services/`
Business logic orchestration:
- **`ai-orchestrator.ts`**: Gemini AI provider, prompt handling, topology generation.
- **`journal-service.ts`**: Unified pipeline — AI → topology transform → progression calc → Firestore persistence.
- **`graph-service.ts`**: Graph facade wrapping data-access repos.

### `endpoints/`
- **`callable/journal.ts`**: Firebase Auth-protected journal ingestion (web app).
- **`callable/integration-auth.ts`**: Custom Token minting for external plugins.
- **`rest/api-router.ts`**: REST endpoint with Bearer token auth (external integrations).
- **`rest/obsidian-webhook.ts`**: Obsidian-specific webhook endpoint.
- **`rest/middleware.ts`**: `authenticateRequest` — Bearer token + `verifyIdToken()`.

---

## Obsidian Plugin (`apps/obsidian-plugin/`)

Dedicated Obsidian plugin consuming `@self-stats/plugin-sdk`.
- Native settings UI for Setup Code entry.
- Rich collapsible markdown callouts with per-stat EXP deltas.
- Automatic token refresh via SDK `StorageAdapter`.