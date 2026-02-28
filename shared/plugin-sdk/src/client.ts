/**
 * Universal client for Self Statistics using Firebase Custom Token auth.
 * Works in Node, Obsidian, and browsers with pluggable storage.
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

type FetchLike = (
  input: string | URL,
  init?: {method?: string; headers?: Record<string, string>; body?: unknown},
) => Promise<FetchResponse>;

interface FetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}

export interface SelfStatsConfig {
  /** Firebase project ID (used for cache key isolation). */
  projectId: string;
  /** Web API key from Firebase project settings. */
  apiKey: string;
  /** Base URL for callable/REST functions, no trailing slash. */
  backendUrl: string;
  /** Optional custom storage implementation; defaults to in-memory. */
  storage?: StorageAdapter;
  /** Optional fetch implementation for environments without global fetch. */
  fetch?: FetchLike;
}

export interface SubmitJournalOptions {
  timestamp?: number;
}

export interface SubmitObsidianOptions {
  duration?: number;
}

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

export interface TokenBundle {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // epoch seconds
}

export class SelfStatsAuthError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "SelfStatsAuthError";
  }
}

export class SelfStatsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "SelfStatsApiError";
  }
}

class MemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

export class SelfStatsClient {
  private readonly apiKey: string;
  private readonly backendUrl: string;
  private readonly storage: StorageAdapter;
  private readonly fetchImpl: FetchLike;
  private readonly cacheKey: string;

  constructor(private readonly config: SelfStatsConfig) {
    if (!config.projectId) throw new Error("projectId is required");
    if (!config.apiKey) throw new Error("apiKey is required");
    if (!config.backendUrl) throw new Error("backendUrl is required");
    this.apiKey = config.apiKey;
    this.backendUrl = config.backendUrl.replace(/\/+$/, "");
    this.storage = config.storage ?? new MemoryStorage();
    const globalFetch = (globalThis as any).fetch as FetchLike | undefined;
    this.fetchImpl = config.fetch ?? globalFetch;
    this.cacheKey = `selfstats:${config.projectId}:tokens`;
    if (!this.fetchImpl) throw new Error("fetch is not available; provide one in config");
  }

  async exchangeCustomToken(customToken: string): Promise<TokenBundle> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${this.apiKey}`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({token: customToken, returnSecureToken: true}),
    });

    if (!res.ok) {
      const body = await safeJson(res);
      throw new SelfStatsAuthError("Failed to exchange custom token", res.status);
    }

    const data = (await res.json()) as {
      idToken: string;
      refreshToken: string;
    };

    const expiresAt = decodeExpiry(data.idToken);
    const bundle: TokenBundle = {
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt,
    };
    await this.saveTokens(bundle);
    return bundle;
  }

  async submitJournalEntry(
    rawText: string,
    options?: SubmitJournalOptions,
  ): Promise<JournalEntryResponse> {
    const token = await this.ensureIdToken();
    return this.authedPost<JournalEntryResponse>(`${this.backendUrl}/apiRouter`, token, {
      rawText,
      ...(options?.timestamp != null ? {timestamp: options.timestamp} : {}),
    });
  }

  async submitObsidianNote(
    content: string,
    options?: SubmitObsidianOptions,
  ): Promise<WebhookResponse> {
    const token = await this.ensureIdToken();
    return this.authedPost<WebhookResponse>(`${this.backendUrl}/obsidianWebhook`, token, {
      content,
      ...(options?.duration != null ? {duration: options.duration} : {}),
    });
  }

  async signOut(): Promise<void> {
    await this.storage.removeItem(this.cacheKey);
  }

  private async ensureIdToken(): Promise<string> {
    const cached = await this.getTokens();
    const now = Math.floor(Date.now() / 1000);

    if (cached && cached.expiresAt - now > 60) {
      return cached.idToken;
    }

    if (cached?.refreshToken) {
      const refreshed = await this.refreshIdToken(cached.refreshToken);
      await this.saveTokens(refreshed);
      return refreshed.idToken;
    }

    throw new SelfStatsAuthError("No valid token; call exchangeCustomToken first");
  }

  private async refreshIdToken(refreshToken: string): Promise<TokenBundle> {
    const url = `https://securetoken.googleapis.com/v1/token?key=${this.apiKey}`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({grant_type: "refresh_token", refresh_token: refreshToken}).toString(),
    });

    if (!res.ok) {
      await this.storage.removeItem(this.cacheKey);
      throw new SelfStatsAuthError("Failed to refresh ID token", res.status);
    }

    const data = (await res.json()) as {
      id_token: string;
      refresh_token: string;
      expires_in: string;
    };

    const expiresAt = Math.floor(Date.now() / 1000) + Number(data.expires_in);
    return {
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
  }

  private async getTokens(): Promise<TokenBundle | null> {
    const raw = await this.storage.getItem(this.cacheKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TokenBundle;
    } catch {
      return null;
    }
  }

  private async saveTokens(tokens: TokenBundle): Promise<void> {
    await this.storage.setItem(this.cacheKey, JSON.stringify(tokens));
  }

  private async authedPost<T>(url: string, idToken: string, body: unknown): Promise<T> {
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const payload = await safeJson(res);
      throw new SelfStatsApiError(`Request failed: ${res.status}`, res.status, payload);
    }

    return (await res.json()) as T;
  }
}

async function safeJson(res: FetchResponse): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function decodeExpiry(idToken: string): number {
  const [, payload] = idToken.split(".");
  if (!payload) return Math.floor(Date.now() / 1000) + 45 * 60;
  try {
    const json = base64UrlDecode(payload);
    const decoded = JSON.parse(json);
    if (typeof decoded.exp === "number") return decoded.exp;
  } catch {
    // ignore
  }
  return Math.floor(Date.now() / 1000) + 45 * 60;
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const nodeBuffer = (globalThis as any).Buffer;
  if (nodeBuffer) {
    return nodeBuffer.from(normalized, "base64").toString("utf8");
  }
  const atobGlobal = (globalThis as any).atob as ((data: string) => string) | undefined;
  if (atobGlobal) {
    return atobGlobal(normalized);
  }
  throw new Error("No base64 decoder available in this environment");
}
