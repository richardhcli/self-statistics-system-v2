import * as admin from 'firebase-admin';

/**
 * Allowed job lifecycle states.
 */
type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

/**
 * Persisted shape of a job document under users/{uid}/jobs/{jobId}.
 */
interface JobRecord {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  createdAt: admin.firestore.FieldValue;
  updatedAt?: admin.firestore.FieldValue;
  result: Record<string, unknown> | null;
  errors: string[];
}

/**
 * A constrained Firestore access layer for plugins.
 * Ensures every operation is scoped to a single user and known collections.
 */
export class PluginSDK {
  private readonly userId: string;
  private readonly db: admin.firestore.Firestore;

  constructor(userId: string) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.userId = userId;
    this.db = admin.firestore();
  }

  /**
   * Access journal entry CRUD operations scoped to the user.
   */
  get journal() {
    return {
      /** Create a raw journal entry document. */
      create: async (content: string, metadata: Record<string, unknown> = {}) => {
        const ref = this.db
          .collection(`users/${this.userId}/journal_entries`)
          .doc();

        const entry = {
          id: ref.id,
          content,
          metadata,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAtIso: new Date().toISOString(),
        };

        await ref.set(entry);
        return ref.id;
      },

      /** Fetch a journal entry document by id. */
      get: async (entryId: string) => {
        const doc = await this.db
          .doc(`users/${this.userId}/journal_entries/${entryId}`)
          .get();

        return doc.exists ? doc.data() : null;
      },

      /** Merge updates into an existing journal entry document. */
      update: async (entryId: string, data: Record<string, unknown>) => {
        await this.db
          .doc(`users/${this.userId}/journal_entries/${entryId}`)
          .set(data, { merge: true });
      },
    };
  }

  /**
   * Access job lifecycle helpers scoped to the user.
   */
  get jobs() {
    return {
      /** Create a queued job. */
      create: async (type: string, payload: Record<string, unknown>) => {
        const ref = this.db.collection(`users/${this.userId}/jobs`).doc();

        const job: JobRecord = {
          id: ref.id,
          type,
          payload,
          status: 'queued',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          result: null,
          errors: [],
        };

        await ref.set(job);
        return ref.id;
      },

      /** Fetch a job by id. */
      get: async (jobId: string) => {
        const doc = await this.db
          .doc(`users/${this.userId}/jobs/${jobId}`)
          .get();

        return doc.exists ? doc.data() : null;
      },

      /** Update a job's status and optional result payload. */
      updateStatus: async (
        jobId: string,
        status: JobStatus,
        result: Record<string, unknown> | null = null,
      ) => {
        const update: Partial<JobRecord> = {
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (result) {
          update.result = result;
        }

        await this.db
          .doc(`users/${this.userId}/jobs/${jobId}`)
          .update(update);
      },
    };
  }

  /**
   * Access gamification stats helpers scoped to the user.
   */
  get user() {
    return {
      /**
       * Increment player experience points.
       */
      updateStats: async (deltaExp: number) => {
        const ref = this.db.doc(`users/${this.userId}/user_information/player_statistics`);

        await this.db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ref);
          const currentExp = (snapshot.data()?.exp as number | undefined) ?? 0;

          transaction.set(ref, { exp: currentExp + deltaExp }, { merge: true });
        });
      },

      /**
       * Retrieve the current player statistics document.
       */
      getStats: async () => {
        const doc = await this.db
          .doc(`users/${this.userId}/user_information/player_statistics`)
          .get();

        return doc.exists ? doc.data() : null;
      },
    };
  }
}
