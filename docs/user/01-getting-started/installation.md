# Installation & Setup

## Access the Web App

The Self-Statistics System runs as a web application. No installation is required — visit the hosted URL and sign in.

## Sign In

Two authentication methods are available:

- **Google Sign-In** — Recommended. Links your data to your Google account for cross-device access.
- **Continue as Guest** — Creates an anonymous session stored locally on your device. You can link a Google account later to persist your data.

## First Login

On first sign-in the system automatically:

1. Creates your user profile in Firestore.
2. Seeds default settings (AI preferences, UI theme, notifications).
3. Redirects you to the Journal tab to begin.

## Offline Support

Entries are stored locally in IndexedDB before syncing to Firebase. You can journal offline — data will sync when connectivity returns.
