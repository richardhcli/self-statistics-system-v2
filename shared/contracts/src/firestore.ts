/**
 * @file firestore.ts
 * @module @self-stats/contracts/firestore
 *
 * Firestore document schema contracts shared across the React frontend
 * (`apps/web`) and the Firebase backend (`apps/api-firebase`).
 *
 * ## Design principle — SDK-free
 * This file deliberately avoids importing `firebase/firestore` or `firebase-admin`
 * so that it remains tree-shakable and usable in non-Firebase environments
 * (unit tests, Storybook, etc.).  Firebase-specific types (`Timestamp`,
 * `FieldValue`) are replaced with structural aliases defined below.
 *
 * ## Firestore document paths (for AI agents)
 * ```
 * users/{uid}/                            — UserProfile
 * users/{uid}/user_information/player_statistics — PlayerStatisticsDoc
 * users/{uid}/account_configuration/{type}       — per AccountConfigType
 * ```
 *
 * When reading a document, cast `snapshot.data()` to the corresponding interface.
 * When writing, pass the typed object to `set()` / `update()`.
 */

// ─── SDK-free type aliases ─────────────────────────────────────────────────

/**
 * Accepts any Firestore-compatible timestamp representation so that this
 * package does not need to depend on the Firebase SDK.
 *
 * Consumers with access to the Firebase SDK should use `Timestamp` directly;
 * consumers without it can use `Date`, ISO string, or epoch millis.
 */
export type TimestampLike =
  | { toDate(): Date }
  | { seconds: number; nanoseconds: number }
  | Date
  | string
  | number;

/**
 * Placeholder for Firestore `FieldValue` sentinel objects (e.g. `serverTimestamp()`).
 * Typed as `unknown` here to avoid SDK coupling.
 * Replace with the real `FieldValue` type at call sites that have SDK access.
 */
export type FieldValueLike = unknown;

// ─── User profile ──────────────────────────────────────────────────────────

/**
 * Top-level user document stored at `users/{uid}`.
 * Created on first login by the authentication service.
 */
export interface UserProfile {
  /** Firebase Authentication UID — also the Firestore document ID. */
  uid: string;
  /** User's chosen display name shown across the UI. */
  displayName: string;
  /** Primary email address (from Firebase Auth provider). */
  email: string;
  /** Absolute URL of the user's profile photo (may be empty string). */
  photoURL: string;
  /** Server-set creation timestamp. Use `FieldValue.serverTimestamp()` on first write. */
  createdAt: TimestampLike | FieldValueLike;
  /** Server-set update timestamp. Refreshed on every profile modification. */
  lastUpdated: TimestampLike | FieldValueLike;
}

// ─── Account configuration sub-documents ─────────────────────────────────

/**
 * LLM / AI provider settings used by the Gemini / OpenAI service layer.
 * Stored at `users/{uid}/account_configuration/ai_settings`.
 */
export interface AISettings {
  /** Which AI provider to use for all AI-powered features. */
  provider: 'gemini' | 'openai';
  /** Per-task model name overrides. */
  model: {
    /** Speech-to-text / voice transcription model identifier (e.g. "whisper-1"). */
    voiceTranscriptionModel: string;
    /** Text abstraction / topology-generation model (e.g. "gemini-2.0-flash"). */
    abstractionModel: string;
  };
  /**
   * Sampling temperature for generation requests (0.0 = deterministic).
   * The topology pipeline overrides this with `COGNITIVE_TEMPERATURE = 0.0`
   * from `@self-stats/progression-system` to ensure reproducible results.
   */
  temperature: number;
  /** Hard cap on generated token length per request. */
  maxTokens: number;
  /**
   * User-supplied API key stored client-side (localStorage / secure store).
   * NEVER write this field to Firestore — keep it in memory only.
   */
  apiKey?: string;
}

/**
 * Visual and behavioural preferences for the React frontend.
 * Stored at `users/{uid}/account_configuration/ui_preferences`.
 */
export interface UIPreferences {
  /** Colour scheme preference. Drives the `dark` Tailwind class on `<html>`. */
  theme: 'light' | 'dark';
  /** BCP-47 language tag (e.g. "en", "fr-CA"). Not yet fully implemented. */
  language: string;
  /** Whether cumulative EXP totals are shown alongside per-session gains. */
  showCumulativeExp: boolean;
  /** Whether numeric mastery levels are shown on skill cards. */
  showMasteryLevels: boolean;
  /** Whether the most-recent action name is displayed in a badge on skill cards. */
  showRecentAction: boolean;
  /** Whether EXP progress bars animate when stats update. */
  animateProgressBars: boolean;
}

/**
 * Data privacy and access control settings.
 * Stored at `users/{uid}/account_configuration/privacy`.
 */
export interface PrivacySettings {
  /** Whether journal entries are encrypted client-side before being stored. */
  encryptionEnabled: boolean;
  /** Data visibility scope (currently for future social / team features). */
  visibilityMode: 'private' | 'team' | 'public';
  /** Whether biometric unlock (Face ID / fingerprint) is enabled on mobile. */
  biometricUnlock: boolean;
}

// ─── Integration types ─────────────────────────────────────────────────────

/**
 * Single webhook / integration event log entry.
 * Stored in the `logs` array of `IntegrationSettings`.
 */
export interface IntegrationLog {
  /** Unique log entry identifier (UUID-like). */
  id: string;
  /** ISO 8601 timestamp of when the event was recorded. */
  timestamp: string;
  /** Name of the integration event (e.g. "obsidian.export", "webhook.trigger"). */
  eventName: string;
  /** Raw request payload sent to the integration endpoint. */
  payload: unknown;
  /** Current processing state of this event. */
  status: 'pending' | 'success' | 'error';
  /** Raw response body returned by the integration endpoint (if any). */
  response?: string;
}

/**
 * Outbound webhook configuration (generic HTTP integration).
 */
export interface IntegrationConfig {
  /** Full HTTPS URL of the webhook receiver. */
  webhookUrl: string;
  /** Master switch — when `false` no outbound requests are made. */
  enabled: boolean;
  /** HMAC or Bearer token sent as `Authorization` header (optional). */
  secret?: string;
}

/**
 * Obsidian Local REST API integration settings.
 * Requires the "Local REST API" community plugin to be installed in Obsidian.
 */
export interface ObsidianConfig {
  /** Whether the Obsidian sync integration is active. */
  enabled: boolean;
  /** Hostname of the machine running Obsidian (e.g. "localhost"). */
  host: string;
  /** Port on which the Obsidian REST API is listening (e.g. "27123"). */
  port: string;
  /** API key configured in the Obsidian Local REST API plugin. */
  apiKey: string;
  /** Whether to use `https://` instead of `http://` when connecting. */
  useHttps: boolean;
  /** Vault-relative folder path where exported notes are written (e.g. "Journal"). */
  targetFolder: string;
}

/**
 * Bundled integration settings document.
 * Stored at `users/{uid}/account_configuration/integrations`.
 */
export interface IntegrationSettings {
  /** Generic outbound webhook config. */
  config: IntegrationConfig;
  /** Obsidian Local REST API config. */
  obsidianConfig: ObsidianConfig;
  /** Append-only log of integration events — capped by the UI after N entries. */
  logs: IntegrationLog[];
}

/**
 * Push / in-app notification preferences.
 * Stored at `users/{uid}/account_configuration/notifications`.
 */
export interface NotificationSettings {
  /** Whether browser push notifications are enabled for streak reminders. */
  pushEnabled: boolean;
  /** Whether a weekly progress summary notification is sent. */
  weeklySummaryEnabled: boolean;
  /** Whether an immediate feedback notification fires after each journal entry. */
  instantFeedbackEnabled: boolean;
}

/**
 * Billing / subscription plan information.
 * Stored at `users/{uid}/account_configuration/billing_settings`.
 */
export interface BillingSettings {
  /** Current subscription tier. `'free'` has usage caps; `'pro'` is unlimited. */
  plan: 'free' | 'pro' | 'enterprise';
  /** Stripe subscription lifecycle state. Uses American spelling per Stripe API. */
  status: 'active' | 'paused' | 'past_due' | 'canceled';
  /** ISO 8601 or Firestore Timestamp of the upcoming billing cycle date. */
  nextBillingDate?: TimestampLike | FieldValueLike;
}

/**
 * Union of all document type identifiers stored under
 * `users/{uid}/account_configuration/{type}`.
 * Used to build typed Firestore path helpers.
 */
export type AccountConfigType =
  | 'ai_settings'
  | 'ui_preferences'
  | 'privacy'
  | 'notifications'
  | 'integrations'
  | 'billing_settings';

/**
 * Cosmetic profile settings shown in the user's public profile card.
 */
export interface ProfileDisplaySettings {
  /** Custom class / archetype label chosen by the user (e.g. "Scholar", "Athlete"). */
  class: string;
}

// ─── Player statistics ─────────────────────────────────────────────────────

/**
 * Firestore document schema for the player's accumulated statistics.
 * Stored at `users/{uid}/user_information/player_statistics`.
 *
 * `stats` is a flat map where keys are CDAG node IDs (e.g. "Intellect", "coded").
 * The canonical runtime type is `PlayerStatistics` from `@self-stats/progression-system`.
 */
export interface PlayerStatisticsDoc {
  /**
   * Map of `nodeId → { experience, level }`.
   * Each entry tracks how much EXP a node has accumulated and what level
   * that translates to via the logarithmic leveling curve.
   */
  stats: Record<string, { experience: number; level: number }>;
}

// ─── User analytics ────────────────────────────────────────────────────────

/**
 * Aggregate usage statistics computed from journal entry history.
 */
export interface UserStatistics {
  /** Cumulative count of all journal entries submitted by this user. */
  totalEntries: number;
  /** Longest consecutive daily-entry streak (in days) ever achieved. */
  longestStreak: number;
  /** Timestamp of the most recent journal entry submission. */
  lastEntryDate?: TimestampLike;
}

/**
 * Gamification achievement state — badges earned and milestones reached.
 */
export interface UserAchievements {
  /** List of badge IDs the user has unlocked (e.g. "first_entry", "level_10"). */
  badges: string[];
  /** List of milestone IDs reached (e.g. "100_entries", "all_attributes_5"). */
  milestones: string[];
}

/**
 * Platform-level account status metadata (managed by admins / server).
 */
export interface AccountStatus {
  /** Permission role controlling access to admin and developer features. */
  role: 'user' | 'developer' | 'admin';
  /** Lifecycle status of the account. */
  status: 'active' | 'suspended' | 'deleted';
  /** Timestamp of the user's most recent successful login. */
  lastLogin?: TimestampLike;
}
