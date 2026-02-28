
## Plan of Action 2: Obsidian Plugin Integration

**Objective:** Build the desktop client using the official Obsidian API, integrating the community Modal Forms plugin to capture journal entries and inject the AI-processed stats directly into the active note.

**1. Initialization & SDK Linking**

* Clone the official `obsidian-sample-plugin` repository to a new folder (e.g., `apps/obsidian-self-stats`).
* Add `@self-stats/plugin-sdk` as a dependency. If using your monorepo, ensure the workspace link is correctly resolved so the plugin bundles the SDK logic using Esbuild.

**2. Storage Adapter & Plugin Settings**

* **Settings Tab:** Create a `SelfStatsSettingTab`. Add a single text input for the "Connection Setup Code" and a "Connect" button.
* **Storage Implementation:** When the user clicks "Connect", initialize the SDK. Map the `StorageAdapter` directly to Obsidian's native data API:
* `getRefreshToken: () => this.plugin.loadData()`
* `setRefreshToken: (token) => this.plugin.saveData({ refreshToken: token })`


* Execute `client.exchangeSetupCode()`. On success, clear the Setup Code from the UI input so the user knows it was consumed.

**3. Modal Forms Plugin Integration**

* **Form Definition:** Inside your Obsidian vault, use the Modal Forms UI to create a form named `JournalEntry`. Add a large text area for "Journal Prompt" and an optional time/date field.
* **Command Registration:** In your plugin's `onload()` method, use `this.addCommand({ ... })` to register "SelfStatisticsSystem: new journal entry".
* **API Execution:** When the command fires, access the Modal Forms API via the Obsidian app instance: `app.plugins.plugins['modalforms'].api.openForm('JournalEntry')`.

**4. The SDK Call & Editor Insertion**

* **Await Input:** Await the promise returned by the Modal Forms API to get the user's text and optional time.
* **Process:** Call `await client.submitJournal(modalFormData.text)`. Display an Obsidian `Notice("Processing Self Statistics...")` while waiting for the Firebase backend.
* **Cursor Insertion:** Once the SDK returns the updated EXP and Level, use the Obsidian `Editor` API to inject the text.
* `const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;`
* `editor.replaceSelection(`\n\n> **Self Stats:** +${result.exp} EXP | Level ${result.level}\n> ${modalFormData.text}`);`
