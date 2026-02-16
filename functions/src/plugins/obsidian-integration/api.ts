import {onRequest} from "firebase-functions/v2/https";
import {PluginSDK} from "../../plugin-sdk";
import {ObsidianPayload} from "./types";

/**
 * HTTPS endpoint for Obsidian ingestion and job polling.
 */
export const obsidianApi = onRequest(async (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || "default_user";
  const sdk = new PluginSDK(userId);

  if (req.method === "POST") {
    const {content, duration} = (req.body || {}) as Partial<ObsidianPayload>;

    if (!content || typeof content !== "string") {
      res.status(400).json({error: "Missing content"});
      return;
    }

    const durationValue = typeof duration === "number" ? duration : 0;

    const entryId = await sdk.journal.create(content, {duration: durationValue});
    const jobId = await sdk.jobs.create("ai_analysis_obsidian", {entryId});

    res.status(202).json({
      success: true,
      entryId,
      jobId,
      message: "Entry stored. AI analysis queued.",
    });
    return;
  }

  if (req.method === "GET" && req.query.jobId) {
    const jobId = String(req.query.jobId);
    const job = await sdk.jobs.get(jobId);

    if (!job) {
      res.status(404).json({error: "Job not found"});
      return;
    }

    res.json(job);
    return;
  }

  res.status(405).json({error: "Method Not Allowed"});
});
