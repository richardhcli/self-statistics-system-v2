# Integrations

The Self-Statistics System supports external integrations to extend journaling beyond the web app.

## Obsidian Plugin

A dedicated Obsidian plugin (`apps/obsidian-plugin/`) lets you submit journal entries directly from your vault.

### Setup

1. In the **web app Integrations tab**, generate a **Connection Code** (a 1-hour Custom Token).
2. In Obsidian, open the **Self Stats plugin settings** and paste the Connection Code.
3. The plugin exchanges the code for a permanent refresh token stored locally — no re-authentication needed.

### Usage

- Write a journal entry in Obsidian as a normal note.
- Use the plugin command to submit the note to the backend.
- The backend runs the full AI → topology → progression pipeline.
- The plugin appends a rich collapsible callout to your note showing per-stat EXP deltas (e.g., "Intellect: 2.5 → 3.1 (+0.6)").

## Outbound Webhooks

Real-time JSON payloads are sent to any configured HTTP endpoint when an entry finishes AI processing. The payload contains the original text, extracted duration, and the full 3-layer semantic analysis.

## Data Portability (Backup & Restore)

- **Export** — Download your entire application state (journal, graph, stats) as a `.json` file.
- **Import** — Restore from any valid backup file. This is destructive and replaces current local state.

Managed from the web app Integrations tab.
