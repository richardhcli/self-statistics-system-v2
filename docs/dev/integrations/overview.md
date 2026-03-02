# Integrations Overview

**Last Updated**: March 2, 2026

The Self-Statistics System supports external integrations via a universal plugin SDK and Firebase Custom Token authentication.

## Integration Architecture

### Plugin SDK (`@self-stats/plugin-sdk`)
Platform-agnostic client library for any external integration:
- `SelfStatsClient` class using native `fetch` — zero Firebase SDK dependency.
- Automatic Firebase ID token refresh via `StorageAdapter` interface.
- Works in Node.js, Obsidian, browser, and mobile environments.
- See [shared/plugin-sdk/src/](../../../shared/plugin-sdk/src/) for implementation.

### Authentication (Firebase Custom Tokens)
1. Web app generates a **Connection Code** (1-hour Custom Token).
2. External plugin exchanges the code for ID Token + Refresh Token.
3. All API requests use Bearer token authentication.
4. See [authentication/api-authentication-pipeline.md](../authentication/api-authentication-pipeline.md) for details.

### Backend Endpoints
- **REST API** (`apiRouter`): General-purpose endpoint for external integrations via Bearer token.
- **Obsidian Webhook** (`obsidianWebhook`): Dedicated endpoint for the Obsidian plugin.
- **Callable Journal** (`processJournalEntry`): Firebase Auth-protected endpoint for the web app.

## Supported Integrations

### Obsidian Plugin (`apps/obsidian-plugin/`)
Dedicated Obsidian plugin with native settings UI, automatic token refresh, and rich markdown callout rendering.
- See [obsidian.md](./obsidian.md) for details.

### Outbound Webhooks
Real-time JSON broadcasts of processed journal entries to configured webhook URLs.

### Data Portability
Full JSON Backup & Restore of the IndexedDB state via the web app Settings > Data Portability panel.