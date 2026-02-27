/**
 * @file merge-topologies.ts
 * @module @self-stats/soul-topology/graph-operations/merge-topologies
 *
 * Pure function to merge a CDAG fragment into a master `GraphState`.
 *
 * ## Guarantees
 * - **Pure:** No Firestore, no side effects. Input/output are plain objects.
 * - **Deterministic:** Same inputs always produce the same output.
 * - **Non-destructive:** The master's `createdAt` is never overwritten for
 *   existing nodes/edges; only `updatedAt` is refreshed.
 *
 * ## Collision rules
 * - **Node collision (same `id`):** Metadata is composed (master values preserved
 *   for existing keys; fragment adds new keys). `updatedAt` is refreshed.
 * - **Edge collision (same `source→target`):** Weight is accumulated via
 *   `accumulateEdgeWeight()`. `updatedAt` is refreshed.
 * - **New node/edge:** Added directly from the fragment.
 */

import { type GraphState, type NodeData, type EdgeData } from '@self-stats/contracts';
import { accumulateEdgeWeight } from './weight-calculations.js';
import { type MergeOptions, DEFAULT_MERGE_OPTIONS, type ResolvedMergeOptions } from './types.js';

/**
 * Build a lookup key for an edge: `"source→target"`.
 * Used to detect edge collisions regardless of edge `id` format differences.
 */
const edgeKey = (edge: EdgeData): string => `${edge.source}→${edge.target}`;

/**
 * Build a map from `edgeKey → edgeId` for all edges in a `GraphState`.
 */
const buildEdgeKeyIndex = (edges: Record<string, EdgeData>): Map<string, string> => {
  const index = new Map<string, string>();
  for (const [id, edge] of Object.entries(edges)) {
    index.set(edgeKey(edge), id);
  }
  return index;
};

/**
 * Merge a topology fragment into the master graph state.
 *
 * @param master   - The existing full CDAG graph (e.g. loaded from Firestore).
 * @param fragment - A new `GraphState` fragment produced by `analyzeAndTransform`
 *                   or `transformAnalysisToTopology`.
 * @param options  - Optional merge configuration. See `MergeOptions`.
 * @returns A **new** `GraphState` (immutable — master is not mutated).
 *
 * @example
 * ```typescript
 * const updated = mergeFragmentIntoMaster(currentGraph, newFragment);
 * // updated.nodes contains all master nodes + new fragment nodes
 * // colliding edges have accumulated weights
 * ```
 */
export const mergeFragmentIntoMaster = (
  master: GraphState,
  fragment: GraphState,
  options?: MergeOptions,
): GraphState => {
  const opts: ResolvedMergeOptions = {
    ...DEFAULT_MERGE_OPTIONS,
    ...options,
  };

  const timestamp = new Date().toISOString();

  // ── Merge nodes ───────────────────────────────────────────────────────────

  const mergedNodes: Record<string, NodeData> = { ...master.nodes };

  for (const [id, fragNode] of Object.entries(fragment.nodes)) {
    const existing = mergedNodes[id];

    if (existing) {
      // Node collision: compose metadata, refresh updatedAt, preserve createdAt
      mergedNodes[id] = {
        ...existing,
        label: fragNode.label || existing.label,
        type: fragNode.type !== 'none' ? fragNode.type : existing.type,
        metadata: {
          ...(existing.metadata ?? {}),
          ...(fragNode.metadata ?? {}),
        },
        updatedAt: timestamp,
        // createdAt is never overwritten
      };
    } else {
      // New node: add from fragment
      mergedNodes[id] = {
        ...fragNode,
        createdAt: fragNode.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
    }
  }

  // ── Merge edges ───────────────────────────────────────────────────────────

  const mergedEdges: Record<string, EdgeData> = { ...master.edges };
  const masterEdgeIndex = buildEdgeKeyIndex(master.edges);

  for (const [fragEdgeId, fragEdge] of Object.entries(fragment.edges)) {
    const key = edgeKey(fragEdge);
    const existingEdgeId = masterEdgeIndex.get(key);

    if (existingEdgeId) {
      // Edge collision: accumulate weight
      const existing = mergedEdges[existingEdgeId];
      mergedEdges[existingEdgeId] = {
        ...existing,
        weight: accumulateEdgeWeight(
          existing.weight ?? 1,
          fragEdge.weight ?? 1,
          opts.changeRate,
        ),
        updatedAt: timestamp,
        // createdAt is never overwritten
      };
    } else {
      // New edge: add from fragment
      mergedEdges[fragEdgeId] = {
        ...fragEdge,
        createdAt: fragEdge.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      // Register in index to handle duplicate fragment edges
      masterEdgeIndex.set(key, fragEdgeId);
    }
  }

  return { nodes: mergedNodes, edges: mergedEdges };
};
