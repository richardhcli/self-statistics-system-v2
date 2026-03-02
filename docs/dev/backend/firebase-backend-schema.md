# Firebase Backend Schema

**Last Updated**: March 2, 2026

## Naming Rules
- Collections and document IDs use snake_case.
- Fields use camelCase.

## Schema Overview

### User Profile
- Path: `users/{uid}`
- Key fields: `displayName`, `email`, `photoURL`, `createdAt`, `lastUpdated`

### Account Configuration
- Collection: `users/{uid}/account_config`
- Documents:
  - `ai_settings`: provider, model.voiceTranscriptionModel, model.abstractionModel, temperature, maxTokens, apiKey
  - `ui_preferences`: theme, language, showCumulativeExp, showMasteryLevels, showRecentAction, animateProgressBars
  - `privacy`: encryptionEnabled, visibilityMode, biometricUnlock
  - `notifications`: pushEnabled, weeklySummaryEnabled, instantFeedbackEnabled
  - `integrations`: config.webhookUrl, config.enabled, config.secret, obsidianConfig, logs
  - `billing_settings`: plan, status

### User Information
- Collection: `users/{uid}/user_information`
- Document: `profile_display`
  - class
- Document: `player_statistics`
  - stats

### Journal
- Collection: `users/{uid}/journal_meta`
  - Document: `tree_structure`
- Collection: `users/{uid}/journal_entries`
  - Document ID format: `YYYYMMDD-HHmmss-suffix`

### Graphs (CDAG)
- Collection: `users/{uid}/graphs`
  - Document: `cdag_topology`
  - Subcollections:
    - `graph_metadata/topology_manifest` (manifest: nodes, edges, metrics, lastUpdated, version)
    - `nodes`
    - `edges`

## Type References
- Shared contracts: [shared/contracts/src/](../../../shared/contracts/src/) — `@self-stats/contracts`
- Frontend types: [apps/web/src/types/firestore.ts](../../../apps/web/src/types/firestore.ts)
- Frontend journal service: [apps/web/src/lib/firebase/journal.ts](../../../apps/web/src/lib/firebase/journal.ts)
- Frontend graph service: [apps/web/src/lib/firebase/graph-service.ts](../../../apps/web/src/lib/firebase/graph-service.ts)
- Backend data-access: [apps/api-firebase/src/data-access/](../../../apps/api-firebase/src/data-access/)
