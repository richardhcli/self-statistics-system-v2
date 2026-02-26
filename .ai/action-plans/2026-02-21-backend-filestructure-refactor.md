# Refined Plan: Backend File Structure & Shared Logic Migration

**Objective**: Unify business logic between the React frontend (`apps/web`) and the Firebase backend (`apps/api-firebase`) by extracting pure functions into shared workspace packages. This ensures consistency in progression calculation and topology operations across both environments.

**Current State**:
- Root: `package.json` with workspace `apps/*`.
- Frontend: `apps/web` (Vite, React, Zustand) containing business logic in `src/systems/progression` and `src/lib/soulTopology`.
- Backend: `apps/api-firebase` (Firebase Functions) currently minimal.
- Database: Firestore / IndexedDB (local).

---

## Step 1: Workspace Initialization

**Goal**: Configure the monorepo to support shared local packages.

1.  **Update Root `package.json`**:
    - Modify `workspaces` to include `shared/*`.
    ```json
    "workspaces": [
      "apps/*",
      "shared/*"
    ]
    ```

2.  **Verify `npm` Configuration**:
    - Ensure `npm install` respects the new workspace structure.

---

## Step 2: Shared Library Extraction

**Goal**: Isolate pure business logic into independently versioned packages.

### 2.1 Create `shared/contracts`
- **Purpose**: Shared Types, Interfaces, and Zod Schemas.
- **Location**: `shared/contracts`
- **Actions**:
    - Initialize `package.json` (name: `@self-stats/contracts`).
    - Move `NodeData`, `EdgeData` types from `apps/web/src/types`.
    - Move Firestore schema definitions.
    - Export everything via `src/index.ts`.

### 2.2 Create `shared/progressionSystem`
- **Purpose**: EXP calculations, leveling formulas, and stat normalization.
- **Location**: `shared/progression`
- **Actions**:
    - Initialize `package.json` (name: `@self-stats/progression-system`).
    - **Move** `apps/web/src/systems/progression/formulas.ts` -> `shared/progression/src/formulas.ts`.
    - **Move** `apps/web/src/systems/progression/constants.ts` -> `shared/progression/src/constants.ts`.
    - **Move** `apps/web/src/systems/progression/engine.ts` -> `shared/progression/src/engine.ts`.
    - **Refactor**: Ensure these files rely only on `@self-stats/contracts` and have **no** React/Zustand dependencies.
    - Export via `src/index.ts`.

### 2.3 Create `shared/soulTopology`
- **Purpose**: Graph theory math, node weighting, and connection logic.
- **Location**: `shared/soul-topology`
- **Actions**:
    - Initialize `package.json` (name: `@self-stats/soul-topology`).
    - **Move** compatible logic from `apps/web/src/lib/soulTopology` -> `shared/soul-topology/src/`.
    - Ensure strict separation from visual rendering components.
    - Export via `src/index.ts`.

---

## Step 3: API-Firebase Implementation

**Goal**: Implement the backend entry processing using the *exact same* logic as the frontend.

1.  **Update `apps/api-firebase/package.json`**:
    - Add dependencies:
      - `@self-stats/contracts`
      - `@self-stats/progression-system`
      - `@self-stats/soul-topology`

2.  **Implement `processJournalEntry` Cloud Function**:
    - **Input**: `{ rawText: string, timestamp: number }`.
    - **Logic**:
        1.  **AI Extraction**: Call Gemini (via `@google/genai`) to get structured data (keywords, sentiment).
        2.  **Topology Processing**: Use `@self-stats/soul-topology` to determine node connections/weights.
        3.  **Progression Calculation**: Use `@self-stats/progression-system` to calculate EXP gain and Level updates.
        4.  **Persistence**: Save the *final calculated state* to Firestore.
    - **Output**: `{ success: true, entryId: string, updates: NodeData[] }`.

---

## Step 4: Frontend (Web) Refactor

**Goal**: Consume shared libraries and implement the Hybrid Sync strategy.

1.  **Update `apps/web/package.json`**:
    - Add dependencies:
      - `@self-stats/contracts`
      - `@self-stats/progression-system`
      - `@self-stats/soul-topology`

2.  **Refactor Imports**:
    - Replace `../../systems/progression/*` imports with `@self-stats/progression-system-system`.
    - Replace `../../lib/soulTopology` imports with `@self-stats/soul-topology`.
    - Replace local type definitions with `@self-stats/contracts`.

3.  **Implement Hybrid Sync in `JournalForm`**:
    - **Action 1 (Optimistic)**: Run accessible logic (regex/heuristics) locally. Calculate "Preview" EXP/Level using shared libs. Update UI immediately via Zustand/IndexedDB.
    - **Action 2 (Async)**: Call `processJournalEntry` cloud function.
    - **Action 3 (Reconciliation)**: When Cloud Function returns, replace local optimistic state with the server-verified state (which used the *same* formulas but better AI data). 

---

## Step 5: TypeScript Configuration & Verification

1.  **Root `tsconfig.base.json` (Create if needed)**:
    - Define path mappings for seamless development:
    ```json
    "paths": {
      "@self-stats/contracts": ["shared/contracts/src/index.ts"],
      "@self-stats/progression-system": ["shared/progression/src/index.ts"],
      "@self-stats/soul-topology": ["shared/topology/src/index.ts"]
    }
    ```
2.  **Update App Configs**:
    - `apps/web/tsconfig.json` extends base.
    - `apps/api-firebase/tsconfig.json` extends base.

3.  **Validation**:
    - Run `npm run build` in all packages to ensure no circular dependencies or missing types.

---

## implementation-record

**Completed by**: AI agent (two sessions  2026-02-25)
**Status**: FULLY IMPLEMENTED

### Packages created

| Package | Location | Purpose |
|---|---|---|
| `@self-stats/contracts` | `shared/contracts/src/` | Pure TS interfaces: CDAG graph types, AI payload types, Firestore schemas |
| `@self-stats/progression-system` | `shared/progression-system/src/` | EXP math: constants, formulas, PWCA engine, state-mutations, orchestrator |
| `@self-stats/soul-topology` | `shared/soul-topology/src/` | Graph transforms: action/analysis to GraphState fragments |

### Files created / modified

**Root and config**
- `package.json` - added `"shared/*"` to workspaces
- `tsconfig.base.json` - created; defines `@self-stats/*` path aliases pointing to correct `shared/progression-system/` and `shared/soul-topology/` directories
- `.ai/daily-logs/2026-02-25-backend-refactor.md` - session log

**`shared/contracts/src/`** (created)
- `graph.ts` - NodeType, NodeData, EdgeData, GraphState, CdagStructure, CdagMetadata, CdagStoreSnapshot
- `topology.ts` - WeightedAction, GeneralizationLink, TextToActionResponse
- `firestore.ts` - UserProfile, AISettings, UIPreferences, PlayerStatisticsDoc, billing/privacy/integration types
- `index.ts` - barrel re-export with module-level JSDoc

**`shared/progression-system/src/`** (created)
- `constants.ts` - CORE_ATTRIBUTES, PROGRESSION_ROOT_ID, EXP tuning constants
- `formulas.ts` - parseDurationToMultiplier, scaleExperience, getLevelForExp, getExpProgress, getExpForLevel
- `engine.ts` - calculateParentPropagation (PWCA BFS algorithm)
- `state-mutations.ts` - NodeStats, PlayerStatistics, updatePlayerStatsState
- `orchestrator.ts` - calculateScaledProgression, calculateDirectProgression
- `index.ts` - barrel re-export with module-level JSDoc

**`shared/soul-topology/src/`** (created)
- `entry-pipeline/types.ts` - EntryOrchestratorContext, AiEntryAnalysisResult, AnalyzeEntryResult
- `entry-pipeline/transform-analysis-to-topology.ts` - transformAnalysisToTopology
- `entry-pipeline/transform-actions-to-topology.ts` - transformActionsToTopology
- `entry-pipeline/index.ts` - barrel re-export
- `index.ts` - barrel re-export with module-level JSDoc

**`apps/api-firebase/`** (modified)
- `package.json` - added @self-stats/* workspace dependencies
- `src/functions/process-journal-entry.ts` - processJournalEntry Cloud Function (NEW)
- `src/index.ts` - exports processJournalEntry

**`apps/web/`** (modified)
- `package.json` - added @self-stats/* workspace dependencies
- `src/systems/progression/` - DELETED (moved to `shared/progression-system`)
- `src/lib/soulTopology/utils/entry-pipeline/transform-*.ts` - DELETED (moved to `shared/soul-topology`)
- `src/lib/soulTopology/types.ts` - re-exports from `@self-stats/contracts`
- `src/lib/soulTopology/utils/entry-pipeline/index.ts` - imports from `@self-stats/soul-topology`
- `src/hooks/use-entry-orchestrator.ts` - imports from `@self-stats/progression-system`
- `src/stores/player-statistics/store.ts` - imports from `@self-stats/progression-system`
- `src/stores/player-statistics/types.ts` - re-exports from `@self-stats/progression-system`
- `src/stores/cdag-topology/types.ts` - re-exports from `@self-stats/contracts`
- `src/types/index.ts` - re-exports from `@self-stats/progression-system` and `@self-stats/contracts`
- `src/features/statistics/components/level-view.tsx` - imports from `@self-stats/progression-system`
- `src/features/statistics/components/status-view.tsx` - imports from `@self-stats/progression-system`
- `src/features/statistics/components/attribute-card.tsx` - imports from `@self-stats/progression-system`
- `src/features/statistics/utils/group-skills.ts` - imports from `@self-stats/progression-system`
- `src/features/debug/components/player-stats-view.tsx` - imports from `@self-stats/progression-system`

### Deviations from original plan

1. Directory names match npm package names: `shared/progression-system` and `shared/soul-topology` instead of `shared/progression` and `shared/topology`
2. tsconfig.base.json paths corrected to point at `shared/progression-system/` and `shared/soul-topology/` (original plan had stale paths)
3. All `shared/*` files received heavy JSDoc on every exported type, field, and function parameter


---

## Implementation Record (2026-02-25)

**Status**: FULLY IMPLEMENTED

### Packages Created

- `@self-stats/contracts` at `shared/contracts/` - graph types, topology contracts, Firestore schemas
- `@self-stats/progression-system` at `shared/progression-system/` - PWCA engine, formulas, state-mutations, orchestrator
- `@self-stats/soul-topology` at `shared/soul-topology/` - transformAnalysisToTopology, transformActionsToTopology

### Key Deviations from Plan
1. Directories use `shared/progression-system/` and `shared/soul-topology/` (not `shared/progression/` / `shared/topology/`)
2. tsconfig.base.json paths corrected to match actual directory names
3. All `shared/*` source files received heavy JSDoc on every exported type, field, and function

### Web App Files Refactored (imports now use `@self-stats/*`)
- hooks/use-entry-orchestrator.ts, stores/player-statistics/*, stores/cdag-topology/types.ts
- features/statistics/components/level-view.tsx, status-view.tsx, attribute-card.tsx
- features/statistics/utils/group-skills.ts, features/debug/components/player-stats-view.tsx
- lib/soulTopology/types.ts, lib/soulTopology/utils/entry-pipeline/index.ts, types/index.ts

### Backend
- `apps/api-firebase/src/functions/process-journal-entry.ts` - processJournalEntry Cloud Function (NEW)



