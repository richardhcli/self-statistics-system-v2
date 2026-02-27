/**
 * @file graph-service.ts
 * @module api-firebase/services/graph-service
 *
 * Thin facade over `data-access/graph-repo` + `@self-stats/soul-topology`
 * graph operations (merge, weight recalculation).
 *
 * Services layer consumers call this instead of reaching into graph-repo
 * directly, allowing future graph reconciliation logic to live here.
 */

import {upsertGraph, type GraphNode, type GraphEdge} from "../data-access/graph-repo";

// Re-export types for convenience
export type {GraphNode, GraphEdge} from "../data-access/graph-repo";

/**
 * Upsert graph nodes and edges for a user.
 *
 * Currently delegates directly to `graph-repo.upsertGraph`. Future:
 * load the user's master graph, call `mergeFragmentIntoMaster()`, and
 * write back the reconciled result.
 *
 * @param {string} userId - Firestore user scope.
 * @param {GraphNode[]} nodes - Nodes to upsert.
 * @param {GraphEdge[]} edges - Edges to upsert.
 * @return {Promise<{nodeCount: number, edgeCount: number}>} Count of total nodes and edges.
 */
export const upsertUserGraph = async (
  userId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
): Promise<{nodeCount: number; edgeCount: number}> => {
  return upsertGraph(userId, nodes, edges);
};
