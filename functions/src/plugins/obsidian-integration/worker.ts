import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {PluginSDK} from "../../plugin-sdk";
import {ObsidianAnalysisResult} from "./types";

interface ObsidianJobRecord {
  type: string;
  status: string;
  payload?: {
    entryId?: string;
  };
}

const simulateAiAnalysis = async (text: string): Promise<ObsidianAnalysisResult> => {
  return {
    summary: `Analyzed: ${text.substring(0, 30)}...`,
    tags: ["productivity", "obsidian"],
    expReward: 100,
  };
};

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
    if (!entryId) {
      throw new Error("Missing entryId in job payload");
    }

    const entry = await sdk.journal.get(entryId);
    if (!entry) {
      throw new Error("Journal entry not found");
    }

    const aiResult = await simulateAiAnalysis(String((entry as {content?: string} | undefined)?.content ?? ""));

    await sdk.journal.update(entryId, {
      ai_analysis: aiResult,
      tags: aiResult.tags,
    });

    await sdk.user.updateStats(aiResult.expReward);

    await sdk.jobs.updateStatus(jobId, "completed", aiResult as unknown as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sdk.jobs.updateStatus(jobId, "failed", {error: message});
  }
});
