**Action Plan: Universal Client-Side SDK (Firebase Custom Token Auth)**

**Date:** 2026-02-28  
**Status:** Draft for implementation  
**Scope:** `shared/plugin-sdk` (new client-side package), external consumers (Obsidian plugin, CLI scripts)

---

## Goal
Deliver a platform-agnostic client SDK that authenticates against the new Firebase Custom Token pipeline (already implemented server-side). The SDK must:
- Exchange the 1-hour Custom Token ("Connection Code") for an ID/Refresh token pair.
- Persist the Refresh Token via an injected storage adapter (no platform assumptions).
- Auto-refresh ID tokens on demand.
- Send authenticated requests to the deployed REST endpoints (`apiRouter`, `obsidianWebhook`) using `Authorization: Bearer <ID_TOKEN>`.

---

## Deliverables
1) **New module:** `shared/plugin-sdk/src/client.ts` — universal SDK class `SelfStatsClient` with storage injection.  
2) **Exports:** `shared/plugin-sdk/src/index.ts` — re-export `SelfStatsClient` and `StorageAdapter`.  
3) **Node sandbox:** `scripts/sdk-sandbox.ts` — manual test harness using filesystem storage.  
4) **Docs:** Update `docs/dev/authentication/api-authentication-pipeline.md` with client-side steps and sample cURL for the exchange/refresh flow.  
5) **Obsidian wiring guide:** Short section in `docs/dev/authentication/api-authentication-pipeline.md` describing storage adapter wiring and command hook (re-using the same SDK).

---

## Implementation Plan

### A. SDK Core (`shared/plugin-sdk/src/client.ts`)
- Define `StorageAdapter` interface:
  - `getRefreshToken(): Promise<string | null>`
  - `setRefreshToken(token: string): Promise<void>`
  - `clearRefreshToken(): Promise<void>`
- Define `SelfStatsConfig`:
  - `firebaseApiKey` (public Web API Key, already in web `services.ts`)
  - `backendUrl` (Functions base, e.g. `https://us-central1-self-statistics-system-v2.cloudfunctions.net`)
  - `storage` (implements `StorageAdapter`)
- Implement `SelfStatsClient`:
  - `exchangeSetupCode(customToken: string)`: POST to `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseApiKey}` with `{ token, returnSecureToken: true }`; persist `refreshToken`; cache `idToken` + `expiresIn`.
  - `getValidIdToken()`: if cached and not within 5m of expiry, return; else POST to `https://securetoken.googleapis.com/v1/token?key=${firebaseApiKey}` with `{ grant_type: 'refresh_token', refresh_token }`; update cache; on failure clear storage and throw.
  - `submitJournal(rawText: string, timestamp?: number)`: fetch `backendUrl/apiRouter` with body `{ rawText, timestamp }`, headers `Authorization: Bearer <idToken>` and `Content-Type: application/json`.
  - Optionally expose `postWebhook` helper to call `backendUrl/obsidianWebhook` with `{ content, duration }` using the same auth flow.

### B. Package Surface (`shared/plugin-sdk/src/index.ts`)
- Re-export `SelfStatsClient`, `StorageAdapter`, `SelfStatsConfig`.
- Add a minimal README note (if README exists) pointing to `docs/dev/authentication/api-authentication-pipeline.md`.

### C. Node Sandbox (`scripts/sdk-sandbox.ts`)
- FS-backed storage adapter (`token.json`).
- Prompt for `customToken` (stdin). Sequence: `exchangeSetupCode`, then `submitJournal("SDK sandbox test")`.
- Print responses; on refresh failure, clear storage and log actionable message.

### D. Obsidian Integration Notes
- Storage adapter example using `this.plugin.loadData()` / `saveData()` / `saveData(null)`.
- Settings UI: input for Connection Code; on save, call `client.exchangeSetupCode(code)`.
- Command hook: e.g., "Process Current Note" → `client.submitJournal(activeFileText)`.

### E. Testing
- Unit-ish check via sandbox script (manual): validate exchange, submit, refresh (simulate expiry by setting `tokenExpirationTime = 0` in script between calls).
- End-to-end: run sandbox against deployed Functions (auth via `generateFirebaseAccessToken` from web UI) and confirm 200 from `apiRouter`.

---

## Acceptance Criteria
- SDK compiles (`pnpm build` inside `shared/plugin-sdk` if configured, or `tsc --noEmit`).
- Sandbox script successfully exchanges a real Connection Code and posts a journal entry to the live `apiRouter` endpoint.
- Refresh path succeeds after forcing cache expiry.
- No platform-specific dependencies beyond `fetch` and injected storage adapter.
- Documentation updated in `docs/dev/authentication/api-authentication-pipeline.md` with the client-side steps and sample calls.

--
