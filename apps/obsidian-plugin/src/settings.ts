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
    firebaseApiKey: string;
    backendUrl: string;
    /** The permanent Google Identity Refresh Token. Keep this null until authenticated. */
    refreshToken: string | null;
}

export const DEFAULT_SETTINGS: SelfStatsSettings = {
    firebaseApiKey: '',
    backendUrl: 'http://127.0.0.1:5001/self-statistics-system-v2/us-central1',
    refreshToken: null
};