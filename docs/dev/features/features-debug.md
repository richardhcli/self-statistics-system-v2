# Feature: Debug Console

The Debug Console provides low-level access to the application's engine and persistence layer. **All debug utilities strictly adhere to the Separated Selector Facade Pattern** defined in [GLOBAL_STATE.MD](../state-management/GLOBAL_STATE.MD).

## Routing
- Base route: `/app/debug`
- Sub-routes: `/app/debug/console`, `/app/debug/graph`, `/app/debug/manual-journal-entry`, `/app/debug/datastores`, `/app/debug/authentication`
- Layout: [apps/web/src/features/debug/components/debug-view.tsx](../../apps/web/src/features/debug/components/debug-view.tsx) renders the tab bar and an `Outlet` for nested panels.

## Architecture Compliance

### State Access Pattern
Debug utilities access state using two methods:

**1. React Components (use hooks):**
```typescript
const nodes = useGraphNodes();  // State selector
const { addNode } = useGraphActions();  // Actions
```

**2. Non-React Utilities (use getState):**
```typescript
// Direct state access for serialization
const entries = useJournalStore.getState().entries;

// Direct action access for mutations
useJournalStore.getState().actions.upsertEntry(key, data);
```

### ❌ Anti-Pattern (Never Do This)
```typescript
// WRONG - Getter methods don't exist
const data = useStore.getState().actions.getData();  // ❌ Error
const data = useStore.getState().getData();  // ❌ Error

// CORRECT - Direct property access
const data = useStore.getState().data;  // ✅
```

## Components

### 1. PersistenceView
**File:** `apps/web/src/features/debug/components/persistence-view.tsx`

Displays serialized JSON of all application stores.

**Implementation:**
- Uses `serializeRootState()` from `@web/stores/root`
- Accesses state directly: `useStore.getState().dataProperty`
- Never uses non-existent getter methods

### 2. TopologyManager
**File:** `apps/web/src/features/debug/components/topology-manager.tsx`

Interactive graph node management.

**Features:**
- Add new nodes with custom labels
- Remove existing nodes
- View all nodes with type indicators

**Implementation:**
```typescript
const nodes = useGraphNodes();  // Read state
const { addNode, removeNode } = useGraphActions();  // Write actions
```

### 3. DebuggingManualJournalEntryForm
**File:** `apps/web/src/features/debug/components/debugging-manual-journal-entry-form.tsx`

Debug-only manual journal entry form for testing AI and manual action pipelines.

**Features:**
- Direct action tagging (comma-separated)
- AI toggle for forcing analysis vs manual actions
- Optional time and duration overrides

**Usage:**
- Accessible via Debug Console → Manual Journal Entry tab

### 4. TestInjections
**File:** `apps/web/src/features/debug/api/test-injections.ts`

Batch data injection utilities for testing.

**Functions:**
- `injectSampleJournalEntries()` - Adds mock journal data
- `injectSampleTopology()` - Creates sample graph structure
- `injectSamplePlayerStats()` - Injects XP values

### 5. AuthenticationView
**File:** `apps/web/src/features/debug/components/authentication-view.tsx`

Displays private authentication diagnostics for the active session.

**Fields:**
- UID, email, display name, photo URL
- Provider metadata and sign-in timestamps
- `AuthProvider` loading/timeout state

## Related
- [GLOBAL_STATE.md](../state-management/GLOBAL_STATE.md) — Store pattern reference
- [features-datastores-debug.md](./features-datastores-debug.md) — Datastore debug tools
- [architecture-lib-vs-stores.md](../architecture/architecture-lib-vs-stores.md) — Where logic lives (`/lib`, `/stores`, `/systems`)

### 6. DatastoresView
**File:** [apps/web/src/features/debug/components/datastores-view.tsx](../../apps/web/src/features/debug/components/datastores-view.tsx)

Split debug view for local and backend datastore tooling. Includes:
- Console feed: [apps/web/src/features/debug/components/datastores-console.tsx](../../apps/web/src/features/debug/components/datastores-console.tsx)
- Local datastore panel: [apps/web/src/features/debug/components/local-datastore-view.tsx](../../apps/web/src/features/debug/components/local-datastore-view.tsx)
- Backend datastore panel: [apps/web/src/features/debug/components/database-view.tsx](../../apps/web/src/features/debug/components/database-view.tsx)

## Tools
- **Batch Data Injection**:
    - **AI Dataset**: Injects raw strings for pipeline verification.
    - **Manual Dataset**: Injects pre-tagged JSON entries.
    - **Complex Set**: Injects a 15-node multi-root hierarchy to test layout stability.
- **Experience Injector**: Manually add EXP to any node to verify back-propagation math.
- **Raw Data Browser**: Live JSON view of all IndexedDB tables.
- **Neural Wipe**: Catastrophic reset button that clears all local storage.

## Usage Guidelines

### Adding New Debug Tools

When creating new debug utilities:

1. **Use Hooks in Components:**
   ```typescript
   const data = useFeatureData();
   const { update } = useFeatureActions();
   ```

2. **Use getState() in Utilities:**
   ```typescript
   const data = useFeatureStore.getState().data;
   useFeatureStore.getState().actions.update(newData);
   ```

3. **Never Create Getters:**
   ```typescript
   // ❌ DON'T do this
   export const getData = () => useStore.getState().actions.getData();
   
   // ✅ DO this
   export const getData = () => useStore.getState().data;
   ```

## Related Documentation

- [GLOBAL_STATE.MD](../state-management/GLOBAL_STATE.MD) - **Immutable** pattern specification
- [ORCHESTRATOR_PATTERN.MD](../state-management/ORCHESTRATOR_PATTERN.MD) - Cross-store coordination
- [State Management README](../state-management/state-management-README.md) - Architecture overview