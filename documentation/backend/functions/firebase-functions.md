# Firebase Functions Runbook

**Last Updated**: February 16, 2026

**Purpose**: Operational reference for Cloud Functions, emulators, and plugin pipelines.
**Audience**: Developers modifying backend integrations or running the local stack.
**Related Documents**:
	- [plugins-style-guide.md](./plugins-style-guide.md) — rules for building new plugins
	- [functions/src/index.ts](functions/src/index.ts) — exported functions registry
	- [documentation/changelog.md](documentation/changelog.md) — release notes

---

## Function Inventory
- **obsidianApi**: HTTPS ingest endpoint that stores journal content and enqueues `jobs` via `PluginSDK`. See [functions/src/plugins/obsidian-integration/api.ts](functions/src/plugins/obsidian-integration/api.ts).
- **obsidianWorker**: Firestore trigger on `users/{uid}/jobs/{jobId}` that marks jobs processing, calls AI gateway, tags the source journal entry, and updates XP. See [functions/src/plugins/obsidian-integration/worker.ts](functions/src/plugins/obsidian-integration/worker.ts).
- **aiGateway**: Mock microservice to simulate external AI latency/results. See [functions/src/microservices/ai-gateway.ts](functions/src/microservices/ai-gateway.ts).
- **journalPipeline**: Synchronous journal ingest → AI analysis → graph and XP updates in a single HTTPS call. See [functions/src/plugins/journal-pipeline/api.ts](functions/src/plugins/journal-pipeline/api.ts).

## Local Development
- Prereqs: Node.js, Java (for Firestore emulator), Firebase CLI.
- Install/build (from `/functions`):
	```bash
	npm install
	npm run build --silent
	```
- Run emulators from repo root to ensure Firestore + Functions share ports defined in `firebase.json`:
	```bash
	firebase emulators:start --only functions,firestore
	```
- HTTPS ingest base when emulators are running: `http://127.0.0.1:5001/self-statistics-system-v2/us-central1/obsidianApi`.

## Data Contracts (via PluginSDK)
- Journals: `users/{uid}/journal_entries/{entryId}` with `content`, `metadata`, `createdAt` (`Timestamp.now()`), `createdAtIso`.
- Jobs: `users/{uid}/jobs/{jobId}` with `type`, `payload`, `status ∈ {queued, processing, completed, failed}`, `result`, `errors`, timestamps.
- Player stats: `users/{uid}/user_information/player_statistics` with transactional XP updates.

## Error Handling and Logging
- Wrap HTTPS handlers with `try/catch` and return JSON `{error}`; log the raw error for emulator debugging (avoids silent 500s).
- Use `Timestamp` from `firebase-admin/firestore` instead of `FieldValue.serverTimestamp()` to keep emulator and production parity.
- All Firestore paths must be user-namespaced; avoid admin-wide reads.

## Testing
- End-to-end emulator (job queue): run [testing/testing-backend/testing-emulator/test-obsidian.py](testing/testing-backend/testing-emulator/test-obsidian.py) after starting the emulators. The script submits content, polls for job completion, and asserts AI tagging/XP updates.
- TypeScript harness: run [testing/testing-backend/testing-emulator/test-obsidian.ts](testing/testing-backend/testing-emulator/test-obsidian.ts) for the same workflow using native fetch.
