# Firebase Functions Runbook

**Last Updated**: March 2, 2026

**Purpose**: Operational reference for Cloud Functions, the 3-layer backend architecture, and local development.
**Audience**: Developers modifying backend integrations or running the local stack.
**Related Documents**:
	- [plugins-style-guide.md](./plugins-style-guide.md) — rules for building new integrations
	- [apps/api-firebase/src/index.ts](../../../../apps/api-firebase/src/index.ts) — exported functions registry
	- [../../CHANGELOG.md](../../../../CHANGELOG.md) — release notes

---

## Architecture: 3-Layer Monolith

The backend follows a **data-access → services → endpoints** layered architecture inside `apps/api-firebase/src/`.

### Data-Access Layer
Pure Firestore CRUD operations, user-scoped:
- `data-access/graph-repo.ts` — Graph nodes, edges, manifests.
- `data-access/user-repo.ts` — User profile, player statistics.
- `data-access/journal-repo.ts` — Journal entries and metadata.

### Services Layer
Business logic orchestration:
- `services/ai-orchestrator.ts` — Gemini AI provider (`nodeAiProvider` adapter), topology generation.
- `services/journal-service.ts` — Unified pipeline: AI extraction → topology transform (via `@self-stats/soul-topology`) → progression calc (via `@self-stats/progression-system`) → Firestore persistence. Returns `JournalResult` with `statChanges`.
- `services/graph-service.ts` — Thin facade wrapping graph data-access repos.

### Endpoints Layer
- `endpoints/callable/journal.ts` — `onCall` + Firebase Auth. Used by the web app.
- `endpoints/callable/integration-auth.ts` — `generateFirebaseAccessToken`. Mints 1-hour Custom Tokens via `getAuth().createCustomToken(uid)`.
- `endpoints/rest/api-router.ts` — REST endpoint with Bearer token auth. Used by external integrations.
- `endpoints/rest/obsidian-webhook.ts` — Obsidian-specific webhook endpoint.
- `endpoints/rest/middleware.ts` — `authenticateRequest` — Bearer token + `verifyIdToken()` validation.

## Function Exports
All exports are defined in `apps/api-firebase/src/index.ts`:
- `processJournalEntry` (callable) — Web app journal ingestion.
- `generateFirebaseAccessToken` (callable) — Custom Token minting.
- `apiRouter` (onRequest) — REST API for external integrations.
- `obsidianWebhook` (onRequest) — Obsidian-specific REST endpoint.

## Local Development
- **Prereqs**: Node.js 20, Java (for Firestore emulator), Firebase CLI, pnpm.
- **Build & Serve** (from monorepo root):
	```bash
	pnpm --filter api-firebase run serve
	```
	This runs esbuild in watch mode + Firebase emulators (`functions` + `firestore`).
- **Full stack** (web + backend):
	```bash
	pnpm run dev
	```
- **Build only**:
	```bash
	pnpm --filter api-firebase run build
	```
	Uses `build.mjs` (esbuild) to produce `dist/index.js` with an Isolated Dist `package.json`.

## Secret Management
- Secrets bound via `defineSecret("GOOGLE_AI_API_KEY")` for Gen 2 Cloud Run functions.
- `sync-secrets.mjs` pushes local `.env` values to Google Cloud Secret Manager before deployment.
- **Deploy**: `pnpm --filter api-firebase run deploy` (build + sync-secrets + firebase deploy --only functions).

## Data Contracts
- Journals: `users/{uid}/journal_entries/{entryId}`
- Player stats: `users/{uid}/user_information/player_statistics`
- Graphs: `users/{uid}/graphs/cdag_topology` with subcollections `nodes`, `edges`, `graph_metadata`

## Error Handling
- Wrap HTTPS handlers with `try/catch` and return JSON `{error}`.
- Use `Timestamp` from `firebase-admin/firestore` for emulator parity.
- All Firestore paths are user-namespaced.
- `ignoreUndefinedProperties: true` in Firestore init to prevent `undefined` value crashes.

## Testing
- Emulator test: `testing/testing-backend/testing-emulator/test-obsidian.ts` (uses `SelfStatsClient` with Custom Token exchange).
- SDK sandbox: `pnpm run sdk:sandbox` (dry-run validation of `@self-stats/plugin-sdk`).
