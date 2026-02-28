# Action Plan: Google Authentication Integration (OAuth2 / Custom Tokens)

**Date:** 2026-02-27
**Status:** Approved for Implementation
**Scope:** `apps/api-firebase`, `apps/web`, `@self-stats/plugin-sdk`

---

## 🎯 Executive Summary

This plan replaces the previous "API Key" strategy with a robust **OAuth2-style authentication flow** using Firebase Custom Tokens.
This ensures:
1.  **Security:** No permanent secrets (API keys) are ever displayed or stored insecurely.
2.  **Rotation:** Tokens expire automatically (1 hour) and are refreshed via standard protocols.
3.  **Standardization:** Uses the official Google Identity Platform infrastructure rather than custom validation logic.

---

## Phase 1: Backend Implementation (The Minting Service)

We need a secure way for the authenticated user (on the dashboard) to request a "Connection Code" (Custom Token) that acts as a one-time credential for their external device.

### 1.1 Create `generateIntegrationToken` Callable
This function mints the token.

**File:** `apps/api-firebase/src/endpoints/callable/integration-auth.ts`
*   **Action:** Create new file.
*   **Decorator:** `@onCall` (Firebase v2).
*   **Logic:**
    1.  Check `request.auth`. If null -> `throw new HttpsError('unauthenticated')`.
    2.  `const uid = request.auth.uid`.
    3.  `const token = await admin.auth().createCustomToken(uid, { mechanism: 'plugin_flow' })`.
    4.  Return `{ token }`.

### 1.2 Update Middleware for REST API
The REST API currently (or previously) checks for API Keys in headers. It must now validate standardized Bearer tokens.

**File:** `apps/api-firebase/src/endpoints/rest/middleware.ts` (or equivalent location for shared middleware)
*   **Action:** Refactor `authenticateRequest`.
*   **Logic:**
    1.  Parse `Authorization` header. Expect: `Bearer <token>`.
    2.  Call `admin.auth().verifyIdToken(token)`.
    3.  If valid, return `decodedToken.uid`.
    4.  If invalid (expired/malformed), throw error or return null (triggering 401).

---

## Phase 2: Frontend Implementation (The Dashboard UI)

The user needs a place to get their "Connection Code".

### 2.1 Create `IntegrationSettings` Component
**File:** `apps/web/src/features/settings/IntegrationSettings.tsx`
*   **UI Layout:**
    *   Card title: "Connect External App".
    *   Description: "Generate a one-time code to log in from Obsidian or VS Code."
    *   Button: "Generate Connection Code" (Triggers `generateIntegrationToken`).
    *   Display Area: A code block showing the resulting token.
    *   Warning: "Valid for 60 minutes. Copy immediately."
*   **State Management:** Local React state is sufficient. No global store needed for this temporary value.

---

## Phase 3: SDK Implementation (The Client Logic)

The SDK running in the plugin (Obsidian) needs to seamlessly exchange the connection code for a session.

### 3.1 `exchangeSetupCode` Method
**File:** `apps/api-firebase/src/plugin-sdk/index.ts` (or `client.ts`)
*   **Input:** `setupCode` (The Custom Token from step 1).
*   **API Call:**
    *   POST `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=[API_KEY]`
    *   Body: `{ token: setupCode, returnSecureToken: true }`
*   **Response Handling:**
    *   Receive: `idToken` (Access Token) and `refreshToken`.
    *   Action: Persist `refreshToken` to local storage (using the host's storage adapter).

### 3.2 `authenticatedFetch` Interceptor
**File:** `apps/api-firebase/src/plugin-sdk/client.ts`
*   **Logic:**
    1.  Check if current `idToken` exists and is valid (optional optimization: check expiry time).
    2.  If invalid/missing:
        *   Call `https://securetoken.googleapis.com/v1/token?key=[API_KEY]`
        *   Body: `{ grant_type: 'refresh_token', refresh_token: storedRefreshToken }`
        *   Save new `idToken`.
    3.  Proceed with request, adding `Authorization: Bearer <idToken>`.

---

## Phase 4: Clean Up & Security

### 4.1 Remove Legacy API Key Logic
*   **Target:** `apps/api-firebase/src/data-access/api-keys-repo.ts` (Delete if no longer used).
*   **Target:** `apps/api-firebase/src/endpoints/callable/api-keys.ts` (Delete).
*   **Target:** Firestore `api_keys` collection (Delete or archive).
*   **Target:** Firestore `users/{uid}/apiKey` field (Remove).

### 4.2 Security Rules
*   Ensure only the correct user can mint tokens for themselves (handled by `request.auth` check in Callable).
*   Ensure the REST API is locked down to standard Firebase Auth ID tokens.

---

## Execution Order
1.  **Backend:** Implement `generateIntegrationToken`.
2.  **Backend:** Refactor REST middleware to verify ID tokens.
3.  **Frontend:** Build `IntegrationSettings` to test token generation.
4.  **Backend/SDK:** Implement the token exchange flow manually (curl/Postman) to verify.
5.  **Cleanup:** Remove old API key code.

