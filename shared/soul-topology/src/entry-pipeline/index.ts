/**
 * @file index.ts
 * @module @self-stats/soul-topology/entry-pipeline
 *
 * Barrel for the journal entry processing sub-pipeline.
 *
 * ## Exports
 * - `transformAnalysisToTopology` — Converts full AI response → `GraphState` fragment.
 * - `transformActionsToTopology`  — Converts plain action labels → minimal `GraphState` fragment.
 * - `analyzeAndTransform`         — Isomorphic AI → topology pipeline (accepts `AiProvider`).
 * - `AiProvider`                  — DI interface for environment-specific AI calls.
 * - `EntryOrchestratorContext`    — Input contract for `useEntryOrchestrator`.
 * - `AiEntryAnalysisResult`       — Intermediate result after AI analysis step.
 * - `AnalyzeEntryResult`          — Final result consumed by the orchestrator hook.
 */

export { transformAnalysisToTopology } from './transform-analysis-to-topology.js';
export { transformActionsToTopology } from './transform-actions-to-topology.js';
export { analyzeAndTransform } from './analyze-and-transform.js';
export type {
  AiProvider,
  EntryOrchestratorContext,
  AiEntryAnalysisResult,
  AnalyzeEntryResult,
} from './types.js';
