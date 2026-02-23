import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {PluginSDK} from "../../plugin-sdk";
import {analyzeJournal} from "../../services/ai-client";
import {upsertGraph} from "../../services/graph-writer";
import {buildGraphPayload} from "../journal-pipeline/pipeline";

interface ObsidianJobRecord {
  type: string;
  status: string;
  payload?: {
    entryId?: string;
    duration?: number;
  };
}

/**
 * Firestore trigger to process queued Obsidian jobs.
 */
export const obsidianWorker = onDocumentCreated("users/{uid}/jobs/{jobId}", async (event) => {
  const jobData = event.data?.data() as ObsidianJobRecord | undefined;
  if (!jobData || jobData.type !== "ai_analysis_obsidian" || jobData.status !== "queued") {
    return;
  }

  const {uid, jobId} = event.params;
  const sdk = new PluginSDK(uid);

  try {
    await sdk.jobs.updateStatus(jobId, "processing");

    const entryId = jobData.payload?.entryId;
    const durationPayload = jobData.payload?.duration;
    if (!entryId) {
      throw new Error("Missing entryId in job payload");
    }

    const entry = await sdk.journal.get(entryId);
    if (!entry) {
      throw new Error("Journal entry not found");
    }

    const content = (entry as {content?: string} | undefined)?.content ?? "";
    const duration = typeof durationPayload === "number"
      ? durationPayload
      : (entry as {metadata?: {duration?: number}} | undefined)?.metadata?.duration ?? 0;

    if (!content) {
      throw new Error("Journal entry missing content");
    }

    logger.info("obsidianWorker processing", {userId: uid, jobId, entryId, duration});

    const topology = await analyzeJournal({content, duration});

    const graphPayload = buildGraphPayload(topology);
    const graphResult = await upsertGraph(uid, graphPayload.nodes, graphPayload.edges);

    logger.info("obsidianWorker graph upserted", {
      userId: uid,
      jobId,
      entryId,
      nodes: graphPayload.nodes.length,
      edges: graphPayload.edges.length,
    });

    await sdk.jobs.updateStatus(jobId, "completed", {
      entryId,
      graph: graphResult,
      result: {nodesMade: graphPayload.nodes.length},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("obsidianWorker failed", {userId: uid, jobId, error: message});
    await sdk.jobs.updateStatus(jobId, "failed", {error: message});
  }
});
