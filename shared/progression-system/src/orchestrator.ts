/**
 * @file orchestrator.ts
 * @module @self-stats/progression-system/orchestrator
 *
 * Progression Orchestrator — High-Level Calculation Pipelines
 *
 * ## Responsibility
 * Composes `engine` + `formulas` + `state-mutations` into two top-level
 * "calculate everything from a journal entry" functions that the hook layer
 * (browser) and Cloud Function (backend) both call directly.
 *
 * Neither function performs IO, store mutations, or side-effects.
 *
 * ## When to use which function
 * - **`calculateScaledProgression`** — Use when you have AI-produced
 *   weighted action scores AND a known duration.  This is the primary
 *   path after a full journal entry with AI analysis.
 * - **`calculateDirectProgression`** — Use when you only have a list of
 *   action labels and want to grant equal raw EXP to each.  Used by the
 *   optimistic "preview" mode before AI results arrive.
 */

import { type NodeData, type EdgeData } from '@self-stats/contracts';
import { calculateParentPropagation } from './engine.js';
import { parseDurationToMultiplier, scaleExperience } from './formulas.js';
import { updatePlayerStatsState, type PlayerStatistics } from './state-mutations.js';

// ─── Return type shared by both functions ──────────────────────────────────

/**
 * Unified result shape returned by both orchestrator functions.
 */
export interface ProgressionResult {
  /** The new `PlayerStatistics` map after applying all EXP increases. */
  nextStats: PlayerStatistics;
  /** Total EXP added across the entire graph this session (rounded). */
  totalIncrease: number;
  /** Total number of level-ups triggered across all nodes. */
  levelsGained: number;
  /** Per-node EXP increases (after propagation + scaling) for display / debugging. */
  nodeIncreases: Record<string, number>;
}

// ─── Primary pipeline ──────────────────────────────────────────────────────

/**
 * Full AI-assisted progression pipeline:
 * 1. **Propagate** AI-weighted action seeds upward through the CDAG.
 * 2. **Scale** the propagated EXP map by the duration multiplier.
 * 3. **Mutate** player stats with the scaled increases.
 *
 * ## Call site
 * ```typescript
 * const result = calculateScaledProgression(
 *   { nodes: cdagStore.nodes, edges: cdagStore.edges },
 *   currentStats,
 *   { "ran 10km": 0.9, "read philosophy": 0.7 }, // from AI weightedActions
 *   "45m",                                         // or integer minutes
 * );
 * await persistPlayerStats(userId, result.nextStats);
 * ```
 *
 * @param topology      - CDAG snapshot: `{ nodes, edges }` from the CDAG store.
 * @param stats         - Current `PlayerStatistics` (read from Zustand / Firestore).
 * @param actionWeights - Map of `actionLabel → weight` produced by the AI analysis.
 *                        Weights are typically in `[0.0, 1.0]`.
 * @param duration      - Activity duration: integer minutes OR legacy string ("1h30m").
 *                        `undefined` defaults to `1.0×` (one EXP unit = 30 min).
 * @returns `ProgressionResult` containing updated stats and summary metrics.
 */
export const calculateScaledProgression = (
  topology: { nodes: Record<string, NodeData>; edges: Record<string, EdgeData> },
  stats: PlayerStatistics,
  actionWeights: Record<string, number>,
  duration?: number | string,
): ProgressionResult => {
  const propagated = calculateParentPropagation(
    topology.nodes,
    topology.edges,
    actionWeights,
  );

  const multiplier = parseDurationToMultiplier(duration);
  const scaledExpMap = scaleExperience(propagated, multiplier);

  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    stats,
    scaledExpMap,
  );

  return { nextStats, totalIncrease, levelsGained, nodeIncreases: scaledExpMap };
};

// ─── Lightweight preview pipeline ─────────────────────────────────────────

/**
 * Simplified progression pipeline that assigns equal EXP to every action label,
 * propagates through the CDAG, and returns the updated stats.
 *
 * Use this for the **optimistic preview** before AI results arrive, or in
 * situations where duration and weights are not available.
 *
 * Unlike `calculateScaledProgression`, this skips the duration-scaling step —
 * the raw `exp` value is used directly as the seed for each action.
 *
 * @param topology - CDAG snapshot: `{ nodes, edges }`.
 * @param stats    - Current `PlayerStatistics`.
 * @param actions  - List of action node IDs to seed (each receives `exp` EXP).
 * @param exp      - EXP seed per action node (default `1` = one EXP unit).
 * @returns `ProgressionResult` with plain propagated stats (no duration scaling).
 */
export const calculateDirectProgression = (
  topology: { nodes: Record<string, NodeData>; edges: Record<string, EdgeData> },
  stats: PlayerStatistics,
  actions: string[],
  exp: number = 1,
): ProgressionResult => {
  const initialSeeds: Record<string, number> = {};
  actions.forEach((a) => (initialSeeds[a] = exp));

  const propagated = calculateParentPropagation(
    topology.nodes,
    topology.edges,
    initialSeeds,
  );

  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    stats,
    propagated,
  );

  return { nextStats, totalIncrease, levelsGained, nodeIncreases: propagated };
};
