This is an excellent strategy. Handing off a well-scoped context document to an external agent is the best way to maintain momentum without losing the architectural context we just established.

Here is a comprehensive, highly structured Plan-of-Action document. You can copy and paste this directly into your external AI agent's prompt interface.

---

# AI Agent Action Plan: Resolving Firebase Custom Token Authentication

## 1. Architectural Context

We are building the "Self Statistics System" within a monorepo structure.

* **Backend (`apps/api-firebase`):** Firebase Cloud Functions acting as a unified REST API (`apiRouter`).
* **Shared SDK (`shared/plugin-sdk`):** A platform-agnostic TypeScript client (`SelfStatsClient`) that handles authentication and API requests.
* **Client (`apps/obsidian-plugin`):** A native Obsidian plugin that uses the shared SDK.

**The Authentication Flow:**
Instead of storing permanent API keys or passing raw credentials, the system uses a highly secure token exchange:

1. The user logs into a React frontend web app.
2. The React app requests a 1-hour "Setup Code" (a Firebase Custom Token minted via `admin.auth().createCustomToken(uid)`).
3. The user pastes this Custom Token into the Obsidian plugin settings.
4. The Obsidian plugin uses the SDK to call Google Identity Toolkit's `signInWithCustomToken` endpoint to exchange it for a permanent Refresh Token and a short-lived ID Token.

## 2. The Current Blocker

The Obsidian plugin successfully bundles the SDK and makes the network request, but the `signInWithCustomToken` endpoint is returning a `400 (Bad Request)`.

Currently, the SDK throws a generic `SelfStatsAuthError: Failed to exchange custom token`, swallowing the exact reason Google rejected the payload.

## 3. Execution Phases

### Phase 1: Expose the Exact Firebase Error

Your first task is to update the SDK to parse and log the specific Google error string.

1. Target File: `shared/plugin-sdk/src/client.ts`
2. Locate the `exchangeCustomToken` method.
3. Update the `!res.ok` error handling block to extract `body?.error?.message`:
```typescript
 if (!res.ok) {
   const body = await safeJson(res) as any;
   const fbError = body?.error?.message || "Unknown Firebase Error";
   throw new SelfStatsAuthError(`Exchange failed: ${fbError}`, res.status);
 }

```


4. Instruct the user to rebuild the SDK (`pnpm run build` in the sdk folder) and the Obsidian plugin (`pnpm run build` in the obsidian folder).
5. Have the user click "Connect" in Obsidian and provide you with the exact extracted error message from the developer console.

### Phase 2: Execute Resolution Branch

Based on the error message extracted in Phase 1, execute one of the following resolution paths:

#### Path A: `API_KEY_SERVICE_BLOCKED`

**Cause:** The Firebase Web API Key has "Application Restrictions" enabled in Google Cloud Console, which is rejecting Obsidian's native desktop protocol.
**Action:** 1. Guide the user to Google Cloud Console -> APIs & Services -> Credentials.
2. Open the Firebase Web API Key.
3. Add the following protocols to the allowed Websites list:

* `app://obsidian.md/*`
* `capacitor://localhost/*`
* `http://localhost/*`
* `file:///*`

4. Explicitly warn the user that Google Cloud API key updates take up to 5 minutes to propagate.

#### Path B: `INVALID_CUSTOM_TOKEN`

**Cause:** The React frontend (or the backend endpoint serving it) generated the wrong type of token. It likely handed back a standard User ID Token instead of minting a Custom Token.
**Action:**

1. Shift focus to the backend codebase where the "Setup Code" is generated.
2. Ensure the code is strictly using the Firebase Admin SDK to mint the token:
`const customToken = await admin.auth().createCustomToken(user.uid);`
3. Verify the React app is displaying this exact `customToken` string, not calling `user.getIdToken()`.

### Phase 3: Verification

Once the specific fix is applied:

1. Instruct the user to test the "Connect" button in the Obsidian plugin settings.
2. Upon success (yielding the "Authentication successful" notice), instruct the user to trigger the `New journal entry` command in the Obsidian command palette.
3. Verify that the SDK successfully attaches the new Bearer ID Token to the request, routes to the `apiRouter` endpoint, and successfully injects the parsed EXP and Level into the markdown editor.

---

Would you like me to hold here while you pass this to the external agent, or is there another part of the system you want to explore next?