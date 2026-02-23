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

### 2.2 Create `shared/progression`
- **Purpose**: EXP calculations, leveling formulas, and stat normalization.
- **Location**: `shared/progression`
- **Actions**:
    - Initialize `package.json` (name: `@self-stats/progression`).
    - **Move** `apps/web/src/systems/progression/formulas.ts` -> `shared/progression/src/formulas.ts`.
    - **Move** `apps/web/src/systems/progression/constants.ts` -> `shared/progression/src/constants.ts`.
    - **Move** `apps/web/src/systems/progression/engine.ts` -> `shared/progression/src/engine.ts`.
    - **Refactor**: Ensure these files rely only on `@self-stats/contracts` and have **no** React/Zustand dependencies.
    - Export via `src/index.ts`.

### 2.3 Create `shared/topology`
- **Purpose**: Graph theory math, node weighting, and connection logic.
- **Location**: `shared/topology`
- **Actions**:
    - Initialize `package.json` (name: `@self-stats/topology`).
    - **Move** compatible logic from `apps/web/src/lib/soulTopology` -> `shared/topology/src/`.
    - Ensure strict separation from visual rendering components.
    - Export via `src/index.ts`.

---

## Step 3: API-Firebase Implementation

**Goal**: Implement the backend entry processing using the *exact same* logic as the frontend.

1.  **Update `apps/api-firebase/package.json`**:
    - Add dependencies:
      - `@self-stats/contracts`
      - `@self-stats/progression`
      - `@self-stats/topology`

2.  **Implement `processJournalEntry` Cloud Function**:
    - **Input**: `{ rawText: string, timestamp: number }`.
    - **Logic**:
        1.  **AI Extraction**: Call Gemini (via `@google/genai`) to get structured data (keywords, sentiment).
        2.  **Topology Processing**: Use `@self-stats/topology` to determine node connections/weights.
        3.  **Progression Calculation**: Use `@self-stats/progression` to calculate EXP gain and Level updates.
        4.  **Persistence**: Save the *final calculated state* to Firestore.
    - **Output**: `{ success: true, entryId: string, updates: NodeData[] }`.

---

## Step 4: Frontend (Web) Refactor

**Goal**: Consume shared libraries and implement the Hybrid Sync strategy.

1.  **Update `apps/web/package.json`**:
    - Add dependencies:
      - `@self-stats/contracts`
      - `@self-stats/progression`
      - `@self-stats/topology`

2.  **Refactor Imports**:
    - Replace `../../systems/progression/*` imports with `@self-stats/progression`.
    - Replace `../../lib/soulTopology` imports with `@self-stats/topology`.
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
      "@self-stats/progression": ["shared/progression/src/index.ts"],
      "@self-stats/topology": ["shared/topology/src/index.ts"]
    }
    ```
2.  **Update App Configs**:
    - `apps/web/tsconfig.json` extends base.
    - `apps/api-firebase/tsconfig.json` extends base.

3.  **Validation**:
    - Run `npm run build` in all packages to ensure no circular dependencies or missing types.