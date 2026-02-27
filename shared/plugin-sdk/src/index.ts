/**
 * @file index.ts
 * @module @self-stats/plugin-sdk
 *
 * Lightweight, isomorphic HTTP client for external integrations (Obsidian,
 * CLI tools, third-party apps) to call the Self Statistics REST API.
 *
 * Zero Firebase dependency — uses native `fetch` only.
 *
 * ## Quick start
 * ```ts
 * import { SelfStatsClient } from '@self-stats/plugin-sdk';
 *
 * const client = new SelfStatsClient({
 *   apiKey: 'sss_...',
 *   baseUrl: 'https://<region>-<project>.cloudfunctions.net',
 * });
 *
 * const result = await client.submitJournalEntry('Ran 5km this morning');
 * console.log(result.entryId, result.stats);
 * ```
 */

// ─── Configuration ─────────────────────────────────────────────────────────

/** Options used to construct a {@link SelfStatsClient}. */
export interface SelfStatsClientConfig {
  /** REST API key (format `sss_...`). Sent as the `x-api-key` header. */
  apiKey: string;
  /**
   * Base URL of the deployed Firebase Functions (no trailing slash).
   * Defaults to `""` (relative URLs), which works when the plugin is hosted
   * on the same origin.
   */
  baseUrl?: string;
}

// ─── Response types ────────────────────────────────────────────────────────

/** Shape returned by the `POST /apiRouter` journal endpoint on success. */
export interface JournalEntryResponse {
  success: boolean;
  entryId: string;
  graph: {nodeCount: number; edgeCount: number};
  stats: {
    totalIncrease: number;
    levelsGained: number;
    nextStats: Record<string, unknown>;
  };
}

/** Shape returned by the `POST /obsidianWebhook` endpoint on success. */
export interface WebhookResponse {
  success: boolean;
  entryId: string;
  graph: {nodeCount: number; edgeCount: number};
  stats: {
    totalIncrease: number;
    levelsGained: number;
    nextStats: Record<string, unknown>;
  };
}

/** Error payload returned by the REST API on failure. */
export interface ApiErrorResponse {
  error: string;
}

// ─── SDK Error ─────────────────────────────────────────────────────────────

/** Typed error thrown by {@link SelfStatsClient} when the API returns non-2xx. */
export class SelfStatsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorResponse,
  ) {
    super(`Self-Stats API error ${status}: ${body.error}`);
    this.name = "SelfStatsApiError";
  }
}

// ─── Client ────────────────────────────────────────────────────────────────

/**
 * Isomorphic REST client for the Self Statistics System API.
 *
 * All methods throw {@link SelfStatsApiError} on non-2xx responses.
 */
export class SelfStatsClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Create a new client.
   * @param {SelfStatsClientConfig} config Client configuration.
   */
  constructor(config: SelfStatsClientConfig) {
    if (!config.apiKey) {
      throw new Error("SelfStatsClient requires a non-empty apiKey");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? "").replace(/\/+$/, "");
  }

  // ── Journal ────────────────────────────────────────────────────────────

  /**
   * Submit a journal entry for AI analysis and progression processing.
   *
   * Calls `POST /apiRouter` with the raw text.
   *
   * @param {string} rawText The journal entry text to process.
   * @param {object} [options] Optional parameters.
   * @param {number} [options.timestamp] Unix-epoch timestamp override.
   * @return {Promise<JournalEntryResponse>} Processed entry result.
   */
  async submitJournalEntry(
    rawText: string,
    options?: {timestamp?: number},
  ): Promise<JournalEntryResponse> {
    return this.post<JournalEntryResponse>("/apiRouter", {
      rawText,
      ...(options?.timestamp != null ? {timestamp: options.timestamp} : {}),
    });
  }

  // ── Obsidian Webhook ───────────────────────────────────────────────────

  /**
   * Submit content via the Obsidian-specific webhook endpoint.
   *
   * Calls `POST /obsidianWebhook` with content and optional duration.
   *
   * @param {string} content Note content from Obsidian.
   * @param {object} [options] Optional parameters.
   * @param {number} [options.duration] Duration in minutes.
   * @return {Promise<WebhookResponse>} Processed webhook result.
   */
  async submitObsidianNote(
    content: string,
    options?: {duration?: number},
  ): Promise<WebhookResponse> {
    return this.post<WebhookResponse>("/obsidianWebhook", {
      content,
      ...(options?.duration != null ? {duration: options.duration} : {}),
    });
  }

  // ── Internal helpers ───────────────────────────────────────────────────

  /**
   * Send an authenticated POST request.
   *
   * @param {string} path URL path relative to baseUrl.
   * @param {unknown} body JSON body payload.
   * @return {Promise<T>} Parsed JSON response.
   * @template T
   */
  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorBody: ApiErrorResponse;
      try {
        errorBody = (await response.json()) as ApiErrorResponse;
      } catch {
        errorBody = {error: response.statusText || "Unknown error"};
      }
      throw new SelfStatsApiError(response.status, errorBody);
    }

    return (await response.json()) as T;
  }
}
