import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Legacy integration helpers for webhook-compatible clients.
 * These are kept minimal for backward compatibility while the new plugin SDK is adopted.
 */
export class IntegrationSDK {
  /**
   * Journal helpers.
   */
  journal = {
    /**
     * Create a journal entry with basic metadata.
    * @param {string} userId user identifier
    * @param {string} text entry content
    * @param {string[]} tags list of tag strings
     */
    async createEntry(userId: string, text: string, tags: string[]): Promise<void> {
      await db.collection(`users/${userId}/journal`).add({
        content: text,
        tags,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processed: true,
      });
    },
  };

  /**
   * Statistics helpers.
   */
  stats = {
    /**
     * Increment EXP for a specific node.
    * @param {string} userId user identifier
    * @param {string} nodeId stat node identifier
    * @param {number} amount exp delta to increment
     */
    async updateExp(userId: string, nodeId: string, amount: number): Promise<void> {
      const ref = db.doc(`users/${userId}/stats/${nodeId}`);
      await ref.set({
        exp: admin.firestore.FieldValue.increment(amount),
      }, {merge: true});
    },
  };
}
