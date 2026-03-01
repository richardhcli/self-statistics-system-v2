/**
 * @file api-router.ts
 * @module api-firebase/endpoints/rest/api-router
 *
 * @description
 * The single, unified REST endpoint for all external integrations (Obsidian, CLI, Web).
 * * * AI CONTEXT & ARCHITECTURE NOTE:
 * This endpoint replaces the redundant `obsidian-webhook.ts`. It acts as a universal
 * gateway. It enforces Bearer token authentication via `middleware.ts` and hands the
 * raw text directly to the AI-driven `processJournal` pipeline.
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {processJournal} from "../../services/journal-service";
import {authenticateRequest} from "./middleware";

export const apiRouter = onRequest(async (req, res) => {
  // 1. Security Gate: Verify the Google Identity Token
  const userId = await authenticateRequest(req, res);
  if (!userId) return; // 401 response already handled by middleware

  try {
    if (req.method === "POST") {
      const {rawText, timestamp} = (req.body ?? {}) as {
        rawText?: string;
        timestamp?: number;
      };

      if (!rawText || typeof rawText !== "string") {
        res.status(400).json({error: "Missing required field: rawText"});
        return;
      }

      // 2. Execution: Run the 3-Layer Semantic Pipeline
      const result = await processJournal({rawText, userId, timestamp});

      // 3. Response: Return EXP, Level, and Graph Topology
      res.status(200).json({success: true, ...result});
      return;
    }

    res.status(405).json({error: "Method Not Allowed"});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("apiRouter execution failed", {message, error});
    res.status(500).json({error: message});
  }
});
