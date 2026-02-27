/**
 * @file types.ts
 * @module @self-stats/soul-topology/graph-operations/types
 *
 * Configuration types for graph merge and weight calculation operations.
 */

/**
 * Options for `mergeFragmentIntoMaster`.
 *
 * Controls how edge weights are accumulated when a fragment edge collides
 * with an existing master edge.
 */
export interface MergeOptions {
  /**
   * Scaling factor applied to fragment edge weights during accumulation.
   *
   * Formula: `W_new = W_old + W_fragment × changeRate`
   *
   * Lower values make the master graph slow to evolve (high inertia).
   * Higher values make the graph respond faster to new entries.
   *
   * @default 0.01
   */
  changeRate?: number;
}

/** Resolved merge options with all defaults applied. */
export interface ResolvedMergeOptions {
  /** @see MergeOptions.changeRate */
  changeRate: number;
}

/** Default merge configuration. */
export const DEFAULT_MERGE_OPTIONS: ResolvedMergeOptions = {
  changeRate: 0.01,
};
