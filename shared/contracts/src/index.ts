/**
 * @file index.ts
 * @module @self-stats/contracts
 *
 * Public API barrel for the `@self-stats/contracts` shared package.
 *
 * ## What this package exports
 * - **graph**: Core CDAG node/edge types, `GraphState`, and CDAG cache/store types.
 * - **topology**: AI payload contracts (`TextToActionResponse`, `WeightedAction`, `GeneralizationLink`).
 * - **firestore**: Firestore document schemas (`UserProfile`, `PlayerStatisticsDoc`, settings, etc.).
 *
 * ## Usage
 * ```typescript
 * import type { NodeData, GraphState, TextToActionResponse } from '@self-stats/contracts';
 * ```
 *
 * This package has **zero runtime dependencies** — it is pure TypeScript interfaces
 * and should remain so.  Do NOT add utility functions or SDK imports here.
 *
 * @packageDocumentation
 */

export * from './graph.js';
export * from './topology.js';
export * from './firestore.js';
