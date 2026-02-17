import {onRequest} from "firebase-functions/v2/https";
import {runJournalPipeline} from "./pipeline";
import type {JournalPipelineRequest} from "./types";

/**
 * End-to-end journal pipeline: ingest, analyze via AI gateway, update graph/stats, and return results.
 */
export const journalPipeline = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method Not Allowed"});
    return;
  }

  const userId = (req.headers["x-user-id"] as string) || "default_user";
  const {content, duration} = (req.body || {}) as JournalPipelineRequest;

  if (!content || typeof content !== "string") {
    res.status(400).json({error: "Missing content"});
    return;
  }

  try {
    const payload: JournalPipelineRequest = {
      content,
      duration: typeof duration === "number" ? duration : undefined,
    };

    const result = await runJournalPipeline(userId, payload);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("journalPipeline error", message, error);
    res.status(500).json({error: message});
  }
});
