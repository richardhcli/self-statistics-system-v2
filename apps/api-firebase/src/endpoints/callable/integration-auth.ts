/**
 * @file integration-auth.ts
 * @module api-firebase/endpoints/callable/integration-auth
 *
 * Callable (onCall v2) endpoint for minting Firebase Custom Tokens.
 *
 * - `generateFirebaseAccessToken` — Returns a one-time Custom Token that
 *   external clients (Obsidian, CLI) exchange for a permanent session via
 *   Google's Identity Toolkit REST API.
 *
 * Authentication: Firebase Auth required (`request.auth`).
 *
 * @see docs/dev/authentication/api-authentication-pipeline.md
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getAuth} from "firebase-admin/auth";

/**
 * Generate a one-time Firebase Custom Token for external integration login.
 *
 * The returned token is a JWT signed by Google's service-account private key.
 * It is valid for **1 hour** and can only be consumed once via
 * `signInWithCustomToken`. After exchange the client receives a long-lived
 * Refresh Token managed by Google's Identity Platform.
 *
 * @returns {{ token: string }} The Custom Token string.
 */
export const generateFirebaseAccessToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;

  try {
    const customToken = await getAuth().createCustomToken(uid);
    return {token: customToken};
  } catch (error) {
    throw new HttpsError(
      "internal",
      "Failed to mint integration token.",
      error instanceof Error ? error.message : undefined,
    );
  }
});
