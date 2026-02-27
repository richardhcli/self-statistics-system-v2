/**
 * @file analyze-and-transform.ts
 * @module @self-stats/soul-topology/entry-pipeline/analyze-and-transform
 *
 * Isomorphic journal entry pipeline: AI analysis → CDAG `GraphState` fragment.
 *
 * Accepts a pluggable `AiProvider` so the same logic runs in Node.js (Gemini SDK)
 * and in the browser (REST fetch). No direct AI SDK dependency here.
 *
 * ## Usage
 * ```typescript
 * import { analyzeAndTransform, type AiProvider } from '@self-stats/soul-topology';
 *
 * const provider: AiProvider = { analyzeEntry: (text) => fetch(...) };
 * const fragment = await analyzeAndTransform(provider, "Ran 5km today");
 * // fragment is a GraphState ready to merge into the CDAG store
 * ```
 */

import { type GraphState } from '@self-stats/contracts';
import { transformAnalysisToTopology } from './transform-analysis-to-topology.js';
import { type AiProvider } from './types.js';

/**
 * End-to-end pipeline: send raw journal text through the AI provider, then
 * convert the structured response into a `GraphState` fragment.
 *
 * @param provider - Environment-specific AI implementation (injected).
 * @param rawText  - Raw journal entry content to analyse.
 * @returns A `GraphState` fragment containing action/skill/characteristic nodes
 *          and directed edges. Must be merged (not replaced) into the CDAG store.
 */
export const analyzeAndTransform = async (
  provider: AiProvider,
  rawText: string,
): Promise<GraphState> => {
  const topology = await provider.analyzeEntry(rawText);
  return transformAnalysisToTopology(
    topology,
    topology.generalizationChain ?? [],
  );
};
