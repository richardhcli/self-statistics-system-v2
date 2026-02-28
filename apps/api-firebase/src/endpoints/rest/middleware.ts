/**
 * @file middleware.ts
 * @module api-firebase/endpoints/rest/middleware
 *
 * REST endpoint middleware for Firebase ID Token (Bearer) authentication.
 *
 * Validates tokens signed by Google's Identity Platform using
 * `admin.auth().verifyIdToken()`. No Firestore reads or custom caching
 * required — signature verification is a local CPU operation backed by
 * Google's auto-refreshed public-key cache.
 *
 * @see docs/dev/authentication/api-authentication-pipeline.md
 */

import {getAuth} from "firebase-admin/auth";
import type {Request, Response} from "firebase-functions/v2/https";

// ─── Middleware ─────────────────────────────────────────────────────────────

/**
 * Express-style middleware that authenticates incoming requests via
 * `Authorization: Bearer <ID_TOKEN>`.
 *
 * On success, returns the authenticated `uid`.
 * On failure, responds with 401 Unauthorized and returns `null`.
 *
 * @param {Request} req - Firebase Functions v2 request.
 * @param {Response} res - Firebase Functions v2 response.
 * @return {Promise<string|null>} authenticated userId or null (response already sent).
 */
export const authenticateRequest = async (
  req: Request,
  res: Response,
): Promise<string | null> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({error: "Missing Authorization header"});
    return null;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    res.status(401).json({error: "Invalid or expired token"});
    return null;
  }
};
