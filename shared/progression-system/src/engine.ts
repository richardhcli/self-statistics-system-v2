/**
 * @file engine.ts
 * @module @self-stats/progression-system/engine
 *
 * Progression Engine — Path-Weighted Cumulative Averaging (PWCA)
 *
 * ## Algorithm overview
 * The CDAG is traversed **bottom-up** starting from leaf action nodes.
 * For each action node, a weighted BFS walk visits every ancestor (skill →
 * characteristic → … → root) and accumulates EXP with decaying path weights.
 *
 * Final EXP for each node = `sum(seed * pathWeight) / contributionCount`.
 * Averaging prevents nodes with many incoming paths from being over-inflated.
 *
 * ## Why this design
 * - **Deterministic**: same inputs always produce the same output.
 * - **Pure**: no side effects, no store access — trivially unit-testable.
 * - **Firebase-safe**: runs identically in Cloud Functions and the browser.
 *
 * @module @self-stats/progression-system/engine
 */

import { type NodeData, type EdgeData } from '@self-stats/contracts';
import { EXP_PRECISION } from './constants.js';

/** Round a number to the configured EXP decimal precision. */
const roundExp = (n: number): number =>
  Math.round(n * 10 ** EXP_PRECISION) / 10 ** EXP_PRECISION;

/**
 * Build a lookup of `childId → { parentId: edgeWeight }` from the edge table.
 *
 * Edges in the CDAG point parent → child (top-down generalisation direction),
 * but the engine needs to walk *upward*, so this inverts them into a
 * child-keyed map for O(1) parent lookup during BFS.
 *
 * @param nodes - Full node table (used to initialise every node key).
 * @param edges - Full edge table (directed parent → child).
 * @returns Map: `childId → Record<parentId, edgeWeight>`.
 *
 * @internal Not exported — used only by `calculateParentPropagation`.
 */
const buildParentMap = (
  nodes: Record<string, NodeData>,
  edges: Record<string, EdgeData>,
): Record<string, Record<string, number>> => {
  const parentMap: Record<string, Record<string, number>> = {};

  Object.keys(nodes).forEach((nodeId) => {
    parentMap[nodeId] = {};
  });

  Object.values(edges).forEach((edge) => {
    if (!parentMap[edge.target]) {
      parentMap[edge.target] = {};
    }
    parentMap[edge.target][edge.source] = edge.weight || 1.0;
  });

  return parentMap;
};

/**
 * Propagate experience seeds upward through the CDAG using
 * Path-Weighted Cumulative Averaging BFS.
 *
 * ## Call site
 * ```typescript
 * const propagated = calculateParentPropagation(
 *   topology.nodes,
 *   topology.edges,
 *   { "ran 10km": 0.9, "read chapter": 0.7 },
 * );
 * // propagated["Vitality"] ≈ 0.72 (averaged contribution from both paths)
 * ```
 *
 * ## Steps
 * 1. Build a child→parents map via `buildParentMap`.
 * 2. For each seed `(actionLabel, seedValue)`, enqueue the action with `weight = 1.0`.
 * 3. Dequeue node, accumulate `seedValue * weight`, then enqueue all parents with
 *    `weight *= edgeWeight` (path weight decays as we go deeper).
 * 4. Divide each node's accumulated sum by its contribution count to average.
 *
 * @param nodes         - CDAG node table (`GraphState.nodes`).
 * @param edges         - CDAG edge table (`GraphState.edges`).
 * @param initialValues - Map of `actionLabel → seedExp` (the "starting" EXP
 *                        for each action before propagation).
 *                        Typically `weightedActions` scaled by `duration`.
 * @returns Map of `nodeId → propagatedExp` for every node that was visited.
 *          Nodes that were not reachable from any seed are absent from the result.
 */
export const calculateParentPropagation = (
  nodes: Record<string, NodeData>,
  edges: Record<string, EdgeData>,
  initialValues: Record<string, number>,
): Record<string, number> => {
  const parentMap = buildParentMap(nodes, edges);

  const accumulatedSum: Record<string, number> = {};
  const contributionCount: Record<string, number> = {};

  Object.entries(initialValues).forEach(([actionLabel, seedValue]) => {
    const queue: { label: string; weight: number }[] = [
      { label: actionLabel, weight: 1.0 },
    ];

    while (queue.length > 0) {
      const { label, weight } = queue.shift()!;

      accumulatedSum[label] = (accumulatedSum[label] || 0) + seedValue * weight;
      contributionCount[label] = (contributionCount[label] || 0) + 1;

      const parents = parentMap[label] || {};
      Object.entries(parents).forEach(([parentLabel, edgeWeight]) => {
        queue.push({ label: parentLabel, weight: weight * edgeWeight });
      });
    }
  });

  const result: Record<string, number> = {};
  Object.keys(accumulatedSum).forEach((label) => {
    const sum = accumulatedSum[label];
    const count = contributionCount[label];
    result[label] = count > 0 ? roundExp(sum / count) : 0;
  });

  return result;
};
