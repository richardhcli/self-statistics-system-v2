
Save this document to establish the definitive record of how external integrations authenticate with the Self Statistics System.

Updated: 2026-02-28

# Architectural Guide: API Authentication Pipeline

## 1. The Challenge and Decision

The Self Statistics System requires external tools (such as desktop Obsidian plugins) to securely communicate with the Firebase backend.

* **The Desktop Limitation:** Standard Google OAuth (popups/redirects) is blocked by Electron-based environments like Obsidian.
* **The Custom PAT Risk:** Building a custom Personal Access Token (API Key) database introduces severe security vulnerabilities (Log Leakage, XSS plaintext extraction) and incurs permanent Firestore database read costs for every API request.
* **The Selected Solution:** The system utilizes **Firebase Custom Tokens wrapped in an Auto-Refreshing SDK**. This provides the frictionless developer experience of a static API key while offloading all cryptography, token rotation, and identity verification to Google's zero-cost infrastructure.

## 2. The Authentication Lifecycle

The authentication flow relies on the `@self-stats/plugin-sdk` to abstract Google's complex identity requirements away from the end-user and the plugin developer.

### Phase 1: The Minting (React Web App)

The user navigates to the React web app settings and requests an integration connection.

1. The frontend triggers a secure Firebase Callable Function.
2. The server calls `admin.auth().createCustomToken(uid)` and returns a "Setup Code".
3. **Constraint:** This Setup Code expires in exactly 1 hour.

### Phase 2: The Exchange (SDK Initialization)

The user copies the Setup Code and pastes it into their external plugin's settings menu. The plugin developer passes this code to the SDK's setup method.

1. The SDK intercepts the Setup Code and makes an immediate HTTP POST to the Google Identity Toolkit REST API.
2. Google verifies the Custom Token and responds with a short-lived **ID Token** (1 hour) and a permanent **Refresh Token**.
3. The SDK uses the host platform's storage mechanism (e.g., Obsidian's `data.json`) to silently save the Refresh Token. The user never touches a token again.

### Phase 3: The Execution (SDK API Call)

When the plugin needs to log a journal entry, the developer simply calls `client.submitJournal(text)`.

1. The SDK attaches the short-lived ID Token to the HTTP request as a `Bearer` token (`Authorization: Bearer <ID_TOKEN>`).
2. The Firebase backend (`api-router.ts`) intercepts the request and verifies the signature using `admin.auth().verifyIdToken(token)`.
3. If valid, the backend processes the 3-Layer Semantic Pipeline and returns the updated EXP and Level topology.

### Phase 4: The Auto-Refresh (SDK Interceptor)

When the 1-hour ID Token inevitably expires, the SDK handles the recovery invisibly.

1. The SDK's internal fetch interceptor detects an expired ID token or a `401 Unauthorized` backend response.
2. The SDK retrieves the permanent Refresh Token from local storage.
3. The SDK makes an HTTP POST to the Google Secure Token API (`https://securetoken.googleapis.com/v1/token`) to silently request a fresh ID Token.
4. The SDK saves the new tokens, attaches the fresh ID Token to the original journal entry request, and successfully completes the backend call.

## 3. Client Implementation (SDK)

Use `@self-stats/plugin-sdk` to handle exchange, refresh, and authenticated calls.

```ts
import {SelfStatsClient} from "@self-stats/plugin-sdk";

// Provide project context and base URLs. backendUrl is the deployed Functions origin.
const client = new SelfStatsClient({
	projectId: "self-statistics-system-v2",
	apiKey: process.env.FIREBASE_API_KEY!,
	backendUrl: "https://us-central1-self-statistics-system-v2.cloudfunctions.net",
	// storage: optional custom adapter; defaults to in-memory
});

// One-time: exchange the setup code (custom token) for an ID + refresh token
await client.exchangeCustomToken("<setup-code-from-web-app>");

// Later calls automatically refresh when needed
await client.submitJournalEntry("Ran 5km", {timestamp: Date.now()});
await client.submitObsidianNote("Daily note content", {duration: 45});
```

### Storage adapters

- Node/CLI: supply a simple file-backed adapter so tokens survive restarts.
- Obsidian: use `this.app.vault.adapter.read/write` or `this.manifest.dir` to persist.

```ts
const storage = {
	async getItem(key: string) {
		try { return await fs.promises.readFile(`/path/${key}`, "utf8"); } catch { return null; }
	},
	async setItem(key: string, value: string) {
		await fs.promises.writeFile(`/path/${key}`, value, "utf8");
	},
	async removeItem(key: string) {
		try { await fs.promises.unlink(`/path/${key}`); } catch { /* ignore */ }
	},
};

const client = new SelfStatsClient({projectId, apiKey, backendUrl, storage});
```

### Direct REST debugging

Exchange custom token (setup code):

```
curl -X POST \
	"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"token":"<SETUP_CODE>","returnSecureToken":true}'
```

Refresh ID token:

```
curl -X POST \
	"https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}" \
	-H "Content-Type: application/x-www-form-urlencoded" \
	-d "grant_type=refresh_token&refresh_token=<REFRESH_TOKEN>"
```

Call backend with Bearer:

```
curl -X POST \
	"https://us-central1-self-statistics-system-v2.cloudfunctions.net/apiRouter" \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <ID_TOKEN>" \
	-d '{"rawText":"Ran 5km"}'
```
