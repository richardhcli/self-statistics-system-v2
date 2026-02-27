 Refactored Plan of Action: Monorepo Backend & SDK Migration

**Completed Milestones:**

* ~~**Phase 1:** Workspace & Build Tooling Optimization~~ (pnpm, Esbuild, and concurrent deployment are locked in).
* ~~**Phase 6:** Environment Routing & Deployment~~ (Vite emulator routing and one-click deployment are operational).

---

## Phase 2:  AI Engine & Core Topology Integration (The Isomorphic Pipeline)

*Objective: Implement the AI extraction logic directly into the shared topology package so it can be executed from anywhere.*
*Objective: Expand the `soul-topology` workspace package to act as the absolute source of truth. It will handle the initial AI extraction (the Entry Pipeline) and the mathematical reconciliation of data (Graph Operations) to seamlessly merge fragment topologies into the master graph.*

* **Target Location:** `@self-stats/soul-topology/entry-pipeline`
* **Implementation Strategy (Dependency Injection):** Because this code sits in the `shared` workspace, it cannot hardcode the `@google/genai` Node SDK (which breaks the browser) or the frontend `fetch` API.
* Define an `AiProvider` interface inside the topology pipeline.
* Port your existing Gemini prompt logic into this pipeline.
* When the frontend calls this pipeline for optimistic UI updates, it injects a browser-compatible AI provider. When the backend calls it, it injects the Node.js server provider. This ensures the 3-Layer Semantic Pipeline (Actions, Skills, Characteristics) is processed identically across environments.


FURTHERMORE: 
This is an excellent architectural pivot. Elevating `@self-stats/soul-topology` from a simple transformation script into the definitive, universal engine for *all* graph mechanics ensures that your frontend and backend will always calculate state identically.

By treating a new journal entry's extracted data as a discrete "fragment topology" (a signal), you can mathematically merge it into the user's massive master graph using standardized functions.


### 2.1. Folder Structure Expansion

To support the new functionality, the package must be divided into two distinct domains: one for parsing incoming data, and one for manipulating the existing mathematical structure.

```text
C:\...\shared\soul-topology\src
│   index.ts                          (Exports the unified SDK)
│
├───entry-pipeline\                   (Converts raw text/AI output into Fragments)
│       index.ts
│       transform-actions-to-topology.ts
│       transform-analysis-to-topology.ts 
│       types.ts
│
└───graph-operations\                 (Manipulates and merges mathematical graphs)
        index.ts
        merge-topologies.ts           (Reconciles Fragment Graph -> Main Graph)
        weight-calculations.ts        (Handles neural weighting and accumulation)
        types.ts
... more as needed. 
```

### 2.2. The Entry Pipeline (Dependency Injection)

* **Target:** `entry-pipeline/transform-analysis-to-topology.ts`
* **Implementation:** This pipeline cannot hardcode the `@google/genai` Node SDK, or it will crash your React/Zustand frontend.
* Define an `AiProvider` interface.
* When processing a journal entry, the function accepts the raw text and the injected `AiProvider`.
* The pipeline calls the AI, parses the 3-Layer Semantic Pipeline (Actions, Skills, Characteristics), and outputs a strict, isolated **Fragment Topology** representing only the contents of that specific journal entry.



### 2.3. Graph Operations (The Merging Engine)

* **Target:** `graph-operations/merge-topologies.ts`
* **Implementation:** Once the Entry Pipeline generates a Fragment Topology, this module handles the complex task of integrating it into the user's historical state.
* **Node Collision Handling:** Identify if the fragment's nodes (e.g., "Python Programming") already exist in the master topology. If they do, compose the new metadata with the old; if not, initialize them.
* **Edge Weight Recalculation:** When identical edges overlap between the fragment and the master graph, the system must recalculate the bond. Instead of simple addition, this is where you apply your probability theory and signal accumulation math. You can define formulas in `weight-calculations.ts` to calculate the new weight, such as using a decaying accumulation function: $W_{new} = W_{old} + \Delta W \cdot e^{-kT}$. FOR NOW, just use $W_{new} = W_{old} +  W \cdot (change rate)$, where (change rate) = 0.01, a configurable constant. 
* **Time Invariance:** Ensure that the merging logic is deterministic. Passing the exact same master graph and fragment graph through the merger should always yield the exact same resulting topology, regardless of whether it is executed on the Firebase backend or locally in the Vite frontend.


---

## Phase 3: Firebase Layered Monolith Migration

*Objective: Dismantle the existing `microservices/` and `plugins/` folders within the backend and establish a strict endpoints/services/data-access flow.*

**Migration Rule:** Do not rewrite your core logic. You are simply re-housing it.

### 3.1. The Data-Access Layer (`src/data-access/`)

* **What to Migrate (Reuse):** Hunt down every instance of `admin.firestore().collection(...)` currently scattered across your old `microservices/` and `services/` folders.
* **What to Build (New):** Create dedicated repository files (`nodes-repo.ts`, `api-keys-repo.ts`, `users-repo.ts`).
* **Execution:** Wrap the old queries in clean, exported functions. For example, extract the logic that saves a new node to the Concept Graph and place it in `export const saveGraphNode = async (...)` inside `nodes-repo.ts`. Your services will now call these functions instead of talking to the database directly.

### 3.2. The Services Layer (`src/services/`)

* **What to Migrate (Reuse):** Move the core logic from your old `microservices/ai-gateway.ts` and `modules/voice-processor.ts`. Rename them to `ai-orchestrator.ts` and `voice-service.ts`.
* **What to Build (New):** Create `journal-pipeline.ts`. This is the new "brain" of the backend. It will receive text, call `ai-orchestrator.ts` to hit Gemini 2.0 Flash, pass that output to your newly mapped `@self-stats/soul-topology/.../transform-analysis-to-topology`, and finally send the output to `nodes-repo.ts` to be saved.

### 3.3. The Endpoints Layer (`src/endpoints/`)

* **What to Migrate (Reuse):** Extract the HTTP trigger logic from your old `functions/process-journal-entry.ts`.
* **What to Build (New):** Create two distinct folders.
* `endpoints/callable/`: House your React frontend endpoints here (using `functions.onCall` to leverage standard Firebase Auth).
* `endpoints/rest/`: House your new `api-router.ts` (using `functions.onRequest`) to listen for third-party plugin webhooks and REST calls.



---

## Phase 4: REST Security & Caching

*Objective: Protect the new REST endpoints with low-cost API Key authentication for external plugins.*

### 4.1. Hashed Storage & Key Generation (New Code)

* **Frontend:** Build a UI panel in the "Settings & Integrations" dashboard that generates a secure, random string (e.g., `ss_live_abc123`). Show this to the user exactly once.
* **Backend:** Before saving to Firestore, hash this key using `crypto.createHash('sha256')`. Save the hashed string as the actual Document ID in an `api_keys` collection to guarantee `O(1)` database reads.

### 4.2. In-Memory Middleware Cache (New Code)

* **Execution:** Create `endpoints/rest/middleware.ts`. Build a JavaScript `Map` outside the scope of the Firebase function handler.
* **The Flow:** When an Obsidian plugin hits your API, hash the incoming key. Check the `Map` first. If it exists, authenticate instantly (zero cost). If it doesn't, query Firestore (one read cost), validate it, and store the result in the `Map` for subsequent rapid-fire journal entries.

---

## Phase 5: The SDK & Obsidian Integration Eviction

*Objective: Extract the plugin logic completely out of the backend and create a universal tool for third-party developers.*

### 5.1. Creating `@self-stats/plugin-sdk` (New Code)

* **Execution:** Create this new package in your `shared/` workspace. It must have zero dependencies on Firebase.
* **Implementation:** Build the `SelfStatsClient` class. It should accept an API Key, take in raw text, validate it using your Zod schemas from `@self-stats/contracts`, and wrap the native `fetch` API to POST to your new Firebase `api-router.ts` endpoint.

### 5.2. Migrating the Obsidian Plugin (Reuse & Relocate)

* **What to Migrate:** Take your entire `apps/api-firebase/src/plugins/obsidian-integration/` folder and completely remove it from the backend.
* **Execution:** Move this code into a brand-new folder outside of the backend (e.g., `apps/obsidian-plugin/` or a separate git repository).
* **Update:** Replace the old hardcoded `api.ts` logic in the plugin with a simple `npm install @self-stats/plugin-sdk`. The plugin will now use your newly built SDK to securely transmit local Obsidian markdown entries to your backend to be appended with AI-processed EXP and Level stats.
