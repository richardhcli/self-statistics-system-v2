import {Timestamp} from "firebase-admin/firestore";
import {db} from "../services/admin-init";
import {
  createEntry,
  getEntry,
  updateEntry,
} from "../data-access/journal-repo";
import {incrementExp, getRawStats} from "../data-access/user-repo";

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
 *
 * Delegates to `data-access/` repos for journal and user operations.
 * Job operations remain inline (not yet extracted to a repo).
 */
export class PluginSDK {
  private readonly userId: string;

  /**
   * Construct a plugin-scoped Firestore helper.
   * @param {string} userId user identifier scope
   */
  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Access journal entry CRUD operations scoped to the user.
   * Delegates to `data-access/journal-repo`.
   */
  get journal() {
    return {
      /**
       * Create a raw journal entry document.
      * @param {string} content raw journal text
      * @param {Record<string, unknown>} metadata optional metadata to merge
       */
      create: async (content: string, metadata: Record<string, unknown> = {}) => {
        return createEntry(this.userId, {content, metadata});
      },

      /**
       * Fetch a journal entry document by id.
      * @param {string} entryId journal document id
       */
      get: async (entryId: string) => {
        return getEntry(this.userId, entryId);
      },

      /**
       * Merge updates into an existing journal entry document.
      * @param {string} entryId journal document id
      * @param {Record<string, unknown>} data partial entry fields to merge
       */
      update: async (entryId: string, data: Record<string, unknown>) => {
        await updateEntry(this.userId, entryId, data);
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
        const ref = db.collection(`users/${this.userId}/jobs`).doc();

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
        const doc = await db
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

        await db
          .doc(`users/${this.userId}/jobs/${jobId}`)
          .update(update);
      },
    };
  }

  /**
   * Access gamification stats helpers scoped to the user.
   * Delegates to `data-access/user-repo`.
   */
  get user() {
    return {
      /**
       * Increment player experience points.
      * @param {number} deltaExp exp delta to apply
       */
      updateStats: async (deltaExp: number) => {
        await incrementExp(this.userId, deltaExp);
      },

      /**
       * Retrieve the current player statistics document.
       */
      getStats: async () => {
        return getRawStats(this.userId);
      },
    };
  }
}
