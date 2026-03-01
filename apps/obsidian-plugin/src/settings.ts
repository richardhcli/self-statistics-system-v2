/**
 * @file settings.ts
 * @description
 * Defines the data structure for the plugin's persistent storage (data.json).
 * * AI CONTEXT & ARCHITECTURE NOTE:
 * This plugin uses a highly secure authentication pattern via `@self-stats/plugin-sdk`.
 * It NEVER stores a static API key or a short-lived Access Token. 
 * Instead, it stores a long-lived Google Identity `refreshToken`. 
 * The SDK automatically swaps this refresh token for a fresh 1-hour ID Token in the background 
 * before making requests to the Firebase backend.
 */

export interface SelfStatsSettings {
    projectId: string;
    apiKey: string;
    backendUrl: string;
    /** The serialized TokenBundle JSON string managed by the SDK */
    authData: string | null;
}

export const DEFAULT_SETTINGS: SelfStatsSettings = {
    projectId: 'self-statistics-system-v2',
    apiKey: '',
    backendUrl: 'http://127.0.0.1:5001/self-statistics-system-v2/us-central1',
    authData: null
};