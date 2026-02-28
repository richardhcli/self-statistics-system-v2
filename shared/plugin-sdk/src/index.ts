/**
 * @file index.ts
 * @module @self-stats/plugin-sdk
 *
 * Entry point for the universal client-side SDK that authenticates via
 * Firebase Custom Tokens (Bearer ID tokens) instead of legacy API keys.
 */

export type {StorageAdapter, SelfStatsConfig} from "./client";
export {SelfStatsClient} from "./client";
