/**
 * @file journal-service.ts
 * @module api-firebase/services/journal-service
 *
 * The single journal processing pipeline. Replaces both
 * `functions/process-journal-entry.ts` body AND `plugins/journal-pipeline/pipeline.ts`.
 *
 * Steps:
 * 1. Call `analyzeAndTransform(provider, text)` → `GraphState` fragment.
 * 2. Build action weights → propagate → scale experience via progression-system.
 * 3. Persist player stats, graph, and journal entry via data-access repos.
 * 4. Return typed result for endpoints to forward.
 */

import {
  calculateParentPropagation,
  parseDurationToMultiplier,
  scaleExperience,
  updatePlayerStatsState,
} from "@self-stats/progression-system";
import {analyzeAndTransform} from "@self-stats/soul-topology";
import {nodeAiProvider, generateTopology} from "./ai-orchestrator";
import {upsertGraph, type GraphNode, type GraphEdge} from "../data-access/graph-repo";
import {loadPlayerStats, persistPlayerStats} from "../data-access/user-repo";
import {createEntry} from "../data-access/journal-repo";

// ─── Types ─────────────────────────────────────────────────────────────────

/** Input payload for the journal processing pipeline. */
export interface JournalInput {
  /** Raw journal entry text (required). */
  rawText: string;
  /** User ID scope for Firestore writes. */
  userId: string;
  /** Optional Unix epoch timestamp for the entry. */
  timestamp?: number;
}

/** Result returned by `processJournal` to the endpoint. */
export interface JournalResult {
  /** Auto-generated Firestore document ID. */
  entryId: string;
  /** Graph upsert summary. */
  graph: {nodeCount: number; edgeCount: number};
  /** Progression stats update summary. */
  stats: {
    totalIncrease: number;
    levelsGained: number;
    nextStats: Record<string, unknown>;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const normalizeNodeType = (type?: string): GraphNode["type"] => {
  if (
    type === "action" ||
    type === "skill" ||
    type === "characteristic"
  ) {
    return type;
  }
  return "characteristic";
};

// ─── Pipeline ──────────────────────────────────────────────────────────────

/**
 * End-to-end journal processing pipeline.
 *
 * Orchestrates AI analysis → topology transform → progression calculation →
 * persistence (stats + graph + journal entry).
 *
 * @param {JournalInput} input - Journal input payload.
 * @return {Promise<JournalResult>} Typed result with entry ID, graph metrics, and stats delta.
 */
export const processJournal = async (
  input: JournalInput,
): Promise<JournalResult> => {
  const {rawText, userId, timestamp} = input;

  // 1. AI → GraphState fragment (uses shared isomorphic pipeline)
  const graphFragment = await analyzeAndTransform(nodeAiProvider, rawText);

  // Also get raw topology for metadata (duration, weights)
  const topology = await generateTopology(rawText);

  // 2. Build action weights
  const actionWeights: Record<string, number> = {};
  topology.weightedActions.forEach((action) => {
    if (action?.label) {
      actionWeights[action.label] = action.weight ?? 0;
    }
  });

  // Normalize weights to sum to 1
  const weightSum = Object.values(actionWeights).reduce(
    (sum, w) => sum + w,
    0,
  );
  if (weightSum > 0 && Math.abs(weightSum - 1) > 0.01) {
    Object.keys(actionWeights).forEach((label) => {
      actionWeights[label] = actionWeights[label] / weightSum;
    });
  }

  // 3. Progression: propagate → scale → update stats
  const propagated = calculateParentPropagation(
    graphFragment.nodes,
    graphFragment.edges,
    actionWeights,
  );

  const multiplier = parseDurationToMultiplier(topology.durationMinutes);
  const scaledExpMap = scaleExperience(propagated, multiplier);

  const currentStats = await loadPlayerStats(userId);
  const {nextStats, totalIncrease, levelsGained} = updatePlayerStatsState(
    currentStats,
    scaledExpMap,
  );

  await persistPlayerStats(userId, nextStats);

  // 4. Persist graph
  const graphNodes: GraphNode[] = Object.values(graphFragment.nodes).map(
    (node) => ({
      id: node.id,
      label: node.label,
      type: normalizeNodeType(node.type),
    }),
  );

  const graphEdges: GraphEdge[] = Object.values(graphFragment.edges).map(
    (edge) => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      label: edge.label,
    }),
  );

  const graphResult = await upsertGraph(userId, graphNodes, graphEdges);

  // 5. Persist journal entry
  const entryId = await createEntry(userId, {
    rawText,
    timestamp: timestamp ?? Date.now(),
    analysis: topology,
    graph: {nodes: graphNodes, edges: graphEdges},
    result: {totalIncrease, levelsGained, nodeIncreases: scaledExpMap},
  });

  return {
    entryId,
    graph: graphResult,
    stats: {
      totalIncrease,
      levelsGained,
      nextStats: nextStats as unknown as Record<string, unknown>,
    },
  };
};
