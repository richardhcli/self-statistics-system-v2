# Architecture Protocol: /lib vs /stores vs shared packages

**Purpose**: Defines strict separation between pure logic, state management, and shared domain packages  
**Audience**: Developers implementing features or refactoring code  
**Last Updated**: March 2, 2026  
**Related**: [architecture.md](./architecture.md)

## Overview
This document defines the strict separation between **Pure Logic** (`/lib`), **Global State** (`/stores`), and **Shared Domain Packages** (`shared/*`). This distinction is critical for maintaining a **Hybrid Read-Aside** system that is testable, reference-stable, and free of circular dependencies.

## 1. The /lib Directory (The "Soul")
The `/lib` folder contains the domain's "Soul"—the pure math, algorithms, and data models.

### Core Responsibilities
* **Pure Functions**: Utilities must be "Data-In, Data-Out." They should never access a store directly.
* **Domain Types**: Defines the fundamental shape of entities (e.g., `NodeData`, `JournalEntry`).
* **Agnosticism**: Library code should not know it is being used in a React app or persisted to IndexedDB.

### Implementation Rules
* ❌ **NO** imports from `@web/stores`.
* ❌ **NO** Zustand `create` calls or React hooks.
* ✅ **DO** define complex types and algorithms here.



---

## 2. The /stores Directory (The "State")
The `/stores` folder manages how data is held in memory, persisted to disk, and updated.

### Core Responsibilities
* **State Management**: Implements the **Separated Selector Facade Pattern**.
* **Persistence**: Configures `idb-keyval` and handles `partialize` to ensure only raw data is saved.
* **Glue Logic**: Actions in this layer call `/lib` utilities to perform computations.

### Implementation Rules
* ✅ **DO** import types and utilities from `@web/lib`.
* ✅ **DO** group setters into a stable `actions` object.
* ✅ **DO** use `partialize` to whitelist only serializable data keys.



---

## 3. Type Definition Strategy

| Type Category | Location | Rationale |
| :--- | :--- | :--- |
| **Domain Models** | `/lib/[domain]/types.ts` | Shared source of truth for logic and state. |
| **Constants/Enums** | `/lib/[domain]/types.ts` | Prevents circular dependencies in utilities. |
| **Store State** | `/stores/[domain]/types.ts` | Describes implementation-specific memory structure. |
| **Action Signatures**| `/stores/[domain]/types.ts` | Defines how the store is mutated. |

---

## 4. Cross-Store Orchestration
When a utility needs data from multiple stores, it must be coordinated by an **Orchestrator Hook**.

1. **Orchestrator Hook**: Consumes multiple stores via the **Separated Selector Facade Pattern**.
2. **Fetch Data**: Retrieves current snapshots (e.g., `nodes` from Topology, `exp` from Stats).
3. **Execute Utility**: Passes those snapshots as arguments to the pure `/lib` or `/systems` utility.
4. **Apply Update**: Dispatches the result back to the relevant store actions.



## 5. Shared Domain Packages (`shared/*`)
Shared packages contain **pure, side-effect-free domain logic** that is consumed identically by all apps in the monorepo. Each package is an independent workspace with its own `package.json`, `tsconfig.json`, and barrel `index.ts`. Packages are referenced via `@self-stats/*` workspace protocol.

### Core Responsibilities
* **Domain Engine Logic**: Complex multi-step calculations that form a cohesive module (e.g., progression system).
* **Constants & Metadata**: Domain constants, enums, and descriptive metadata relevant to the system.
* **State Mutation Functions**: Pure functions that take state + input → return new state. They never call stores directly.
* **Shared Contracts**: TypeScript interfaces consumed by frontend, backend, and plugins.

### Implementation Rules
* ❌ **NO** imports from `@web/stores`, React hooks, or Firebase SDKs.
* ❌ **NO** side effects — all functions are pure.
* ✅ **DO** export via barrel `src/index.ts`.
* ✅ **DO** import in all apps as `@self-stats/[package]`.
* ✅ **DO** use `workspace:*` protocol in dependent `package.json` files.

### Current Shared Packages
* `shared/contracts/` (`@self-stats/contracts`) — Pure TypeScript interfaces: CDAG types, AI contracts, Firestore schemas.
* `shared/progression-system/` (`@self-stats/progression-system`) — EXP engine, level curve, attribute constants, state mutations, orchestrator logic.
* `shared/soul-topology/` (`@self-stats/soul-topology`) — Graph transforms, merge operations, entry-pipeline utilities.
* `shared/plugin-sdk/` (`@self-stats/plugin-sdk`) — Universal API client with auto-refresh auth, zero Firebase dependency.



## Summary for AI Prompt
"When creating new logic, define the core data models and pure algorithms in `/lib` (app-specific) or `shared/*` (cross-app). For cohesive domain modules (like the progression system), use a shared workspace package under `shared/`. Implement the **Separated Selector Facade Pattern** in `/stores`, importing `@self-stats/*` packages and `/lib` utilities to handle state updates. Ensure the store uses `partialize` to exclude actions from IndexedDB persistence."