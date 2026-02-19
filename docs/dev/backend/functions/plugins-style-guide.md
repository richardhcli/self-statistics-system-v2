# Plugin System Style Guide

**Last Updated**: February 16, 2026

**Purpose**: Shared rules for building and operating plugins that touch Firestore via Cloud Functions.
**Audience**: Backend integrators and feature owners adding new ingest endpoints or workers.
**Related Documents**:
  - [firebase-functions.md](./firebase-functions.md) — functions runbook and operational notes
  - [functions/src/plugin-sdk/index.ts](functions/src/plugin-sdk/index.ts) — user-scoped Firestore helper
  - [functions/src/plugins/obsidian-integration/api.ts](functions/src/plugins/obsidian-integration/api.ts) — example HTTPS ingress
  - [functions/src/plugins/obsidian-integration/worker.ts](functions/src/plugins/obsidian-integration/worker.ts) — example Firestore-triggered worker

---

## Scope and Responsibilities
- Plugins must only read/write through `PluginSDK`, which enforces user scoping under `users/{uid}/...` and prevents cross-tenant access.
- Each plugin owns two surfaces: an **ingest interface** (HTTPS or webhook) and an **async worker** (Firestore trigger) that finalizes processing.
- Queueable work must live in `users/{uid}/jobs/{jobId}`; long-running tasks should be asynchronous and idempotent.

## Data and Collections
- Journals: `users/{uid}/journal_entries/{entryId}` with `createdAt` as `Timestamp.now()` plus ISO string for debugging.
- Jobs: `users/{uid}/jobs/{jobId}` with `status ∈ {queued, processing, completed, failed}`, `payload`, `result`, `errors`, and timestamps.
- User stats: `users/{uid}/user_information/player_statistics` for XP updates; mutate via the SDK helper to ensure transactions.
- Graphs: `users/{uid}/graphs/cdag_topology` with `nodes`, `edges`, and `graph_metadata/topology_manifest` for adjacency + summaries. Always keep the `progression` root and update manifest metrics when adding edges.

## Job Lifecycle Rules
1. Ingest surface stores the source document and enqueues a job with `status=queued`.
2. Worker listens on job writes, marks `processing`, fetches source payloads, calls external AI/microservices, and writes `result`.
3. On success, set `status=completed`; on failure, set `status=failed` and append an error string. Jobs should be retry-safe.

## Safety and Error Handling
- Wrap HTTPS handlers in `try/catch`; return structured JSON `{error}` on failure and log the raw error for emulator inspection.
- Use `Timestamp` from `firebase-admin/firestore`; avoid `FieldValue.serverTimestamp()` to keep emulator parity and eliminate undefined imports.
- Never perform admin-wide queries; all Firestore paths must be user-namespaced and predictable.

## Testing Expectations
- Local: run the Firestore/Functions emulator and execute [testing/testing-backend/testing-emulator/test-obsidian.py](testing/testing-backend/testing-emulator/test-obsidian.py) to verify submit → queue → completion.
- For synchronous pipelines (e.g., `journalPipeline`), prefer deterministic AI mocks and add a TypeScript harness (see [testing/testing-backend/testing-emulator/test-obsidian.ts](testing/testing-backend/testing-emulator/test-obsidian.ts)).
- Add a polling harness for every new plugin that validates both ingest and worker behavior.
- Keep mock services (e.g., AI gateway) deterministic enough for repeatable CI runs.
