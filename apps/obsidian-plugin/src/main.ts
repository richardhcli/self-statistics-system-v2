/**
 * @file main.ts
 * @description
 * The core entry point and lifecycle manager for the Obsidian plugin.
 * * AI CONTEXT & ARCHITECTURE NOTE:
 * - This file is intentionally kept minimal. It delegates UI to `settings-tab.ts` 
 * and commands to `commands/index.ts`.
 * - It initializes the `SelfStatsClient` SDK. Because Obsidian does not allow Node.js `fs` access,
 * we inject Obsidian's native `loadData()` and `saveData()` methods into the SDK's StorageAdapter.
 */

import { Plugin } from 'obsidian';
import { SelfStatsSettings, DEFAULT_SETTINGS } from './settings';
import { SelfStatsSettingTab } from './ui/settings-tab';
import { registerCommands } from './commands/index';
import { SelfStatsClient, SelfStatsConfig, StorageAdapter } from '@self-stats/plugin-sdk';

export default class SelfStatsPlugin extends Plugin {
    settings: SelfStatsSettings;
    client: SelfStatsClient;

    /**
     * Called automatically by Obsidian when the plugin is enabled.
     */
    async onload() {
        // Load persisted settings, falling back to defaults
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<SelfStatsSettings>);
        
        // Boot the SDK with the loaded refresh token
        this.initializeSdk();

        // Register external UI and Commands
        this.addSettingTab(new SelfStatsSettingTab(this.app, this));
        registerCommands(this);
    }

    /**
     * Rebuilds the SelfStatsClient. Called on load and whenever settings change.
     */
    initializeSdk() {
        // Inject Obsidian's file system into the platform-agnostic SDK
        const storageAdapter: StorageAdapter = {
            getRefreshToken: async () => this.settings.refreshToken,
            setRefreshToken: async (token: string) => {
                this.settings.refreshToken = token;
                await this.saveSettings();
            },
            clearRefreshToken: async () => {
                this.settings.refreshToken = null;
                await this.saveSettings();
            }
        };

        const config: SelfStatsConfig = {
            firebaseApiKey: this.settings.firebaseApiKey,
            backendUrl: this.settings.backendUrl,
            storage: storageAdapter
        };

        this.client = new SelfStatsClient(config);
    }

    /**
     * Persists the current settings object to `.obsidian/plugins/.../data.json`
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }
}