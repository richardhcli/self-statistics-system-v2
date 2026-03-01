**Action Plan: SDK Sandbox + Obsidian Setup Code Validation**

**Date:** 2026-02-28  
**Status:** Implemented — SDK builds, sandbox loads, ready for live Setup Code test  
**Scope:** Validate Custom Token auth end-to-end via the SDK sandbox; outline the Obsidian plugin hookup using the same flow.

---

## Goal
Prove that the Custom Token (1-hour Setup Code) auth path works end-to-end with `@self-stats/plugin-sdk`, and capture the exact steps needed for Obsidian to use the same flow.

## Preconditions
- Firebase backend already accepts `Authorization: Bearer <ID_TOKEN>` on `apiRouter` and `obsidianWebhook`.
- Setup Code (Firebase Custom Token) available from the React UI.
- Env vars available to the runner: `FIREBASE_API_KEY`, `BACKEND_URL` (defaults to the deployed functions origin if omitted).

## Workstream A: SDK Sandbox Test
1. **Build SDK**: `pnpm --filter @self-stats/plugin-sdk build` from repo root (emits `dist` for consumers; sandbox can run via ts-node/tsx against source if desired).
2. **Sandbox script**: Use `scripts/sdk-sandbox.ts` (file-backed storage at `.selfstats-tokens.json` in CWD; storage key `selfstats:<projectId>:tokens`).
3. **Run**: `FIREBASE_API_KEY=... BACKEND_URL=... ts-node scripts/sdk-sandbox.ts` (or `tsx ...`). When prompted, paste the 1-hour Setup Code.
4. **Verify token cache**: Confirm `.selfstats-tokens.json` exists and contains `refreshToken` plus `idToken` metadata.
5. **API call**: Observe console output from `submitJournalEntry("Test journal from sdk-sandbox")`; expect 2xx with entry/graph/stats payload.
6. **Refresh path (optional but recommended)**: Manually edit `.selfstats-tokens.json` to set `expiresAt` to a past timestamp, rerun step 3 without re-entering the Setup Code; expect automatic refresh via Secure Token API and successful journal call.

## Workstream B: Obsidian Plugin Hookup (plan)
1. **Storage adapter**: Implement `StorageAdapter` using plugin data API (`loadData`/`saveData`) and a stable key `selfstats:<projectId>:tokens`.
2. **Settings UI**: Add "Setup Code" input; on save, call `client.exchangeCustomToken(code)` and persist tokens.
3. **Command flow**: For "Process Current Note", load note text, call `submitJournalEntry` (or `submitObsidianNote` if using duration), rely on auto-refresh for expired ID tokens.
4. **Error handling**: On auth failure (exchange or refresh), clear stored tokens and surface a concise prompt to re-enter a fresh Setup Code.

## Acceptance Criteria
- Sandbox run succeeds: exchange completes, tokens cached, journal POST returns 2xx with payload.
- Refresh simulation succeeds after forced expiry without re-entering the Setup Code.
- Obsidian integration steps above are unambiguous and align with the SDK surface (`exchangeCustomToken`, `submitJournalEntry`, `submitObsidianNote`).
- No reliance on static API keys anywhere; all flows use the 1-hour Setup Code → ID/Refresh token path.
