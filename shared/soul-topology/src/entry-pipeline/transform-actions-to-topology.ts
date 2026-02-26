/**
 * @file transform-actions-to-topology.ts
 * @module @self-stats/soul-topology/entry-pipeline/transform-actions-to-topology
 *
 * Converts a plain list of action labels into a minimal `GraphState` fragment
 * containing only NEW action leaf nodes (no edges, no skill/characteristic nodes).
 *
 * ## When to use this vs `transformAnalysisToTopology`
 * - Use **this function** for the **offline / preview** path where AI is
 *   unavailable and only raw action names are known.
 * - Use **`transformAnalysisToTopology`** when a full `TextToActionResponse`
 *   is available (the primary AI-assisted path).
 *
 * ## Deduplication
 * Actions already present in `currentTopology.nodes` are skipped to avoid
 * overwriting existing metadata (e.g. custom labels or `createdAt` timestamps).
 * The caller must still merge the result into the store with `updatedAt` refresh.
 */

import { type GraphState, type NodeData } from '@self-stats/contracts';

/**
 * Build a `GraphState` fragment with NEW action nodes for all labels in `actions`
 * that do not already exist in `currentTopology`.
 *
 * @param actions         - List of action label strings to ensure exist in the CDAG.
 *                          Duplicates within the list are handled by object key assignment.
 * @param currentTopology - Snapshot of the existing CDAG so that existing nodes
 *                          are not overwritten.
 * @returns A `GraphState` with only the net-new action nodes and an empty edges map.
 *          Merge this fragment into the store using your merge strategy.
 */
export const transformActionsToTopology = (
  actions: string[],
  currentTopology: GraphState,
): GraphState => {
  const nodes: Record<string, NodeData> = {};
  const timestamp = new Date().toISOString();

  actions.forEach((action) => {
    if (!currentTopology.nodes[action]) {
      nodes[action] = {
        id: action,
        label: action,
        type: 'action',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }
  });

  return {
    nodes,
    edges: {},
  };
};

