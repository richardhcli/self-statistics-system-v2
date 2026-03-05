# Integrations

The Self-Statistics System supports external integrations to extend journaling beyond the web app.

## Obsidian Plugin

An official Obsidian plugin allows you to submit journal entries directly from your vault.

### Setup

1. Install the plugin from the Obsidian community plugins directory.
2. In the web app, go to **Settings → Integrations** and generate a Setup Code.
3. Paste the Setup Code into the Obsidian plugin settings.
4. The plugin exchanges the code for a persistent refresh token — no repeated sign-in required.

### Usage

- Write a journal entry in Obsidian as a normal note.
- Use the plugin command to submit the note to the Self-Statistics backend.
- AI analysis, XP, and graph updates happen exactly as they would from the web app.

## Future Integrations

Additional integration points (API, webhooks) are planned. Check the integrations tab for the latest available connections.
