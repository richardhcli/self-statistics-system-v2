
/**
 * Types for the Integration feature.
 * Canonical definitions live in @self-stats/contracts.
 * Re-exported here for backward-compatible imports within apps/web.
 */

export type {
  IntegrationLog,
  IntegrationConfig,
  ObsidianConfig,
  IntegrationSettings,
} from '@self-stats/contracts';

/**
 * Zustand store type for the integration state slice.
 * Structurally equivalent to {@link IntegrationSettings}.
 */
export type { IntegrationSettings as IntegrationStore } from '@self-stats/contracts';
