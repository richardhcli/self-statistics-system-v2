
Just to keep our terminology aligned with the secure architecture we finalized: the Obsidian plugin will accept the **1-hour Setup Code (Custom Token)** generated from your React UI, not a static API key. The SDK will then handle the complex background trade for the permanent refresh token.

Here are the exact plans of action for both the sandbox validation and the Obsidian plugin development.

---

## Plan of Action 1: SDK Sandbox Testing

**Objective:** Validate that the `@self-stats/plugin-sdk` correctly communicates with the Google Identity Toolkit, writes to the local filesystem, and successfully posts to your Firebase backend.

**1. Build the SDK Package**

* Navigate to your `shared/plugin-sdk` directory.
* Run `pnpm run build` (or your configured build command) to ensure the TypeScript is compiled to `dist/index.js` and the type declarations are generated. The sandbox cannot consume raw TypeScript from a sibling package without a build step or a runtime like `ts-node`.

**2. Configure `testing/testing-backend/scripts/sdk-sandbox.ts**`

* **Storage Injection:** Implement the `StorageAdapter` interface using Node's native `fs/promises`. Create read/write/clear functions targeting a local `.env.token.json` file in the testing directory.
* **Environment Variables:** Load your public `FIREBASE_API_KEY` and the `BACKEND_URL` (pointing to your local emulator `127.0.0.1:5001` or live server) from a `.env` file.
* **CLI Inputs:** Use a lightweight prompt (like Node's `readline` module) to ask the terminal for the "Setup Code" when the script runs.

**3. Execution Sequence**

* **Step A (The Exchange):** Instantiate `SelfStatsClient`. Call `await client.exchangeSetupCode(cliInput)`.
* **Step B (Verification):** Assert that `.env.token.json` was successfully created on your hard drive and contains a valid Refresh Token.
* **Step C (The API Call):** Call `await client.submitJournal("Sandbox test entry")`.
* **Step D (Log):** Print the returned EXP and Level topology to the console.

---
