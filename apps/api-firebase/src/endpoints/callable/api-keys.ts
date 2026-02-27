/**
 * @file api-keys.ts
 * @module api-firebase/endpoints/callable/api-keys
 *
 * Callable (onCall v2) endpoints for API key CRUD.
 *
 * - `createUserApiKey` — Generate and return a new API key (shown once).
 * - `revokeUserApiKey` — Delete an existing API key by raw key value.
 *
 * Authentication: Firebase Auth required (`request.auth`).
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {createApiKey, revokeApiKey} from "../../data-access/api-keys-repo";

/**
 * Generate a new API key for the authenticated user.
 *
 * Returns the raw key exactly once — it is never stored in plaintext.
 */
export const createUserApiKey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const {name} = request.data as {name?: string};

  if (!name || typeof name !== "string") {
    throw new HttpsError("invalid-argument", "Missing key name.");
  }

  const rawKey = await createApiKey(request.auth.uid, name);

  return {success: true, apiKey: rawKey};
});

/**
 * Revoke an existing API key.
 */
export const revokeUserApiKey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const {rawKey} = request.data as {rawKey?: string};

  if (!rawKey || typeof rawKey !== "string") {
    throw new HttpsError("invalid-argument", "Missing rawKey.");
  }

  await revokeApiKey(rawKey);

  return {success: true};
});
