import {PluginSDK} from "../../plugin-sdk";
import {analyzeJournal} from "../../services/ai-client";
import {upsertGraph, type GraphEdge, type GraphNode} from "../../services/graph-writer";
import type {TopologyResponse} from "../../services/genai-topology";
import type {JournalPipelineRequest, JournalPipelineResponse} from "./types";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "entry";

export const buildGraphPayload = (topology: TopologyResponse): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} => {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const addNode = (id: string, label: string, type: GraphNode["type"]) => {
    if (!id || nodes.has(id)) return;
    nodes.set(id, {id, label: label || id, type});
  };

  topology.weightedActions.forEach(({label}) => {
    const id = `action-${slugify(label ?? "action")}`;
    addNode(id, label ?? id, "action");
  });

  topology.skillMappings.forEach(({child, parent, weight}) => {
    const parentId = `skill-${slugify(parent ?? "skill")}`;
    const childId = `action-${slugify(child ?? "action")}`;
    addNode(parentId, parent ?? parentId, "skill");
    addNode(childId, child ?? childId, "action");
    edges.push({source: parentId, target: childId, weight});
  });

  topology.characteristicMappings.forEach(({child, parent, weight}) => {
    const parentId = `characteristic-${slugify(parent ?? "characteristic")}`;
    const childId = `skill-${slugify(child ?? "skill")}`;
    addNode(parentId, parent ?? parentId, "characteristic");
    addNode(childId, child ?? childId, "skill");
    edges.push({source: parentId, target: childId, weight});
  });

  const progressionId = "progression";

  (topology.generalizationChain ?? []).forEach(({child, parent, weight}) => {
    const parentId = `characteristic-${slugify(parent ?? "characteristic")}`;
    const childId = `characteristic-${slugify(child ?? "characteristic")}`;
    addNode(parentId, parent ?? parentId, "characteristic");
    addNode(childId, child ?? childId, "characteristic");
    edges.push({source: parentId, target: childId, weight});
  });

  Array.from(nodes.values())
    .filter((node) => node.type === "characteristic" && node.id !== progressionId)
    .forEach((node) => {
      edges.push({source: progressionId, target: node.id, weight: 1});
    });

  return {nodes: Array.from(nodes.values()), edges};
};

export const runJournalPipeline = async (
  userId: string,
  payload: JournalPipelineRequest,
): Promise<JournalPipelineResponse> => {
  const {content, duration = 0} = payload;
  const sdk = new PluginSDK(userId);

  const topology = await analyzeJournal({content, duration});
  const entryId = await sdk.journal.create(content, {duration});

  await sdk.journal.update(entryId, {
    ai_analysis: topology,
    updatedAt: new Date().toISOString(),
  });

  const graphPayload = buildGraphPayload(topology);
  const graphResult = await upsertGraph(userId, graphPayload.nodes, graphPayload.edges);

  const expReward = Math.max(50, Math.min(200, Math.round((duration || topology.durationMinutes || 30) / 30) * 50));
  await sdk.user.updateStats(expReward);

  return {
    entryId,
    analysis: topology,
    graph: graphResult,
    stats: {expReward},
  };
};
