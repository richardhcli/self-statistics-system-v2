
Save this document to establish the definitive record of how external integrations authenticate with the Self Statistics System.

Updated: 2026-02-27

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
