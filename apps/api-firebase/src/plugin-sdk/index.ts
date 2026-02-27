import {Timestamp} from "firebase-admin/firestore";
import {db} from "../services/admin-init";
import type {Firestore} from "firebase-admin/firestore";

const serverTimestamp = (): Timestamp => Timestamp.now();

/**
 * Allowed job lifecycle states.
 */
type JobStatus = "queued" | "processing" | "completed" | "failed";

/**
 * Persisted shape of a job document under users/{uid}/jobs/{jobId}.
 */
interface JobRecord {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  result: Record<string, unknown> | null;
  errors: string[];
}

/**
 * A constrained Firestore access layer for plugins.
 * Ensures every operation is scoped to a single user and known collections.
 */
export class PluginSDK {
  private readonly userId: string;
  private readonly db: Firestore;

  /**
   * Construct a plugin-scoped Firestore helper.
   * @param {string} userId user identifier scope
   */
  constructor(userId: string) {
    this.userId = userId;
    this.db = db;
  }

  /**
   * Access journal entry CRUD operations scoped to the user.
   */
  get journal() {
    return {
      /**
       * Create a raw journal entry document.
      * @param {string} content raw journal text
      * @param {Record<string, unknown>} metadata optional metadata to merge
       */
      create: async (content: string, metadata: Record<string, unknown> = {}) => {
        const ref = this.db
          .collection(`users/${this.userId}/journal_entries`)
          .doc();

        const entry = {
          id: ref.id,
          content,
          metadata,
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString(),
        };

        await ref.set(entry);
        return ref.id;
      },

      /**
       * Fetch a journal entry document by id.
      * @param {string} entryId journal document id
       */
      get: async (entryId: string) => {
        const doc = await this.db
          .doc(`users/${this.userId}/journal_entries/${entryId}`)
          .get();

        return doc.exists ? doc.data() : null;
      },

      /**
       * Merge updates into an existing journal entry document.
      * @param {string} entryId journal document id
      * @param {Record<string, unknown>} data partial entry fields to merge
       */
      update: async (entryId: string, data: Record<string, unknown>) => {
        await this.db
          .doc(`users/${this.userId}/journal_entries/${entryId}`)
          .set(data, {merge: true});
      },
    };
  }

  /**
   * Access job lifecycle helpers scoped to the user.
   */
  get jobs() {
    return {
      /**
       * Create a queued job.
      * @param {string} type job type identifier
      * @param {Record<string, unknown>} payload job payload
       */
      create: async (type: string, payload: Record<string, unknown>) => {
        const ref = this.db.collection(`users/${this.userId}/jobs`).doc();

        const job: JobRecord = {
          id: ref.id,
          type,
          payload,
          status: "queued",
          createdAt: serverTimestamp(),
          result: null,
          errors: [],
        };

        await ref.set(job);
        return ref.id;
      },

      /**
       * Fetch a job by id.
      * @param {string} jobId job document id
       */
      get: async (jobId: string) => {
        const doc = await this.db
          .doc(`users/${this.userId}/jobs/${jobId}`)
          .get();

        return doc.exists ? doc.data() : null;
      },

      /**
       * Update a job's status and optional result payload.
      * @param {string} jobId job document id
      * @param {JobStatus} status new job status
      * @param {Record<string, unknown>|null} result optional result payload
       */
      updateStatus: async (
        jobId: string,
        status: JobStatus,
        result: Record<string, unknown> | null = null,
      ) => {
        const update: Partial<JobRecord> = {
          status,
          updatedAt: serverTimestamp(),
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
      /**
       * Increment player experience points.
      * @param {number} deltaExp exp delta to apply
       */
      updateStats: async (deltaExp: number) => {
        const ref = this.db.doc(`users/${this.userId}/user_information/player_statistics`);

        await this.db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ref);
          const currentExp = (snapshot.data()?.exp as number | undefined) ?? 0;

          transaction.set(ref, {exp: currentExp + deltaExp}, {merge: true});
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
