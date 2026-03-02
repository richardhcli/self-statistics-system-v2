# Firebase Backend Auth

**Last Updated**: February 28, 2026

## Purpose
Firebase Auth handles sign-in and the initial Firestore profile bootstrap. Authentication events trigger profile synchronization so the backend always has current user metadata.

## Providers
- **Google**: Primary sign-in. Configured in [apps/web/src/lib/firebase/services.ts](../../apps/web/src/lib/firebase/services.ts).
- **Anonymous**: Guest sign-in for unauthenticated exploration. Can be upgraded to Google via account linking.

## External Integration Auth (Custom Tokens)
External clients (Obsidian plugin, CLI tools) authenticate via Firebase Custom Tokens:

1. User generates a **Connection Code** from the web dashboard (Integrations tab).
2. Backend mints a 1-hour Custom Token via `admin.auth().createCustomToken(uid)`.
3. External client exchanges the token for a permanent session (ID Token + Refresh Token) via Google Identity Toolkit REST API.
4. REST endpoints (`apiRouter`, `obsidianWebhook`) validate incoming `Authorization: Bearer <ID_TOKEN>` headers using `admin.auth().verifyIdToken()`.

- Callable endpoint: [apps/api-firebase/src/endpoints/callable/integration-auth.ts](../../../apps/api-firebase/src/endpoints/callable/integration-auth.ts)
- REST middleware: [apps/api-firebase/src/endpoints/rest/middleware.ts](../../../apps/api-firebase/src/endpoints/rest/middleware.ts)
- Architecture doc: [docs/dev/authentication/api-authentication-pipeline.md](../authentication/api-authentication-pipeline.md)

## Flow
1. UI triggers Google sign-in or anonymous guest login.
2. Firebase Auth returns the user.
3. `syncUserProfile` seeds or updates the Firestore profile and default settings.
4. (Optional) Guest users can link their anonymous account to Google via `linkAnonymousToGoogle()` in [apps/web/src/features/auth/utils/link-account.ts](../../apps/web/src/features/auth/utils/link-account.ts).

## Implementation References
- Auth UI: [apps/web/src/features/auth/components/auth-view.tsx](../../apps/web/src/features/auth/components/auth-view.tsx)
- Auth provider: [apps/web/src/providers/auth-provider.tsx](../../apps/web/src/providers/auth-provider.tsx)
- Google login: [apps/web/src/features/auth/utils/login-google.ts](../../apps/web/src/features/auth/utils/login-google.ts)
- Guest login: [apps/web/src/features/auth/utils/login-guest.ts](../../apps/web/src/features/auth/utils/login-guest.ts)
- Account linking: [apps/web/src/features/auth/utils/link-account.ts](../../apps/web/src/features/auth/utils/link-account.ts)
- Profile sync: [apps/web/src/lib/firebase/user-profile.ts](../../apps/web/src/lib/firebase/user-profile.ts)
