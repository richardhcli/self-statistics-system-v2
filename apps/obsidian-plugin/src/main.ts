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
    client: SelfStatsClient | null = null; // Fix: Allow client to be null initially

    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<SelfStatsSettings>);
        this.initializeSdk();
        this.addSettingTab(new SelfStatsSettingTab(this.app, this));
        registerCommands(this);
    }

    initializeSdk() {
        // Fix: If the required settings are missing on first load, safely abort initialization.
        if (!this.settings.projectId || !this.settings.apiKey || !this.settings.backendUrl) {
            this.client = null;
            return;
        }

        const storageAdapter: StorageAdapter = {
            getItem: () => this.settings.authData,
            setItem: async (key: string, value: string) => {
                this.settings.authData = value;
                await this.saveSettings();
            },
            removeItem: async (key: string) => {
                this.settings.authData = null;
                await this.saveSettings();
            }
        };

        const config: SelfStatsConfig = {
            projectId: this.settings.projectId,
            apiKey: this.settings.apiKey,
            backendUrl: this.settings.backendUrl,
            storage: storageAdapter
        };

        this.client = new SelfStatsClient(config);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}