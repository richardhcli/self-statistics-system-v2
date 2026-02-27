/**
 * @file weight-calculations.ts
 * @module @self-stats/soul-topology/graph-operations/weight-calculations
 *
 * Pure math utilities for edge weight accumulation during graph merges.
 *
 * The core formula:
 * ```
 * W_new = clamp(W_old + W_fragment × changeRate, 0, 1)
 * ```
 *
 * This ensures the master graph slowly evolves as new journal entries add
 * small incremental weight to existing edges, while keeping all weights
 * in the valid `[0, 1]` range.
 */

import { DEFAULT_MERGE_OPTIONS } from './types.js';

/**
 * Accumulate a fragment's edge weight into an existing master edge weight.
 *
 * @param oldWeight      - Current weight in the master graph (`[0, 1]`).
 * @param fragmentWeight - Weight from the incoming fragment edge (`[0, 1]`).
 * @param changeRate     - Scaling factor for the fragment contribution.
 *                         Defaults to `0.01` (1% of fragment weight added per merge).
 * @returns Updated weight clamped to `[0, 1]`.
 *
 * @example
 * ```typescript
 * accumulateEdgeWeight(0.5, 0.8);        // 0.508
 * accumulateEdgeWeight(0.5, 0.8, 0.1);   // 0.58
 * accumulateEdgeWeight(0.99, 1.0, 0.05); // 1.0 (clamped)
 * ```
 */
export const accumulateEdgeWeight = (
  oldWeight: number,
  fragmentWeight: number,
  changeRate: number = DEFAULT_MERGE_OPTIONS.changeRate,
): number => {
  const raw = oldWeight + fragmentWeight * changeRate;
  return Math.min(1, Math.max(0, raw));
};
