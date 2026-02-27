/**
 * @file api-keys-repo.ts
 * @module api-firebase/data-access/api-keys-repo
 *
 * Firestore data-access layer for hashed API key authentication.
 *
 * ## Storage model
 * - **Collection:** `api_keys/{sha256_hash}`
 * - **Document ID IS the hash** — guarantees O(1) lookup.
 * - **Hash method:** `crypto.createHash('sha256').update(rawKey).digest('hex')`
 * - Raw keys are NEVER stored. The key is shown once on creation and can never
 *   be retrieved again.
 */

import {db} from "../services/admin-init";
import crypto from "crypto";

// ─── Constants ─────────────────────────────────────────────────────────────

const API_KEYS_COLLECTION = "api_keys";

// ─── Internal ──────────────────────────────────────────────────────────────

/**
 * Hash a raw API key to its SHA-256 hex digest.
 * @param {string} rawKey - The plaintext API key.
 * @return {string} Hex-encoded SHA-256 hash.
 */
const hashKey = (rawKey: string): string =>
  crypto.createHash("sha256").update(rawKey).digest("hex");

/**
 * Generate a cryptographically random API key prefixed with `sss_`.
 * @return {string} A 48-character hex key with prefix (52 chars total).
 */
const generateRawKey = (): string => {
  const bytes = crypto.randomBytes(24);
  return `sss_${bytes.toString("hex")}`;
};

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Validate a raw API key against the Firestore store.
 *
 * @param {string} rawKey - The plaintext API key from the `x-api-key` header.
 * @return {Promise<{userId: string}|null>} userId if valid, `null` if not found.
 */
export const validateApiKey = async (
  rawKey: string,
): Promise<{userId: string} | null> => {
  const hash = hashKey(rawKey);
  const doc = await db.doc(`${API_KEYS_COLLECTION}/${hash}`).get();

  if (!doc.exists) return null;

  const data = doc.data() as {userId?: string} | undefined;
  if (!data?.userId) return null;

  // Update lastUsedAt (fire-and-forget — don't block the auth check)
  doc.ref.set({lastUsedAt: new Date().toISOString()}, {merge: true}).catch(
    () => {/* best effort */},
  );

  return {userId: data.userId};
};

/**
 * Create a new API key for a user.
 *
 * @param {string} userId - The user who owns this key.
 * @param {string} name   - A human-readable label for the key.
 * @return {Promise<string>} The raw key (shown once, never stored in plaintext).
 */
export const createApiKey = async (
  userId: string,
  name: string,
): Promise<string> => {
  const rawKey = generateRawKey();
  const hash = hashKey(rawKey);

  await db.doc(`${API_KEYS_COLLECTION}/${hash}`).set({
    userId,
    name,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  });

  return rawKey;
};

/**
 * Revoke (delete) an API key.
 *
 * @param {string} rawKey - The plaintext API key to revoke.
 * @return {Promise<void>}
 */
export const revokeApiKey = async (rawKey: string): Promise<void> => {
  const hash = hashKey(rawKey);
  await db.doc(`${API_KEYS_COLLECTION}/${hash}`).delete();
};
