# Firebase Backend (Architecture Index)

**Last Updated**: March 2, 2026

## Purpose
Firebase provides authentication and cloud persistence for user profile, settings, journal, and graph data. The backend is a 3-layer Firebase Cloud Functions monolith (`apps/api-firebase/`) and the web app follows the Hybrid Read-Aside architecture.

## Quick Links
- Schema and naming rules: [firebase-backend-schema.md](firebase-backend-schema.md)
- Auth flow and providers: [firebase-backend-auth.md](firebase-backend-auth.md)
- Services, features, and operations: [firebase-backend-features.md](firebase-backend-features.md)
- Functions runbook: [functions/firebase-functions.md](functions/firebase-functions.md)
- External integration auth: [../authentication/api-authentication-pipeline.md](../authentication/api-authentication-pipeline.md)

## Related Docs
- Firebase backend state (state-management): [../state-management/firebase-backend.md](../state-management/firebase-backend.md)
- Backend bundling: [../build/esbuild-backend-bundler.md](../build/esbuild-backend-bundler.md)

