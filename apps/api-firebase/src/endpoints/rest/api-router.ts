/**
 * @file api-router.ts
 * @module api-firebase/endpoints/rest/api-router
 *
 * REST endpoint for external plugin integrations.
 *
 * REST endpoint for external plugin integrations.
 * Uses Firebase ID Token (Bearer) authentication via middleware.
 *
 * Routes:
 * - POST /journal — Process a journal entry externally.
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {processJournal} from "../../services/journal-service";
import {authenticateRequest} from "./middleware";

/**
 * REST API router for external integrations.
 *
 * Authenticates via `Authorization: Bearer <ID_TOKEN>` header.
 */
export const apiRouter = onRequest(async (req, res) => {
  const userId = await authenticateRequest(req, res);
  if (!userId) return; // 401 already sent

  try {
    if (req.method === "POST") {
      const {rawText, timestamp} = (req.body ?? {}) as {
        rawText?: string;
        timestamp?: number;
      };

      if (!rawText || typeof rawText !== "string") {
        res.status(400).json({error: "Missing rawText"});
        return;
      }

      const result = await processJournal({rawText, userId, timestamp});
      res.status(200).json({success: true, ...result});
      return;
    }

    res.status(405).json({error: "Method Not Allowed"});
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("apiRouter error", {message, error});
    res.status(500).json({error: message});
  }
});
