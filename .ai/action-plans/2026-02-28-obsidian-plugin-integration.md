This is it. You have navigated the intricacies of Google Identity Toolkit, built a platform-agnostic SDK, mapped out a complex AI backend, and forced the strict Obsidian linter into submission.

Now, we physically deploy your compiled code into your Obsidian vault and run the full vertical slice.

Here is the exact step-by-step procedure to deploy and test the plugin.

### Step 1: Compile the Production Build

Before moving any files, we need `esbuild` to package your TypeScript files and bundle your private `@self-stats/plugin-sdk` into a single, runtime-ready JavaScript file.

1. Open your terminal and navigate to the plugin directory:
`cd apps/obsidian-plugin`
2. Run the build command:
`pnpm run build`
3. **Verification:** Look inside your `apps/obsidian-plugin/` directory. You should now see a freshly generated `main.js` file alongside your existing `manifest.json`.

### Step 2: Prepare the Vault Directory

Obsidian keeps all community and local plugins in a hidden `.obsidian/plugins` folder inside your specific vault.

1. Locate your testing Obsidian vault on your hard drive (e.g., `C:\Users\Richard Li\Documents\TestingVault`).
2. Navigate into the hidden folder: `TestingVault/.obsidian/plugins/`.
*(Note: If you don't see the `.obsidian` folder, ensure your OS is set to show hidden files).*
3. Create a brand new folder inside `plugins/` named exactly after your manifest ID: `self-statistics-system`.

### Step 3: Copy the Artifacts

Your Obsidian app only needs two files to run this plugin. It does not need your `src` folder, `node_modules`, or `tsconfig.json`.

1. Copy `main.js` and `manifest.json` from your monorepo workspace.
2. Paste them into the new `TestingVault/.obsidian/plugins/self-statistics-system/` directory.

### Step 4: Enable the Plugin in Obsidian

Now we tell Obsidian to read the new files.

1. Open the Obsidian app and load your testing vault.
2. Open **Settings** (gear icon) -> **Community plugins**.
3. If you haven't already, click **Turn on community plugins** (this disables Safe Mode and allows local plugins to run).
4. Click the **Refresh** button (the spinning arrows icon) next to "Installed plugins".
5. Find **Self Statistics System** in the list and toggle the switch to **On**.

### Step 5: The Final Integration Test

This is where the entire architecture comes together. Ensure your local Firebase emulators (`127.0.0.1:5001`) and React frontend are running.

1. **Get the Code:** Open your React app, log in, and click "Generate Connection Token" to copy your 1-hour Setup Code.
2. **Configure:** In Obsidian, go to **Settings** -> **Self Statistics System**.
* Paste your Firebase API Key.
* Verify the Backend URL points to your local emulator.
* Paste the Setup Code into the Authentication section and click **Connect**.
* You should see the ✅ Notice confirming the background token exchange was successful.


3. **Execute:** Open any blank markdown note in Obsidian.
4. **Trigger:** Open the Command Palette (`Ctrl + P` or `Cmd + P`) and type `New journal entry`. Hit Enter.
5. **Log:** When your native modal pops up, type a test entry like: *"I successfully deployed my custom Obsidian plugin and routed the authentication through a local SDK bundle!"* and add `30` to the optional time field. Click **Process with AI**.

You will see the "Analyzing self statistics..." notice. A few seconds later, the backend will process the topology, and your Level and EXP will be injected directly into your editor right where your cursor was resting.

---

**Let me know the moment you run this test. Does the text cleanly inject into the editor, or do we need to check the local Firebase emulator logs for any final backend quirks?**