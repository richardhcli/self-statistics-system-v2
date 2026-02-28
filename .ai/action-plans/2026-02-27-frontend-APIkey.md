# Action Plan: Google Auth Integration Pipeline (Custom Tokens)

**Date:** 2026-02-28  
**Status:** Approved for Implementation  
**Scope:** `apps/api-firebase`, `apps/web`

---

## Summary

Replace the existing SHA-256 API Key authentication system with **Firebase Custom Token authentication**. External clients (Obsidian plugin, future SDK consumers) will authenticate by exchanging a one-time "Connection Code" (generated on the web dashboard) for a permanent Firebase session (ID Token + Refresh Token pair), managed entirely by Google's Identity Platform.

**What changes:**
- Backend mints Custom Tokens instead of generating API keys.
- REST middleware validates `Authorization: Bearer <idToken>` instead of `x-api-key`.
- Frontend provides a "Generate Connection Code" UI instead of API key management.
- Legacy API key files are deleted.

**What stays the same:**
- `PluginSDK` class (`apps/api-firebase/src/plugin-sdk/index.ts`) — unchanged. It is a server-side Firestore abstraction scoped to a `userId`. The middleware resolves `userId` from the token and passes it in.
- `processJournal` service — unchanged. It already accepts a `userId` parameter.
- `obsidianWebhook` & `apiRouter` endpoint structure — same shape, only the auth call changes.

---

## Phase 1: Backend — Create Token Minting Endpoint

### 1.1 New File: `apps/api-firebase/src/endpoints/callable/integration-auth.ts`

This is a new `onCall` (v2) Cloud Function. The web dashboard calls it to generate a one-time Custom Token.

**Imports needed:** `onCall`, `HttpsError` from `firebase-functions/v2/https`; `getAuth` from `firebase-admin/auth`.

**Function:** `generateIntegrationToken`
```
export const generateIntegrationToken = onCall(async (request) => {
  // 1. Guard: request.auth must exist (user must be logged in via Firebase Auth on the web app).
  //    If not → throw new HttpsError("unauthenticated", "Must be signed in.")
  
  // 2. Mint: const customToken = await getAuth().createCustomToken(request.auth.uid)
  //    This produces a JWT signed by Google's service account private key.
  //    It is valid for 1 hour. It can only be used once to sign in.
  
  // 3. Return: { token: customToken }
});
```

**Note:** `admin-init.ts` currently exports `db` and `FieldValue` only. We do NOT need to modify it — `getAuth()` from `firebase-admin/auth` works without a reference to the app instance when a default app is already initialized (which `admin-init.ts` guarantees via `initializeApp()`).

### 1.2 Register Export: `apps/api-firebase/src/index.ts`

**Current state (line 35):**
```typescript
export {createUserApiKey, revokeUserApiKey} from "./endpoints/callable/api-keys";
```

**Change to:**
```typescript
export {generateIntegrationToken} from "./endpoints/callable/integration-auth";
```

This removes the old API key exports and registers the new callable.

---

## Phase 2: Backend — Refactor REST Middleware to Bearer Token Auth

### 2.1 Rewrite: `apps/api-firebase/src/endpoints/rest/middleware.ts`

**Current state:** Exports `authenticateApiKey(req, res)` which reads `x-api-key` header, hashes it, checks `api_keys/{hash}` in Firestore, uses a 5-minute in-memory cache.

**New state:** Export `authenticateRequest(req, res)` which reads `Authorization: Bearer <token>` header, calls `getAuth().verifyIdToken(token)`, returns `decodedToken.uid`.

```
// Delete: validateApiKey import, keyCache, CACHE_TTL_MS, hashKey references
// Import: getAuth from "firebase-admin/auth"

export const authenticateRequest = async (req, res): Promise<string | null> => {
  // 1. Extract: const authHeader = req.headers.authorization
  //    If missing or doesn't start with "Bearer " → res.status(401).json({error: "Missing Authorization header"}) → return null
  
  // 2. Parse: const idToken = authHeader.split("Bearer ")[1]
  
  // 3. Verify: const decoded = await getAuth().verifyIdToken(idToken)
  //    On error → res.status(401).json({error: "Invalid or expired token"}) → return null
  
  // 4. Return: decoded.uid
};
```

**Why no cache needed:** `verifyIdToken()` uses Google's public key cache internally. The RS256 signature verification is a CPU operation, not a Firestore read. It's already O(1).

### 2.2 Update Consumers of Old Middleware

Two files import `authenticateApiKey`. Both change to `authenticateRequest`:

**File 1:** `apps/api-firebase/src/endpoints/rest/api-router.ts` (line 19)
- Change: `import {authenticateApiKey} from "./middleware"` → `import {authenticateRequest} from "./middleware"`
- Change: `const userId = await authenticateApiKey(req, res)` → `const userId = await authenticateRequest(req, res)`

**File 2:** `apps/api-firebase/src/endpoints/rest/obsidian-webhook.ts` (line 19)
- Change: `import {authenticateApiKey} from "./middleware"` → `import {authenticateRequest} from "./middleware"`
- Change: `const userId = await authenticateApiKey(req, res)` → `const userId = await authenticateRequest(req, res)`

---

## Phase 3: Frontend — Connection Code UI

### 3.1 New File: `apps/web/src/features/integration/components/connection-code.tsx`

A new component added to the existing Integration view. It uses `httpsCallable` from the already-initialized `functions` instance in `apps/web/src/lib/firebase/services.ts`.

**Imports:**
- `{ useState }` from React
- `{ httpsCallable }` from `firebase/functions`
- `{ functions }` from `@/lib/firebase/services` (already exported)
- `{ Copy, RefreshCw, AlertTriangle, Check, Smartphone }` from `lucide-react`

**Component:** `ConnectionCode`
```
State:
  - loading: boolean (false)
  - token: string | null (null)
  - copied: boolean (false)

generateToken():
  - setLoading(true)
  - const fn = httpsCallable(functions, "generateIntegrationToken")
  - const result = await fn()
  - setToken(result.data.token)
  - setLoading(false)

handleCopy():
  - navigator.clipboard.writeText(token)
  - setCopied(true), reset after 2s

UI:
  - When token is null: Card with "Generate Connection Code" button
  - When token exists: Amber warning card with:
    - <code> block displaying the raw token (select-all, monospace, scrollable)
    - Copy button
    - Warning text: "This code expires in 60 minutes. Copy it now — it will not be shown again."
    - "Close & Clear" link that sets token back to null
```

**Styling convention:** Match existing cards in `integration-view.tsx` — `bg-white rounded-3xl p-8 border border-slate-200 shadow-sm`, `text-[10px] font-black uppercase tracking-widest` for labels.

### 3.2 Mount in: `apps/web/src/features/integration/components/integration-view.tsx`

Add `<ConnectionCode />` to the grid inside `IntegrationView`, between `<DataPortability />` and `<WebhookConfig />`.

```tsx
import { ConnectionCode } from './connection-code';

// Inside the grid:
<DataPortability />
<ConnectionCode />       {/* NEW */}
<WebhookConfig ... />
```

No new routes or stores needed. The component is self-contained with local state.

---

## Phase 4: Delete Legacy API Key Code

### 4.1 Delete Files
| File | Reason |
|---|---|
| `apps/api-firebase/src/data-access/api-keys-repo.ts` | SHA-256 hashing + `api_keys` collection logic — fully replaced by `verifyIdToken`. |
| `apps/api-firebase/src/endpoints/callable/api-keys.ts` | `createUserApiKey` / `revokeUserApiKey` — replaced by `generateIntegrationToken`. |

### 4.2 Verify No Remaining Imports
After deletion, run `tsc --noEmit` to confirm no dangling imports. The only consumers were:
- `middleware.ts` (import `validateApiKey`) → already rewritten in Phase 2.
- `index.ts` (export `createUserApiKey`, `revokeUserApiKey`) → already rewritten in Phase 1.

### 4.3 Firestore Cleanup (Manual)
The `api_keys` collection in Firestore can be deleted via the Firebase Console. No production data exists yet (pre-launch).

---

## Phase 5 (Future — Not This PR): SDK Client-Side Token Exchange

The `plugin-sdk` currently only runs server-side (`apps/api-firebase/src/plugin-sdk/index.ts`). When we build the external Obsidian plugin, it will need a **client-side** companion that:

1. Takes the Connection Code (Custom Token) from the user.
2. POSTs to `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyBljfgY4PY2cxy3rYAzSAUYa2b4-PRF1TA` with `{ token, returnSecureToken: true }`.
3. Receives `{ idToken, refreshToken }`. Persists `refreshToken` to the host's storage.
4. On subsequent requests, attaches `Authorization: Bearer <idToken>`. On 401, refreshes via `https://securetoken.googleapis.com/v1/token?key=AIzaSyBljfgY4PY2cxy3rYAzSAUYa2b4-PRF1TA` with `{ grant_type: "refresh_token", refresh_token }`.

This is documented here for completeness but is **out of scope** for the current implementation. The current PR delivers Phases 1–4 only.

---

## Execution Checklist

| # | Task | Files |
|---|---|---|
| 1 | Create `generateIntegrationToken` callable | `endpoints/callable/integration-auth.ts` |
| 2 | Update `index.ts` exports (swap api-keys → integration-auth) | `index.ts` |
| 3 | Rewrite `middleware.ts` (Bearer token auth) | `endpoints/rest/middleware.ts` |
| 4 | Update `api-router.ts` import | `endpoints/rest/api-router.ts` |
| 5 | Update `obsidian-webhook.ts` import | `endpoints/rest/obsidian-webhook.ts` |
| 6 | Create `ConnectionCode` component | `features/integration/components/connection-code.tsx` |
| 7 | Mount in `IntegrationView` | `features/integration/components/integration-view.tsx` |
| 8 | Delete `api-keys-repo.ts` | `data-access/api-keys-repo.ts` |
| 9 | Delete `api-keys.ts` | `endpoints/callable/api-keys.ts` |
| 10 | `tsc --noEmit` + `npm run lint` — verify clean build | — |

