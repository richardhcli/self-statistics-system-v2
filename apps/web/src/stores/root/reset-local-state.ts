/**
 * Local state reset utility.
 * Clears persisted IndexedDB caches and resets in-memory stores.
 */

import { clearAllPersistedData } from "./persist-middleware";
import { clearAllTables } from "./db";
import { deserializeRootState, INITIAL_ROOT_STATE } from ".";

/**
 * Clears all local persisted state and restores initial in-memory defaults.
 */
export const resetLocalStateToInitial = async (): Promise<void> => {
  await clearAllPersistedData();

  try {
    await clearAllTables();
  } catch (error) {
    console.warn("[LocalReset] Failed to clear root state table", error);
  }

  deserializeRootState(INITIAL_ROOT_STATE);
};
