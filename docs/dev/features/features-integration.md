
# Feature: Integrations

**Last Updated**: March 2, 2026

The Integrations module enables external plugins and services to communicate with the Self-Statistics System backend.

## Supported Engines

### 1. Obsidian Plugin
A dedicated native Obsidian plugin (`apps/obsidian-plugin/`) built on `@self-stats/plugin-sdk`.
- **Connection**: Setup Code generated in the web app Integration tab → exchanged for permanent Refresh Token.
- **Authentication**: Firebase Custom Tokens with automatic ID token refresh.
- **Output**: Rich collapsible markdown callouts with per-stat EXP deltas.
- See [integrations/obsidian.md](../integrations/obsidian.md) for architecture details.

### 2. Connection Code (Web App UI)
The `ConnectionCode` component (`apps/web/src/features/integration/components/connection-code.tsx`) generates setup codes for external plugins:
- Calls `generateFirebaseAccessToken` callable to mint a 1-hour Custom Token.
- Displays with copy-to-clipboard and amber warning UI.
- Auto-clears after display.

### 3. Outbound Webhooks
Real-time JSON payloads sent to any HTTP endpoint upon AI-processed entry finalization.
- **Trigger**: Automatic broadcast when an entry is classified.
- **Payload**: Contains original text, extracted duration, and the full 3-layer semantic analysis.

### 4. Data Portability (Backup & Restore)
Your data is yours. The Data Portability panel manages IndexedDB state:
- **Export**: Download entire application state (Journal, Graph, Stats) as a `.json` file.
- **Import**: Restore from any valid backup file (destructive: replaces current local state).

## Security & Persistence
- **Custom Token Auth**: External plugins authenticate via Firebase Custom Tokens (not API keys).
- **Firestore-Backed**: Integration configuration stored at `users/{uid}/account_config/integrations`.
- **Read-Aside Pattern**: Settings load from IndexedDB on boot, then sync from Firestore if stale.
