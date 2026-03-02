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
import {defineSecret} from "firebase-functions/params";
import {processJournal} from "../../services/journal-service";
import {authenticateRequest} from "./middleware";

// 1. Define the secret outside the function handler
const geminiApiKey = defineSecret("GOOGLE_AI_API_KEY");

export const apiRouter = onRequest(
  { 
    cors: true, //critical for cross-origin requests from plugins and web clients
    secrets: [geminiApiKey] // 2. Bind the secret securely to this endpoint
  },
  async (req, res) => {
  // 3. Security Gate: Verify the Google Identity Token
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

      // 4. Execution: Run the 3-Layer Semantic Pipeline
      // The secret is now securely available globally via process.env.GOOGLE_AI_API_KEY
      // or explicitly via geminiApiKey.value()
      const result = await processJournal({rawText, userId, timestamp});

      // 5. Response: Return EXP, Level, and Graph Topology
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