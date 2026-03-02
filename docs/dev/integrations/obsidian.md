# Obsidian Integration

**Last Updated**: March 2, 2026

The Self-Statistics System provides a dedicated **Obsidian plugin** (`apps/obsidian-plugin/`) that syncs journal entries from your Obsidian vault to the backend for AI analysis and EXP progression.

## Architecture
- **Plugin**: `apps/obsidian-plugin/` — built with `esbuild`, consumes `@self-stats/plugin-sdk`.
- **SDK**: `shared/plugin-sdk/` (`@self-stats/plugin-sdk`) — universal `SelfStatsClient` with automatic Firebase ID token refresh.
- **Backend**: `apps/api-firebase/src/endpoints/rest/obsidian-webhook.ts` — REST endpoint with Bearer token auth.

## Setup
1. In the **web app** Integration tab, generate a **Connection Code** (1-hour Custom Token).
2. In Obsidian, open the **Self Stats plugin settings** and paste the Connection Code.
3. The plugin SDK exchanges the code for a permanent Refresh Token stored in Obsidian's `data.json`.
4. All subsequent requests use auto-refreshed ID tokens — no re-authentication needed.

## How It Works
1. User writes a journal note in Obsidian.
2. Plugin sends the note text via `SelfStatsClient.submitObsidianNote()`.
3. Backend runs the AI → topology → progression pipeline.
4. Plugin receives `JournalEntryResponse` with `statChanges` (per-stat EXP deltas).
5. Plugin appends a rich collapsible **Obsidian callout** to the note:
   ```
   > [!info] Self Statistics
   > EXP UP!! **{Stat}**: {Old} → {New} (+{Inc}) (+{Total} total EXP)
   > > [!success]- All increases:
   > > - {Stat}: {Old} → {New} (+{Inc})
   > {Original Journal Text}
   ```

## Authentication Flow
See [authentication/api-authentication-pipeline.md](../authentication/api-authentication-pipeline.md) for the full Custom Token lifecycle.

## Related Docs
- [Backend functions runbook](../backend/functions/firebase-functions.md)
- [Plugin style guide](../backend/functions/plugins-style-guide.md)