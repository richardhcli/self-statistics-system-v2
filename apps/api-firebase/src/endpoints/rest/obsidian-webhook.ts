/**
 * @file obsidian-webhook.ts
 * @module api-firebase/endpoints/rest/obsidian-webhook
 *
 * REST endpoint for Obsidian plugin integration.
 *
 * Handles:
 * - POST: Ingest journal content → process immediately → return result.
 *   (Simplified from the old async job queue pattern to a synchronous pipeline.)
 *
 * Authentication: Firebase ID Token via `Authorization: Bearer <token>` header.
 *
 * @see docs/dev/authentication/api-authentication-pipeline.md
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {processJournal} from "../../services/journal-service";
import {authenticateRequest} from "./middleware";

/**
 * Obsidian-specific REST webhook.
 *
 * POST body: `{ content: string, duration?: number }`
 * Authenticates via `Authorization: Bearer <ID_TOKEN>` header.
 */
export const obsidianWebhook = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method Not Allowed"});
    return;
  }

  const userId = await authenticateRequest(req, res);
  if (!userId) return; // 401 already sent

  const {content, duration} = (req.body || {}) as {
    content?: string;
    duration?: number;
  };

  if (!content || typeof content !== "string") {
    res.status(400).json({error: "Missing content"});
    return;
  }

  try {
    const result = await processJournal({
      rawText: content,
      userId,
      timestamp: Date.now(),
    });

    logger.info("obsidianWebhook processed", {
      userId,
      entryId: result.entryId,
      duration,
    });

    res.status(200).json({success: true, ...result});
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("obsidianWebhook error", {message, error});
    res.status(500).json({error: message});
  }
});
