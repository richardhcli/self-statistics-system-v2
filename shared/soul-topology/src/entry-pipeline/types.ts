/**
 * @file types.ts
 * @module @self-stats/soul-topology/entry-pipeline/types
 *
 * Domain contracts for the journal entry processing pipeline.
 *
 * These types flow through the full entry lifecycle:
 * `user input → analyzeEntry → transformAnalysisToTopology → calculateScaledProgression`
 *
 * AI agents: if you extend the pipeline (e.g. add a new step), add a new
 * interface here rather than inline types scattered across files.
 */

import { type GraphState, type GeneralizationLink, type TextToActionResponse } from '@self-stats/contracts';

// ─── AI provider injection ─────────────────────────────────────────────────

/**
 * Dependency-injection interface for AI topology generation.
 *
 * Implemented differently per environment:
 * - **Backend (Node.js):** wraps `@google/genai` Gemini calls.
 * - **Browser:** wraps a `fetch()` POST to the REST API.
 *
 * Injected into `analyzeAndTransform()` so the shared pipeline stays
 * isomorphic — no direct SDK imports in `@self-stats/soul-topology`.
 */
export interface AiProvider {
  /**
   * Send journal text to the AI model and return the structured topology.
   * @param text - Raw journal entry content.
   * @returns Parsed AI response matching `TextToActionResponse`.
   */
  analyzeEntry(text: string): Promise<TextToActionResponse>;
}

// ─── Input context ─────────────────────────────────────────────────────────

/**
 * Everything the orchestrator hook needs to kick off a journal entry analysis.
 * Passed from the `JournalForm` component into `useEntryOrchestrator`.
 */
export interface EntryOrchestratorContext {
  /** Raw journal entry text submitted by the user (mandatory for AI analysis). */
  entry: string;
  /**
   * Optional list of manually specified action labels (used when the user
   * overrides the AI-extracted list or when AI is turned off).
   */
  actions?: string[];
  /**
   * Whether to run the full AI text-to-topology pipeline.
   * `false` = use `actions` directly (offline / preview mode).
   */
  useAI?: boolean;
  /**
   * Activity duration hint provided by the user before AI analysis.
   * Integer minutes OR legacy string ("1h30m").
   * If absent, the AI's `durationMinutes` field is used instead.
   */
  duration?: string;
  /** Raw date context from the journal form (shape not yet finalised). */
  dateInfo?: unknown;
  /**
   * Pre-normalised date parts if the calling layer already parsed the date.
   * Used when persisting the entry to Firestore with a structured timestamp.
   */
  normalizedDate?: { year: string; month: string; day: string; time: string };
}

// ─── AI analysis result ────────────────────────────────────────────────────

/**
 * The full result returned by the AI text-to-topology step inside `analyzeEntry`.
 *
 * This intermediate type is consumed immediately by the orchestrator to build
 * the CDAG fragment — it is not persisted to Firestore directly.
 */
export interface AiEntryAnalysisResult {
  /**
   * Raw structured response from the LLM (Gemini / OpenAI).
   * Contains weighted actions, skill mappings, characteristic mappings, and duration.
   */
  analysis: TextToActionResponse;
  /**
   * Optional duration string resolved after the AI step.
   * Overrides `EntryOrchestratorContext.duration` if the user did not specify one.
   */
  finalDuration?: string;
  /**
   * Generalisation chain produced by the AI to describe how actions roll up
   * into skills and characteristics.
   * Passed to `transformAnalysisToTopology` as a fallback when
   * `analysis.generalizationChain` is absent.
   */
  generalizationChain: GeneralizationLink[];
  /**
   * CDAG `GraphState` fragment produced by `transformAnalysisToTopology`
   * during the AI step.  Merged into the main topology store after the entry.
   */
  topologyFragment: GraphState;
}

// ─── Final entry result ────────────────────────────────────────────────────

/**
 * The final result of a complete entry analysis (AI or manual).
 *
 * Returned by `analyzeEntry` and consumed by `useEntryOrchestrator` to:
 * 1. Merge `topologyFragment` into the CDAG store.
 * 2. Pass `actionWeights` + `estimatedDuration` to `calculateScaledProgression`.
 * 3. Persist the updated `PlayerStatistics` to Firestore.
 */
export interface AnalyzeEntryResult {
  /**
   * CDAG `GraphState` fragment containing only the NEW nodes and edges
   * that were identified in this entry.  Must be merged (not replaced)
   * into the existing CDAG store.
   */
  topologyFragment: GraphState;
  /**
   * Duration string passed through to the progression calculator.
   * Integer minutes OR legacy string, or `"30"` as a safe default.
   */
  estimatedDuration: string;
  /**
   * Map of `actionLabel → weight` that becomes the initial EXP seeds
   * fed into `calculateParentPropagation`.
   * Keys match the `id` fields of leaf nodes in `topologyFragment.nodes`.
   */
  actionWeights: Record<string, number>;
}
