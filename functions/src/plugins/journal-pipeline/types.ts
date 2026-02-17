import type {AiJournalAnalysis} from "../../services/ai-client";
import type {GraphEdge, GraphNode} from "../../services/graph-writer";

export interface JournalPipelineRequest {
  content: string;
  duration?: number;
}

export interface JournalPipelineResponse {
  entryId: string;
  analysis: AiJournalAnalysis;
  graph: {
    nodeCount: number;
    edgeCount: number;
  };
  stats: {
    expReward: number;
  };
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface JournalRecord {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  ai_analysis?: AiJournalAnalysis;
  createdAt?: unknown;
  createdAtIso?: string;
}
