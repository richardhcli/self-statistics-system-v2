# Firebase Backend Features and Operations

**Last Updated**: March 2, 2026

## Backend Architecture (`apps/api-firebase/src/`)

### Data-Access Layer
- Graph CRUD: [apps/api-firebase/src/data-access/graph-repo.ts](../../../apps/api-firebase/src/data-access/graph-repo.ts)
- User CRUD: [apps/api-firebase/src/data-access/user-repo.ts](../../../apps/api-firebase/src/data-access/user-repo.ts)
- Journal CRUD: [apps/api-firebase/src/data-access/journal-repo.ts](../../../apps/api-firebase/src/data-access/journal-repo.ts)

### Services Layer
- AI orchestrator: [apps/api-firebase/src/services/ai-orchestrator.ts](../../../apps/api-firebase/src/services/ai-orchestrator.ts)
- Journal pipeline: [apps/api-firebase/src/services/journal-service.ts](../../../apps/api-firebase/src/services/journal-service.ts)
- Graph service: [apps/api-firebase/src/services/graph-service.ts](../../../apps/api-firebase/src/services/graph-service.ts)

### Endpoints Layer
- Journal callable: [apps/api-firebase/src/endpoints/callable/journal.ts](../../../apps/api-firebase/src/endpoints/callable/journal.ts)
- Integration auth: [apps/api-firebase/src/endpoints/callable/integration-auth.ts](../../../apps/api-firebase/src/endpoints/callable/integration-auth.ts)
- REST API router: [apps/api-firebase/src/endpoints/rest/api-router.ts](../../../apps/api-firebase/src/endpoints/rest/api-router.ts)
- Obsidian webhook: [apps/api-firebase/src/endpoints/rest/obsidian-webhook.ts](../../../apps/api-firebase/src/endpoints/rest/obsidian-webhook.ts)

## Web App Read-Aside Services (`apps/web/src/`)
- User profile and settings: [apps/web/src/lib/firebase/user-profile.ts](../../../apps/web/src/lib/firebase/user-profile.ts)
- Player statistics: [apps/web/src/lib/firebase/player-statistics.ts](../../../apps/web/src/lib/firebase/player-statistics.ts)
- Journal read-aside: [apps/web/src/lib/firebase/journal.ts](../../../apps/web/src/lib/firebase/journal.ts)
- Graph read-aside: [apps/web/src/lib/firebase/graph-service.ts](../../../apps/web/src/lib/firebase/graph-service.ts)

## Settings UI Mapping
- Profile display name: `users/{uid}`
- Status display class: `users/{uid}/user_information/profile_display`
- UI preferences: `users/{uid}/account_config/ui_preferences`
- AI settings: `users/{uid}/account_config/ai_settings`
- Privacy settings: `users/{uid}/account_config/privacy`
- Notification settings: `users/{uid}/account_config/notifications`

## Default Seed Values
Defined in [apps/web/src/lib/firebase/user-profile.ts](../../../apps/web/src/lib/firebase/user-profile.ts).
- ai_settings: provider gemini, voice model gemini-2-flash, abstraction model gemini-3-flash, temperature 0, maxTokens 2048, apiKey empty
- ui_preferences: theme dark, language en, visibility toggles true
- privacy: encryptionEnabled true, visibilityMode private, biometricUnlock false
- notifications: all enabled
- integrations: config + obsidian config defaults, logs empty
- billing_settings: free, active
- profile_display: class empty
- player_statistics: progression seeded

## Security Rules
Firestore rules allow authenticated users to read/write their own subtree only.
- Rules: [firestore.rules](../../../firestore.rules)

## Debug Datastores View
The debug datastores view can fetch backend snapshots, hydrate stores, and remove documents or fields.
- Feature doc: [../features/features-datastores-debug.md](../features/features-datastores-debug.md)
- Force sync UI: [apps/web/src/features/debug/components/force-sync-panel.tsx](../../../apps/web/src/features/debug/components/force-sync-panel.tsx)
