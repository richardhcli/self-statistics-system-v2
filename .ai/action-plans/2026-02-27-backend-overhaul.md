# Action Plan: Backend Overhaul & SDK Migration

**Date:** 2026-02-27  
**Status:** In Progress  
**Scope:** `apps/api-firebase/`, `shared/soul-topology/`, `shared/contracts/`

---

## Baseline: Current State (as of 2026-02-27)

### Build Tooling (DONE)
- Root package.json uses **pnpm** workspaces with `concurrently` for parallel dev/build.
- `apps/api-firebase` builds with **esbuild** (`--bundle --platform=node --target=node20`), `tsconfig.json` is `noEmit: true`.
- `apps/web` builds with Vite, `moduleResolution: bundler`.

### Shared Packages (DONE)
Three workspace packages exist under `shared/`:
- `@self-stats/contracts` — Pure TS interfaces (graph, topology, firestore schemas).
- `@self-stats/progression-system` — PWCA BFS engine, EXP formulas, state mutations, orchestrators.
- `@self-stats/soul-topology` — Entry pipeline transforms (`transformAnalysisToTopology`, `transformActionsToTopology`).

### Current `apps/api-firebase/src/` File Map
```
index.ts                              ← Cloud Functions entry; exports all endpoints
functions/
  process-journal-entry.ts            ← onRequest; uses shared packages directly
microservices/
  ai-gateway.ts                       ← onRequest; thin wrapper around genai-topology
modules/
  bare-metal-api.ts                   ← v1 onRequest; uses IntegrationSDK (legacy)
  voice-processor.ts                  ← ENTIRELY COMMENTED OUT (dead code)
plugins/
  journal-pipeline/
    api.ts                            ← onRequest; delegates to pipeline.ts
    pipeline.ts                       ← calls ai-client.ts (HTTP fetch to aiGateway)
    types.ts
  obsidian-integration/
    api.ts                            ← onRequest; uses PluginSDK for job queue
    index.ts                          ← barrel
    types.ts
    worker.ts                         ← calls ai-client.ts + graph-writer
plugin-sdk/
  index.ts                            ← PluginSDK class (Firestore CRUD helper)
services/
  admin-init.ts                       ← Centralized firebase-admin singleton
  ai-client.ts                        ← fetch() proxy to the aiGateway function  ← ANTIPATTERN
  genai-topology.ts                   ← Direct @google/genai Gemini calls + prompt
  graph-writer.ts                     ← Firestore graph upsert (nodes/edges/manifest)
testing/
  debug-api.ts
  hello-world.ts
  index.ts
```

### Known Problems in Current State
1. **`ai-client.ts` is a self-calling antipattern.** `journal-pipeline/pipeline.ts` and `obsidian-integration/worker.ts` call `analyzeJournal()`, which builds a URL to the *deployed* `aiGateway` Cloud Function and HTTP-fetches it. A function calling itself via HTTP wastes latency, doubles cold-start cost, and breaks in emulator-less local testing. Both should call `genai-topology.ts` → `generateTopology()` directly.
2. **Two duplicate journal endpoints.** `functions/process-journal-entry.ts` and `plugins/journal-pipeline/api.ts` + `pipeline.ts` do the same work (text → AI → graph → stats → persist). The former uses shared packages; the latter uses the indirect fetch path.
3. **Flat progression math in `journal-pipeline/pipeline.ts`.** It calculates EXP as `Math.round(duration/30) * 50` — ignoring the `@self-stats/progression-system` PWCA engine entirely.
4. **No separation between endpoint, service, and data-access layers.** Endpoint handlers contain business logic and raw Firestore calls inline.
5. **Dead code.** `voice-processor.ts` is 100% commented out. `bare-metal-api.ts` uses v1 Firebase Functions API with hardcoded `"MY_SECRET_LOCAL_KEY"`.
6. **`soul-topology` only has `entry-pipeline/`.** The planned `graph-operations/` module (merge, weight recalculation) does not exist yet.
7. **No `AiProvider` injection.** `genai-topology.ts` hardcodes `@google/genai`. Cannot run the same prompt logic in the browser without duplicating it.

---

## Phase 2: AI Engine & Graph Operations in `@self-stats/soul-topology`

**Goal:** Make `@self-stats/soul-topology` the single source of truth for all topology generation and graph math, executable in both browser and backend.

### 2.1. Add `AiProvider` Interface to `entry-pipeline/types.ts`

**File:** `shared/soul-topology/src/entry-pipeline/types.ts`

Add a dependency-injection interface so the pipeline can accept either a Node.js Gemini client or a browser fetch wrapper:

```typescript
/** Injected AI provider — implemented differently per environment. */
export interface AiProvider {
  /**
   * Send journal text to the AI model and return the structured topology.
   * @param text - Raw journal entry content.
   * @returns Parsed AI response matching `TextToActionResponse`.
   */
  analyzeEntry(text: string): Promise<TextToActionResponse>;
}
```

### 2.2. Create Isomorphic `analyzeAndTransform()` Pipeline Function

**File:** `shared/soul-topology/src/entry-pipeline/analyze-and-transform.ts` (NEW)

This function accepts an `AiProvider` instance and raw text, calls the AI, then passes the result through `transformAnalysisToTopology`. Returns a typed `GraphState` fragment.

```typescript
export const analyzeAndTransform = async (
  provider: AiProvider,
  rawText: string,
): Promise<GraphState> => {
  const topology = await provider.analyzeEntry(rawText);
  return transformAnalysisToTopology(
    topology,
    topology.generalizationChain ?? [],
  );
};
```

Export from `entry-pipeline/index.ts` and the root `index.ts` barrel.

### 2.3. Create `graph-operations/` Module

**Directory:** `shared/soul-topology/src/graph-operations/`

```
graph-operations/
  index.ts
  merge-topologies.ts
  weight-calculations.ts
  types.ts
```

#### `types.ts`
Define `MergeOptions` (configurable change rate constant, default `0.01`).

#### `weight-calculations.ts`
Implement the edge accumulation formula:
$$W_{new} = W_{old} + W_{fragment} \times changerate$$
Where `changerate = 0.01` by default. Export `accumulateEdgeWeight(oldWeight, fragmentWeight, changeRate)`.

#### `merge-topologies.ts`
Implement `mergeFragmentIntoMaster(master: GraphState, fragment: GraphState, options?: MergeOptions): GraphState`:
- **Node collision:** If a fragment node ID already exists in master, compose metadata (preserve original `createdAt`, update `updatedAt`). If it does not exist, initialize it.
- **Edge collision:** If the same `source→target` edge exists, call `accumulateEdgeWeight()` to recalculate. If not, add edge as new.
- **Pure function:** No Firestore, no side effects. Input/output are plain `GraphState` objects. Must be deterministic — same inputs always produce the same output.

Export from `graph-operations/index.ts` and the root `index.ts` barrel.

### 2.4. Final `soul-topology/src/` Structure
```
soul-topology/src/
  index.ts                                    ← barrel re-exports
  entry-pipeline/
    index.ts
    types.ts                                  ← + AiProvider interface
    analyze-and-transform.ts                  ← NEW: isomorphic pipeline
    transform-analysis-to-topology.ts
    transform-actions-to-topology.ts
  graph-operations/
    index.ts                                  ← NEW
    types.ts                                  ← NEW: MergeOptions
    merge-topologies.ts                       ← NEW: fragment → master merge
    weight-calculations.ts                    ← NEW: edge accumulation math
```

---

## Phase 3: Firebase Layered Monolith Migration

**Goal:** Restructure `apps/api-firebase/src/` into a 3-layer architecture (endpoints → services → data-access). No logic rewrite — only re-housing.

### Target Structure
```
apps/api-firebase/src/
  index.ts                           ← Entry point: exports all endpoints
  endpoints/
    callable/                        ← onCall endpoints (Firebase Auth integrated)
      journal.ts                     ← processJournalEntry (rename from onRequest to onCall)
    rest/
      api-router.ts                  ← onRequest: REST for external plugins
      obsidian-webhook.ts            ← onRequest: Obsidian-specific endpoint
  services/
    admin-init.ts                    ← KEEP as-is (already centralized)
    ai-orchestrator.ts               ← RENAME from genai-topology.ts; add AiProvider adapter
    journal-service.ts               ← NEW: compose AI → topology → progression → persist
    graph-service.ts                 ← Thin facade over graph-writer data-access
  data-access/
    graph-repo.ts                    ← MOVE core from services/graph-writer.ts
    journal-repo.ts                  ← NEW: Firestore CRUD for journal_entries collection
    user-repo.ts                     ← NEW: Firestore CRUD for user_information/player_statistics
    api-keys-repo.ts                 ← NEW (Phase 4): hashed API key storage
  plugin-sdk/
    index.ts                         ← KEEP (refactor to use data-access layer internally)
  testing/
    debug-api.ts                     ← KEEP
    hello-world.ts                   ← KEEP
    index.ts                         ← KEEP
```

### 3.1. Create Data-Access Layer (`src/data-access/`)

Extract all raw `db.doc(...)` / `db.collection(...)` calls into repository modules:

| File | Source | What It Wraps |
|------|--------|---------------|
| `graph-repo.ts` | `services/graph-writer.ts` | `upsertGraph()`, manifest logic, node/edge CRUD |
| `journal-repo.ts` | inline in `process-journal-entry.ts` lines 107-120, `PluginSDK.journal.*` | `createEntry()`, `getEntry()`, `updateEntry()` |
| `user-repo.ts` | inline in `process-journal-entry.ts` lines 22-33 (`loadPlayerStats`, `persistPlayerStats`) | `loadStats()`, `saveStats()`, `updateStats()` |

Every function takes `userId` as first parameter. Every function imports `db` from `services/admin-init.ts`.

### 3.2. Create Services Layer (`src/services/`)

| File | Responsibility |
|------|----------------|
| `ai-orchestrator.ts` | RENAME `genai-topology.ts`. Implement the `AiProvider` interface from `@self-stats/soul-topology` so the shared pipeline can be called with `analyzeAndTransform(nodeAiProvider, text)`. Keeps all `@google/genai` logic. |
| `journal-service.ts` | NEW. **The single journal processing pipeline.** Replaces both `functions/process-journal-entry.ts` body AND `plugins/journal-pipeline/pipeline.ts`. Steps: (1) call `analyzeAndTransform(provider, text)`, (2) call `calculateParentPropagation` + `scaleExperience`, (3) call data-access repos to persist. Returns a typed result for endpoints to forward. |
| `graph-service.ts` | Thin facade that calls `graph-repo` plus `@self-stats/soul-topology/graph-operations/mergeFragmentIntoMaster` for reconciliation. |

### 3.3. Create Endpoints Layer (`src/endpoints/`)

| File | Trigger Type | Auth |
|------|-------------|------|
| `callable/journal.ts` | `onCall` (v2) | Firebase Auth (user context from `request.auth`) |
| `rest/api-router.ts` | `onRequest` (v2) | API key header (`x-api-key`) via middleware (Phase 4) |
| `rest/obsidian-webhook.ts` | `onRequest` (v2) | API key header |

Each endpoint is a thin handler: validate input → call service → return result. Zero business logic in endpoints.

### 3.4. Files to Delete

| File | Reason |
|------|--------|
| `modules/voice-processor.ts` | 100% commented out; dead code |
| `modules/bare-metal-api.ts` | Legacy v1 API; replaced by `rest/api-router.ts` |
| `services/ai-client.ts` | Self-calling HTTP antipattern; replaced by direct `ai-orchestrator.ts` import |
| `functions/process-journal-entry.ts` | Logic moves to `journal-service.ts`; endpoint moves to `callable/journal.ts` |
| `plugins/journal-pipeline/` (entire dir) | Duplicate of process-journal-entry; logic absorbed by `journal-service.ts` |
| `microservices/ai-gateway.ts` | Thin wrapper; internal callers will use `ai-orchestrator.ts` directly. If external consumers need a raw AI endpoint, add it to `rest/api-router.ts`. |
| `integrations/sdk.ts` | Superseded by `plugin-sdk/` + data-access repos. `bare-metal-api.ts` was its only consumer. |

### 3.5. Update `src/index.ts` Barrel

After migration, index.ts should export only:
```typescript
import {setGlobalOptions} from "firebase-functions";
setGlobalOptions({maxInstances: 10});

// Callable (authenticated frontend endpoints)
export {processJournalEntry} from "./endpoints/callable/journal";

// REST (external plugin endpoints)
export {apiRouter} from "./endpoints/rest/api-router";
export {obsidianWebhook} from "./endpoints/rest/obsidian-webhook";

// Testing (dev only)
export {debugEndpoint, helloWorld} from "./testing";
```

---

## Phase 4: REST Security & API Key Caching

**Goal:** Protect REST endpoints (`rest/api-router.ts`, `rest/obsidian-webhook.ts`) with hashed API key authentication.

### 4.1. API Key Storage (`data-access/api-keys-repo.ts`)

- **Collection:** `api_keys/{sha256_hash}`
- **Document fields:** `{ userId: string, name: string, createdAt: string, lastUsedAt: string }`
- **Hash method:** `crypto.createHash('sha256').update(rawKey).digest('hex')`
- **Document ID IS the hash** — guarantees O(1) lookup.
- Export: `validateApiKey(rawKey): Promise<{userId: string} | null>`, `createApiKey(userId, name): Promise<string>`, `revokeApiKey(rawKey): Promise<void>`

### 4.2. In-Memory Middleware Cache (`endpoints/rest/middleware.ts`)

```typescript
/** In-memory cache. Lives for the lifetime of the Cloud Function container. */
const keyCache = new Map<string, {userId: string; expiresAt: number}>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const authenticateApiKey = async (req, res, next) => { ... };
```
- Hash incoming `x-api-key` header.
- Check `keyCache` first (zero Firestore cost). Return `userId` if valid and not expired.
- On cache miss: query `api-keys-repo.ts`. On success: cache the result. On failure: 401.
- All REST endpoints call this middleware before processing.

### 4.3. Frontend Key Management

- Build a UI panel in "Settings & Integrations" that calls a `createApiKey` callable function.
- Display the raw key to the user exactly once (never stored in plaintext).
- List active keys (name + created date only).
- Revoke button calls `revokeApiKey` callable function.

---

## Phase 5: Plugin SDK Extraction & Obsidian Eviction

**Goal:** Extract the `plugin-sdk` into `shared/` as `@self-stats/plugin-sdk` and move the Obsidian integration to its own app.

### 5.1. Create `shared/plugin-sdk/` Package

**Directory:** `shared/plugin-sdk/`

```typescript
export class SelfStatsClient {
  constructor(private config: { apiKey: string; baseUrl?: string }) {}

  async submitJournalEntry(text: string, options?: { duration?: number }): Promise<JournalResult> {
    // fetch() POST to config.baseUrl/apiRouter with x-api-key header
  }

  async getJobStatus(jobId: string): Promise<JobStatus> { ... }
}
```

- Zero Firebase dependency. Uses native `fetch`.
- Validates input payload against `@self-stats/contracts` schemas.
- Works in Node.js, browser, Obsidian (Electron), Deno.

### 5.2. Move Obsidian Integration to `apps/obsidian-plugin/`

- Move `apps/api-firebase/src/plugins/obsidian-integration/` → `apps/obsidian-plugin/src/`.
- Replace all internal `PluginSDK` / `ai-client.ts` usage with `@self-stats/plugin-sdk`.
- The plugin only needs to: (1) capture markdown, (2) call `SelfStatsClient.submitJournalEntry()`, (3) display result.
- Delete `apps/api-firebase/src/plugins/obsidian-integration/` entirely.

---

## Execution Order

| Step | Phase | Dependencies | Validation |
|------|-------|-------------|------------|
| 1 | 2.1–2.2 | None | `tsc --noEmit` on `shared/soul-topology` |
| 2 | 2.3 | Step 1 (types) | `tsc --noEmit` on `shared/soul-topology` |
| 3 | 3.1 | None | `pnpm run build --filter api-firebase` |
| 4 | 3.2 | Steps 1–3 | `pnpm run build --filter api-firebase` |
| 5 | 3.3 | Step 4 | `pnpm run lint --filter api-firebase` + emulator smoke test |
| 6 | 3.4–3.5 | Step 5 | `pnpm run lint --filter api-firebase` + `pnpm run -w apps/web typecheck` |
| 7 | 4.1–4.2 | Step 5 | Emulator test: API key create → hash → validate |
| 8 | 4.3 | Step 7 | `pnpm run -w apps/web typecheck` |
| 9 | 5.1 | Step 7 | `tsc --noEmit` on `shared/plugin-sdk` |
| 10 | 5.2 | Steps 6, 9 | Obsidian plugin builds; backend lint clean |

---

## Post-Modification Validation Checklist

Per [universal-validation-guidelines.md](../.ai/blueprints/universal-validation-guidelines.md):

```bash
# After web changes
pnpm run -w apps/web typecheck

# After backend changes
pnpm run lint --filter api-firebase

# Full build
pnpm run build
```
