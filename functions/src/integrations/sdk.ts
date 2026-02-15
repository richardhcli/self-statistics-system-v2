import * as admin from 'firebase-admin';

// Initialize the "Admin" app (gives full read/write access)
admin.initializeApp();
const db = admin.firestore();

export class IntegrationSDK {
  // Helpers to write to Journal
  journal = {
    async createEntry(userId: string, text: string, tags: string[]) {
      await db.collection(`users/${userId}/journal`).add({
        content: text,
        tags,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processed: true // Mark as processed so we don't trigger loops
      });
    }
  };

  // Helpers to write to Statistics
  stats = {
    async updateExp(userId: string, nodeId: string, amount: number) {
      const ref = db.doc(`users/${userId}/stats/${nodeId}`);
      await ref.set({ 
        exp: admin.firestore.FieldValue.increment(amount) 
      }, { merge: true });
    }
  };
}