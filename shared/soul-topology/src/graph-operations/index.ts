/**
 * @file index.ts
 * @module @self-stats/soul-topology/graph-operations
 *
 * Barrel for the graph operations sub-module.
 *
 * ## Exports
 * - `mergeFragmentIntoMaster` — Pure merge of a topology fragment into the master graph.
 * - `accumulateEdgeWeight`    — Edge weight accumulation formula.
 * - `MergeOptions`            — Configuration for merge behaviour.
 */

export { mergeFragmentIntoMaster } from './merge-topologies.js';
export { accumulateEdgeWeight } from './weight-calculations.js';
export type { MergeOptions, ResolvedMergeOptions } from './types.js';
export { DEFAULT_MERGE_OPTIONS } from './types.js';
