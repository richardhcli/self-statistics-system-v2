/**
 * @file index.ts
 * @module @self-stats/progression-system
 *
 * Public API barrel for the `@self-stats/progression-system` shared package.
 *
 * ## What this package provides
 * All pure math for the RPG-style progression model:
 *
 * | Module            | Exports                                               |
 * |-------------------|-------------------------------------------------------|
 * | `constants`       | `CORE_ATTRIBUTES`, `PROGRESSION_ROOT_ID`, tuning knobs |
 * | `engine`          | `calculateParentPropagation` (PWCA BFS)               |
 * | `formulas`        | `getLevelForExp`, `getExpProgress`, `scaleExperience` |
 * | `state-mutations` | `updatePlayerStatsState`, `NodeStats`, `PlayerStatistics` |
 * | `orchestrator`    | `calculateScaledProgression`, `calculateDirectProgression` |
 *
 * ## Typical import pattern
 * ```typescript
 * // High-level: use the orchestrators
 * import { calculateScaledProgression } from '@self-stats/progression-system';
 *
 * // Low-level: compose manually
 * import {
 *   calculateParentPropagation,
 *   scaleExperience,
 *   updatePlayerStatsState,
 * } from '@self-stats/progression-system';
 * ```
 *
 * ## Dependencies
 * - `@self-stats/contracts` (peer workspace dependency — CDAG graph types)
 * - No React, no Firebase SDK, no browser globals.
 *
 * @packageDocumentation
 */

export {
  COGNITIVE_TEMPERATURE,
  PROGRESSION_ROOT_ID,
  BASE_EXP_UNIT,
  MINUTES_PER_EXP_UNIT,
  EXP_PRECISION,
  CORE_ATTRIBUTES,
  ATTRIBUTE_ICONS,
  ATTRIBUTE_DESCRIPTIONS,
  type CoreAttribute,
} from './constants.js';

export { calculateParentPropagation } from './engine.js';

export {
  roundExp,
  parseDurationToMultiplier,
  scaleExperience,
  getLevelForExp,
  getExpProgress,
  getExpForLevel,
} from './formulas.js';

export {
  updatePlayerStatsState,
  type NodeStats,
  type PlayerStatistics,
} from './state-mutations.js';

export { calculateScaledProgression, calculateDirectProgression } from './orchestrator.js';

