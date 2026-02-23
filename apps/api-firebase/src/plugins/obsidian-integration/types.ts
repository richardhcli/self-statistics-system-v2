/**
 * Input payload received from Obsidian clients.
 */
export interface ObsidianPayload {
  content: string;
  duration: number;
}

/**
 * Result returned after AI analysis completes.
 */
export interface ObsidianAnalysisResult {
  summary: string;
  tags: string[];
  expReward: number;
}

/**
 * Job payload stored in Firestore for processing.
 */
export interface ObsidianJobPayload {
  entryId: string;
}
