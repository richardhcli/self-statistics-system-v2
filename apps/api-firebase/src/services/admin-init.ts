/**
 * @file admin-init.ts
 * @module api-firebase/services/admin-init
 *
 * Centralized Firebase Admin SDK initializer.
 *
 * Every module that needs the Admin SDK or Firestore imports from here
 * instead of calling `initializeApp()` / `firestore()` locally.
 * This eliminates duplicate guard-blocks scattered across the codebase
 * and avoids the ESLint `import/namespace` false-positive triggered by
 * `import * as admin from "firebase-admin"`.
 *
 * @example
 * ```typescript
 * import {db, admin} from "../services/admin-init";
 * ```
 */

import {getApps, initializeApp, type App} from "firebase-admin/app";
import {getFirestore, type Firestore, FieldValue} from "firebase-admin/firestore";

/** Lazily initialized singleton Firebase app. */
const app: App = getApps().length === 0 ? initializeApp() : getApps()[0];

/** Pre-configured Firestore instance scoped to the default app. */
export const db: Firestore = getFirestore(app);

// Tell Firestore to silently strip 'undefined' properties before saving,
// allowing seamless integration with TypeScript optional properties.
db.settings({ignoreUndefinedProperties: true});

/**
 * Re-export `FieldValue` so consumers don't need a separate
 * `firebase-admin/firestore` import for `serverTimestamp()`, `increment()`, etc.
 */
export {FieldValue};
