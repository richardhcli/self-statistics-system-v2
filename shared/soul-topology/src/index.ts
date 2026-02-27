/**
 * @file index.ts
 * @module @self-stats/soul-topology
 *
 * Public API barrel for the `@self-stats/soul-topology` shared package.
 *
 * ## What this package provides
 * Pure, side-effect-free functions for converting AI output and raw action
 * lists into CDAG `GraphState` fragments that can be merged into the store.
 *
 * | Export                          | Purpose                                                          |
 * |---------------------------------|------------------------------------------------------------------|
 * | `transformAnalysisToTopology`   | Full AI response → 3-layer `GraphState` (actions+skills+chars)   |
 * | `transformActionsToTopology`    | Action label list → minimal `GraphState` (leaf nodes only)       |
 * | `analyzeAndTransform`           | Isomorphic AI → topology pipeline (accepts `AiProvider`)         |
 * | `AiProvider`                    | DI interface for environment-specific AI calls                   |
 * | `EntryOrchestratorContext`      | Input type for the orchestrator hook                             |
 * | `AiEntryAnalysisResult`         | Intermediate type after the AI analysis step                     |
 * | `AnalyzeEntryResult`            | Final type returned to the caller                                |
 * | `mergeFragmentIntoMaster`       | Pure merge of a topology fragment into the master graph          |
 * | `accumulateEdgeWeight`          | Edge weight accumulation formula                                 |
 * | Re-exports from contracts       | `GraphState`, `NodeData`, `EdgeData`, `WeightedAction`, etc.     |
 *
 * ## Dependencies
 * - `@self-stats/contracts` (peer workspace dependency)
 * - No React, no Firebase SDK, no browser globals.
 *
 * @packageDocumentation
 */

export type {
  GraphState,
  NodeData,
  EdgeData,
  WeightedAction,
  GeneralizationLink,
  TextToActionResponse,
} from '@self-stats/contracts';

export * from './entry-pipeline/index.js';
export * from './graph-operations/index.js';
