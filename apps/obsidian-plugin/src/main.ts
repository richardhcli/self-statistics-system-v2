/**
 * @file main.ts
 * @module @self-stats/obsidian-plugin
 *
 * Obsidian plugin for the Self Statistics System.
 *
 * Captures markdown notes and submits them to the Self Statistics REST API
 * via {@link SelfStatsClient} from `@self-stats/plugin-sdk`.
 *
 * This is a thin client — all AI analysis, graph operations, and progression
 * calculations happen server-side. The plugin only needs to:
 * 1. Capture markdown content from the active note.
 * 2. Call `SelfStatsClient.submitObsidianNote()`.
 * 3. Display the result (EXP gained, nodes created, etc.).
 */

import {Plugin, Notice, PluginSettingTab, App, Setting} from "obsidian";
import {SelfStatsClient} from "@self-stats/plugin-sdk";

// ─── Settings ──────────────────────────────────────────────────────────────

/** Persisted plugin settings stored in Obsidian's `data.json`. */
interface SelfStatsSettings {
  /** REST API key (format `sss_...`). */
  apiKey: string;
  /** Base URL of the deployed Firebase Functions. */
  baseUrl: string;
}

const DEFAULT_SETTINGS: SelfStatsSettings = {
  apiKey: "",
  baseUrl: "",
};

// ─── Plugin ────────────────────────────────────────────────────────────────

/**
 * Main Obsidian plugin class.
 *
 * Registers a command to submit the active note as a journal entry to the
 * Self Statistics API.
 */
export default class SelfStatsPlugin extends Plugin {
  settings: SelfStatsSettings = DEFAULT_SETTINGS;
  private client: SelfStatsClient | null = null;

  /** @return {Promise<void>} */
  async onload(): Promise<void> {
    await this.loadSettings();
    this.rebuildClient();

    this.addCommand({
      id: "submit-journal-entry",
      name: "Submit active note as journal entry",
      callback: () => this.submitActiveNote(),
    });

    this.addSettingTab(new SelfStatsSettingTab(this.app, this));
  }

  /** @return {Promise<void>} */
  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData(),
    );
  }

  /**
   * Save settings and rebuild the API client.
   * @return {Promise<void>}
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.rebuildClient();
  }

  /** Rebuild the SelfStatsClient with current settings. */
  private rebuildClient(): void {
    if (this.settings.apiKey) {
      this.client = new SelfStatsClient({
        apiKey: this.settings.apiKey,
        baseUrl: this.settings.baseUrl || undefined,
      });
    } else {
      this.client = null;
    }
  }

  /** Submit the content of the active note to the API. */
  private async submitActiveNote(): Promise<void> {
    if (!this.client) {
      new Notice("Self Stats: Please configure your API key in settings.");
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("Self Stats: No active file.");
      return;
    }

    const content = await this.app.vault.read(activeFile);
    if (!content.trim()) {
      new Notice("Self Stats: Active note is empty.");
      return;
    }

    try {
      new Notice("Self Stats: Submitting...");
      const result = await this.client.submitObsidianNote(content);
      new Notice(
        `Self Stats: +${result.stats.totalIncrease} EXP | ` +
        `${result.graph.nodeCount} nodes, ${result.graph.edgeCount} edges`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      new Notice(`Self Stats: Error — ${message}`);
      console.error("SelfStatsPlugin submit error", error);
    }
  }
}

// ─── Settings Tab ──────────────────────────────────────────────────────────

/** Obsidian settings tab for configuring the Self Stats API connection. */
class SelfStatsSettingTab extends PluginSettingTab {
  plugin: SelfStatsPlugin;

  /**
   * @param {App} app Obsidian App instance.
   * @param {SelfStatsPlugin} plugin Plugin instance.
   */
  constructor(app: App, plugin: SelfStatsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /** @return {void} */
  display(): void {
    const {containerEl} = this;
    containerEl.empty();
    containerEl.createEl("h2", {text: "Self Statistics System"});

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Your Self Stats REST API key (starts with sss_)")
      .addText((text) =>
        text
          .setPlaceholder("sss_...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Base URL")
      .setDesc("Firebase Functions base URL (no trailing slash)")
      .addText((text) =>
        text
          .setPlaceholder("https://us-central1-my-project.cloudfunctions.net")
          .setValue(this.plugin.settings.baseUrl)
          .onChange(async (value) => {
            this.plugin.settings.baseUrl = value.trim();
            await this.plugin.saveSettings();
          }),
      );
  }
}
