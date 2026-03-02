# Plugin & Integration Style Guide

**Last Updated**: March 2, 2026

**Purpose**: Rules for building external integrations that communicate with the Firebase backend.
**Audience**: Backend integrators and developers adding new ingest endpoints.
**Related Documents**:
  - [firebase-functions.md](./firebase-functions.md) — functions runbook and operational notes
  - [apps/api-firebase/src/index.ts](../../../../apps/api-firebase/src/index.ts) — exported functions registry
  - [shared/plugin-sdk/src/index.ts](../../../../shared/plugin-sdk/src/index.ts) — universal client SDK
  - [../../authentication/api-authentication-pipeline.md](../../authentication/api-authentication-pipeline.md) — Custom Token auth flow

---

## Authentication Model
External integrations use **Firebase Custom Tokens** (not API keys). The lifecycle:
1. Web app mints a 1-hour Setup Code via `generateFirebaseAccessToken` callable.
2. Plugin exchanges Setup Code for ID Token + Refresh Token via `@self-stats/plugin-sdk`.
3. SDK auto-refreshes expired tokens on subsequent requests.
4. Backend middleware (`authenticateRequest`) validates Bearer tokens via `verifyIdToken()`.

## Architecture
New integrations follow the 3-layer backend pattern:
- **Data-access** (`apps/api-firebase/src/data-access/`): Firestore CRUD, user-scoped.
- **Services** (`apps/api-firebase/src/services/`): Business logic orchestration.
- **Endpoints** (`apps/api-firebase/src/endpoints/`): HTTP surface — callable or REST.

## Client SDK (`@self-stats/plugin-sdk`)
External plugins should use `SelfStatsClient` from `@self-stats/plugin-sdk`:
- Platform-agnostic (works in Node.js, Obsidian, browser, mobile).
- Handles automatic ID token refresh.
- `StorageAdapter` interface for pluggable token persistence.
- Methods: `submitJournalEntry()`, `submitObsidianNote()`, `getStatus()`.

## Data and Collections
- Journals: `users/{uid}/journal_entries/{entryId}` with `content`, `metadata`, `createdAt`.
- Player stats: `users/{uid}/user_information/player_statistics` with transactional XP updates.
- Graphs: `users/{uid}/graphs/cdag_topology` with subcollections `nodes`, `edges`, `graph_metadata/topology_manifest`.

## Safety and Error Handling
- Wrap HTTPS handlers in `try/catch`; return structured JSON `{error}` on failure.
- Use `Timestamp` from `firebase-admin/firestore` for emulator parity.
- All Firestore paths must be user-namespaced.
- Use `ignoreUndefinedProperties: true` in Firestore initialization.

## Testing
- Use `testing/testing-backend/testing-emulator/test-obsidian.ts` against Firebase emulators.
- SDK sandbox: `pnpm run sdk:sandbox` for dry-run client validation.
- Keep AI mocks deterministic for repeatable CI runs.
