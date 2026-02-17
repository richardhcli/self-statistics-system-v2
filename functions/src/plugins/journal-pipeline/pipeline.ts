import {PluginSDK} from "../../plugin-sdk";
import {analyzeJournal} from "../../services/ai-client";
import {upsertGraph, type GraphEdge, type GraphNode} from "../../services/graph-writer";
import type {JournalPipelineRequest, JournalPipelineResponse} from "./types";

const buildGraphPayload = (analysis: Awaited<ReturnType<typeof analyzeJournal>>): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} => {
  const nodes: GraphNode[] = [
    ...analysis.characteristics.map((c) => ({id: c.id, label: c.label, type: "characteristic" as const})),
    ...analysis.skills.map((s) => ({id: s.id, label: s.label, type: "skill" as const})),
    ...analysis.actions.map((a) => ({id: a.id, label: a.label, type: "action" as const})),
  ];

  const edges: GraphEdge[] = analysis.links.map((link) => ({
    source: link.source,
    target: link.target,
    weight: link.weight,
    label: link.label,
  }));

  return {nodes, edges};
};

export const runJournalPipeline = async (
  userId: string,
  payload: JournalPipelineRequest,
): Promise<JournalPipelineResponse> => {
  const {content, duration = 0} = payload;
  const sdk = new PluginSDK(userId);

  const analysis = await analyzeJournal({content, duration});
  const entryId = await sdk.journal.create(content, {duration});

  await sdk.journal.update(entryId, {
    ai_analysis: analysis,
    summary: analysis.summary,
    tags: analysis.tags,
    sentiment: analysis.sentiment,
    updatedAt: new Date().toISOString(),
  });

  const graphPayload = buildGraphPayload(analysis);
  const graphResult = await upsertGraph(userId, graphPayload.nodes, graphPayload.edges);

  await sdk.user.updateStats(analysis.expReward);

  return {
    entryId,
    analysis,
    graph: graphResult,
    stats: {expReward: analysis.expReward},
  };
};
