/**
 * @file index.ts
 * @module @self-stats/soul-topology/entry-pipeline
 *
 * Barrel for the journal entry processing sub-pipeline.
 *
 * ## Exports
 * - `transformAnalysisToTopology` — Converts full AI response → `GraphState` fragment.
 * - `transformActionsToTopology`  — Converts plain action labels → minimal `GraphState` fragment.
 * - `EntryOrchestratorContext`    — Input contract for `useEntryOrchestrator`.
 * - `AiEntryAnalysisResult`       — Intermediate result after AI analysis step.
 * - `AnalyzeEntryResult`          — Final result consumed by the orchestrator hook.
 */

export { transformAnalysisToTopology } from './transform-analysis-to-topology.js';
export { transformActionsToTopology } from './transform-actions-to-topology.js';
export type {
  EntryOrchestratorContext,
  AiEntryAnalysisResult,
  AnalyzeEntryResult,
} from './types.js';
