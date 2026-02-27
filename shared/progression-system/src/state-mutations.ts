/**
 * @file state-mutations.ts
 * @module @self-stats/progression-system/state-mutations
 *
 * Progression State Mutations — Pure Immutable EXP/Level Updater
 *
 * ## Responsibility
 * This module owns the single operation of applying a batch of EXP increases
 * to a `PlayerStatistics` map and returning the next immutable state.
 *
 * It does NOT touch Zustand, Firestore, React, or any store — it is a pure
 * function that can be called identically in the browser or Cloud Functions.
 *
 * ## Usage by AI agents
 * ```typescript
 * const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
 *   currentStats,
 *   { "Intellect": 0.45, "coded": 0.9, "progression": 0.3 },
 * );
 * // Persist nextStats to Firestore / Zustand
 * ```
 */

import { getLevelForExp, roundExp } from './formulas.js';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * EXP and level state for a single CDAG node.
 *
 * Both fields are stored together so that the level is always consistent
 * with the experience through `getLevelForExp(experience)`.
 * Do NOT manually set `level` — always derive it from `experience` via
 * the formula to avoid drift.
 */
export interface NodeStats {
  /**
   * Cumulative EXP accumulated on this node across all journal entries.
   * Rounded to `EXP_PRECISION` decimal places.
   * Starts at `0` and grows monotonically (EXP is never removed).
   */
  experience: number;
  /**
   * Current level derived from `experience` via the logarithmic curve:
   * `level = floor(log2(experience + 1))`.
   * Cached here to avoid recomputing on every render.
   * Always consistent with `experience` after `updatePlayerStatsState` runs.
   */
  level: number;
}

/**
 * The player's full statistics map — the runtime state powering every
 * statistics view in the app.
 *
 * Maps CDAG node IDs (e.g. `"Intellect"`, `"coded"`, `"progression"`) to
 * their accumulated `NodeStats`.
 *
 * The canonical Firestore schema for this type is `PlayerStatisticsDoc.stats`
 * from `@self-stats/contracts`.
 *
 * @example
 * ```typescript
 * const stats: PlayerStatistics = {
 *   "progression":  { experience: 12.4, level: 3 },
 *   "Intellect":    { experience: 8.1,  level: 3 },
 *   "coded":        { experience: 5.7,  level: 2 },
 * };
 * ```
 */
export type PlayerStatistics = Record<string, NodeStats>;

// ─── Mutation ──────────────────────────────────────────────────────────────

/**
 * Apply a batch of EXP increases to the current `PlayerStatistics` and return
 * the next immutable state alongside summary metrics.
 *
 * Nodes that receive `0` or negative EXP are silently skipped.
 * New nodes (not yet in `currentStats`) are initialised at `{ experience: 0, level: 0 }`
 * before the increase is applied.
 *
 * @param currentStats  - Snapshot of the player's current statistics (unchanged).
 * @param expIncreases  - Map of `nodeId → expAmount` to add.
 *                        Produced by `scaleExperience(propagated, multiplier)`.
 * @returns
 *   - `nextStats`     — New `PlayerStatistics` with all increases applied.
 *   - `totalIncrease` — Sum of all positive EXP changes (rounded).
 *   - `levelsGained`  — Total number of level-ups across all nodes in this update.
 */
export const updatePlayerStatsState = (
  currentStats: PlayerStatistics,
  expIncreases: Record<string, number>,
): { nextStats: PlayerStatistics; totalIncrease: number; levelsGained: number } => {
  const nextStats: PlayerStatistics = { ...currentStats };
  let totalIncrease = 0;
  let levelsGained = 0;

  Object.entries(expIncreases).forEach(([label, amount]) => {
    if (amount <= 0) return;

    totalIncrease += amount;

    const node: NodeStats = nextStats[label] || { experience: 0, level: 0 };
    const nextExp = roundExp(node.experience + amount);
    const nextLevel = getLevelForExp(nextExp);

    if (nextLevel > node.level) {
      levelsGained += nextLevel - node.level;
    }

    nextStats[label] = { experience: nextExp, level: nextLevel };
  });

  return { nextStats, totalIncrease: roundExp(totalIncrease), levelsGained };
};
