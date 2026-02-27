/**
 * @file middleware.ts
 * @module api-firebase/endpoints/rest/middleware
 *
 * REST endpoint middleware for API key authentication.
 *
 * Uses an in-memory cache with a 5-minute TTL to avoid Firestore reads
 * on every request. The cache lives for the lifetime of the Cloud Function
 * container — resets on cold start.
 */

import {validateApiKey} from "../../data-access/api-keys-repo";
import type {Request, Response} from "firebase-functions/v2/https";

// ─── In-memory LRU cache ───────────────────────────────────────────────────

interface CacheEntry {
  userId: string;
  expiresAt: number;
}

/** Cache keyed by SHA-256 hash. Lives for the container lifetime. */
const keyCache = new Map<string, CacheEntry>();

/** Cache TTL: 5 minutes. */
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── Middleware ─────────────────────────────────────────────────────────────

/**
 * Express-style middleware that authenticates incoming requests via `x-api-key`.
 *
 * On success, sets `req.headers["x-user-id"]` to the authenticated user ID
 * so downstream handlers can read it.
 *
 * On failure, responds with 401 Unauthorized and terminates the request.
 *
 * @param {Request} req - Firebase Functions v2 request.
 * @param {Response} res - Firebase Functions v2 response.
 * @return {Promise<string|null>} authenticated userId or null (response already sent).
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
): Promise<string | null> => {
  const rawKey = req.headers["x-api-key"] as string | undefined;

  if (!rawKey) {
    res.status(401).json({error: "Missing x-api-key header"});
    return null;
  }

  // Check in-memory cache first (zero Firestore cost)
  const now = Date.now();
  const cached = keyCache.get(rawKey);
  if (cached && cached.expiresAt > now) {
    return cached.userId;
  }

  // Cache miss: validate against Firestore
  const result = await validateApiKey(rawKey);

  if (!result) {
    res.status(401).json({error: "Invalid API key"});
    return null;
  }

  // Cache the result
  keyCache.set(rawKey, {
    userId: result.userId,
    expiresAt: now + CACHE_TTL_MS,
  });

  return result.userId;
};
