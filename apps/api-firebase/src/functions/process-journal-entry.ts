import {onRequest} from "firebase-functions/v2/https";
import {
  calculateParentPropagation,
  parseDurationToMultiplier,
  scaleExperience,
  updatePlayerStatsState,
  type PlayerStatistics,
} from "@self-stats/progression-system";
import {transformAnalysisToTopology} from "@self-stats/soul-topology";
import type {GraphNode, GraphEdge} from "../services/graph-writer";
import {upsertGraph} from "../services/graph-writer";
import {generateTopology} from "../services/genai-topology";
import {db} from "../services/admin-init";

const DEFAULT_STATS: PlayerStatistics = {progression: {experience: 0, level: 1}};

const loadPlayerStats = async (userId: string): Promise<PlayerStatistics> => {
  const ref = db.doc(`users/${userId}/user_information/player_statistics`);
  const snapshot = await ref.get();
  const data = snapshot.data() as { stats?: PlayerStatistics } | undefined;
  return data?.stats ?? DEFAULT_STATS;
};

const persistPlayerStats = async (userId: string, stats: PlayerStatistics) => {
  const ref = db.doc(`users/${userId}/user_information/player_statistics`);
  await ref.set({stats, updatedAt: new Date().toISOString()}, {merge: true});
};

const normalizeNodeType = (type?: string): GraphNode["type"] => {
  if (type === "action" || type === "skill" || type === "characteristic") return type;
  return "characteristic";
};

export const processJournalEntry = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method Not Allowed"});
    return;
  }

  const {rawText, timestamp} = (req.body ?? {}) as { rawText?: string; timestamp?: number };
  if (!rawText || typeof rawText !== "string") {
    res.status(400).json({error: "Missing rawText"});
    return;
  }

  const userId = (req.headers["x-user-id"] as string) || "default_user";

  try {
    const topology = await generateTopology(rawText);
    const graphFragment = transformAnalysisToTopology(
      topology,
      topology.generalizationChain ?? [],
    );

    const actionWeights: Record<string, number> = {};
    topology.weightedActions.forEach((action) => {
      if (action?.label) {
        actionWeights[action.label] = action.weight ?? 0;
      }
    });

    const weightSum = Object.values(actionWeights).reduce((sum, w) => sum + w, 0);
    if (weightSum > 0 && Math.abs(weightSum - 1) > 0.01) {
      Object.keys(actionWeights).forEach((label) => {
        actionWeights[label] = actionWeights[label] / weightSum;
      });
    }

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

    const graphNodes: GraphNode[] = Object.values(graphFragment.nodes).map((node) => ({
      id: node.id,
      label: node.label,
      type: normalizeNodeType(node.type),
    }));

    const graphEdges: GraphEdge[] = Object.values(graphFragment.edges).map((edge) => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      label: edge.label,
    }));

    const graphResult = await upsertGraph(userId, graphNodes, graphEdges);

    const entriesCol = db.collection(`users/${userId}/journal_entries`);
    const entryRef = entriesCol.doc();

    await entryRef.set({
      rawText,
      timestamp: timestamp ?? Date.now(),
      analysis: topology,
      graph: {
        nodes: graphNodes,
        edges: graphEdges,
      },
      result: {
        totalIncrease,
        levelsGained,
        nodeIncreases: scaledExpMap,
      },
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      entryId: entryRef.id,
      graph: graphResult,
      stats: {
        totalIncrease,
        levelsGained,
        nextStats,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({error: message});
  }
});
