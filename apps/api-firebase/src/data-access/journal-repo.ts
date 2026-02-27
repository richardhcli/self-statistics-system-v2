/**
 * @file journal-repo.ts
 * @module api-firebase/data-access/journal-repo
 *
 * Firestore data-access layer for journal entries.
 *
 * Extracted from inline code in `functions/process-journal-entry.ts` and
 * `plugin-sdk/index.ts`. Every function takes `userId` as first parameter.
 */

import {db} from "../services/admin-init";
import {Timestamp} from "firebase-admin/firestore";

/**
 * Collection path template for journal entries.
 * @param {string} userId - Firestore user scope.
 * @return {string} Firestore collection path.
 */
const journalPath = (userId: string) =>
  `users/${userId}/journal_entries`;

/**
 * Create a new journal entry document.
 *
 * @param {string} userId - Firestore user scope.
 * @param {Record<string, unknown>} data - Full entry payload (rawText, analysis, graph, etc.).
 * @return {Promise<string>} The auto-generated document ID.
 */
export const createEntry = async (
  userId: string,
  data: Record<string, unknown>,
): Promise<string> => {
  const col = db.collection(journalPath(userId));
  const ref = col.doc();
  await ref.set({
    ...data,
    createdAt: data.createdAt ?? new Date().toISOString(),
    createdAtTimestamp: Timestamp.now(),
  });
  return ref.id;
};

/**
 * Fetch a journal entry by document ID.
 *
 * @param {string} userId - Firestore user scope.
 * @param {string} entryId - Journal document ID.
 * @return {Promise<Record<string, unknown>|null>} Document data or `null` if not found.
 */
export const getEntry = async (
  userId: string,
  entryId: string,
): Promise<Record<string, unknown> | null> => {
  const doc = await db.doc(`${journalPath(userId)}/${entryId}`).get();
  return doc.exists ? (doc.data() as Record<string, unknown>) : null;
};

/**
 * Merge-update an existing journal entry.
 *
 * @param {string} userId - Firestore user scope.
 * @param {string} entryId - Journal document ID.
 * @param {Record<string, unknown>} data - Partial fields to merge.
 * @return {Promise<void>}
 */
export const updateEntry = async (
  userId: string,
  entryId: string,
  data: Record<string, unknown>,
): Promise<void> => {
  await db
    .doc(`${journalPath(userId)}/${entryId}`)
    .set(data, {merge: true});
};
