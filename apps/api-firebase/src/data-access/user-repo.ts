/**
 * @file user-repo.ts
 * @module api-firebase/data-access/user-repo
 *
 * Firestore data-access layer for user player statistics.
 *
 * Extracted from inline helpers in `functions/process-journal-entry.ts`.
 * Every function takes `userId` as first parameter and imports `db` from
 * `services/admin-init`.
 */

import {db} from "../services/admin-init";
import {type PlayerStatistics} from "@self-stats/progression-system";

/**
 * Path template for the player statistics document.
 * @param {string} userId - Firestore user scope.
 * @return {string} Firestore document path.
 */
const statsPath = (userId: string) =>
  `users/${userId}/user_information/player_statistics`;

/** Default stats for a brand-new user. */
const DEFAULT_STATS: PlayerStatistics = {progression: {experience: 0, level: 1}};

/**
 * Load the current `PlayerStatistics` for a user.
 *
 * @param {string} userId - Firestore user scope.
 * @return {Promise<PlayerStatistics>} Existing stats or `DEFAULT_STATS` if none found.
 */
export const loadPlayerStats = async (
  userId: string,
): Promise<PlayerStatistics> => {
  const ref = db.doc(statsPath(userId));
  const snapshot = await ref.get();
  const data = snapshot.data() as {stats?: PlayerStatistics} | undefined;
  return data?.stats ?? DEFAULT_STATS;
};

/**
 * Persist (merge) updated `PlayerStatistics` for a user.
 *
 * @param {string} userId - Firestore user scope.
 * @param {PlayerStatistics} stats - Full stats object to write.
 * @return {Promise<void>}
 */
export const persistPlayerStats = async (
  userId: string,
  stats: PlayerStatistics,
): Promise<void> => {
  const ref = db.doc(statsPath(userId));
  await ref.set({stats, updatedAt: new Date().toISOString()}, {merge: true});
};

/**
 * Atomically increment a user's raw experience points.
 * Used by the legacy `PluginSDK.user.updateStats()` path.
 *
 * @param {string} userId - Firestore user scope.
 * @param {number} deltaExp - EXP delta to apply.
 * @return {Promise<void>}
 */
export const incrementExp = async (
  userId: string,
  deltaExp: number,
): Promise<void> => {
  const ref = db.doc(statsPath(userId));

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const currentExp =
      (snapshot.data()?.exp as number | undefined) ?? 0;
    transaction.set(ref, {exp: currentExp + deltaExp}, {merge: true});
  });
};

/**
 * Retrieve the raw player statistics document data.
 *
 * @param {string} userId - Firestore user scope.
 * @return {Promise<Record<string, unknown>|null>} Document data or `null` if not found.
 */
export const getRawStats = async (
  userId: string,
): Promise<Record<string, unknown> | null> => {
  const doc = await db.doc(statsPath(userId)).get();
  return doc.exists ? (doc.data() as Record<string, unknown>) : null;
};
