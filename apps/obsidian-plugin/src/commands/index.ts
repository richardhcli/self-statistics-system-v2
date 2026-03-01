/**
 * @file commands/index.ts
 * @description
 * Centralized command registration.
 * * AI CONTEXT & ARCHITECTURE NOTE:
 * This module triggers the native Obsidian `JournalModal`. 
 * It awaits the user's input, formats it, sends it via the `SelfStatsClient`, 
 * and directly manipulates the active Markdown editor to inject the resulting AI graph topology (EXP and Level).
 */

import { Editor, MarkdownView, Notice } from 'obsidian';
import SelfStatsPlugin from '../main';
import { JournalModal } from '../ui/journal-modal';

interface StatsResponse {
    exp?: number;
    level?: number;
}

export function registerCommands(plugin: SelfStatsPlugin) {
    plugin.addCommand({
        id: 'new-journal-entry',
        name: 'New journal entry',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            // Instantiate native modal and provide the submission callback
            new JournalModal(plugin.app, (rawText, duration) => {
                // Catch the async execution to satisfy TypeScript's void-return requirement
                handleJournalEntry(plugin, editor, rawText, duration).catch((err) => {
                    console.error("Error in handleJournalEntry:", err);
                });
            }).open();
        }
    });
}

/**
 * Executes the business logic after the modal form is submitted.
 */
async function handleJournalEntry(plugin: SelfStatsPlugin, editor: Editor, rawText: string, duration: string) {
    if (!rawText.trim()) {
        new Notice("No text provided in the journal entry.");
        return;
    }

    new Notice("Analyzing self statistics...");

    // Format the payload. The backend AI orchestrator is prompted to look for this time tag.
    const entryContext = duration.trim() 
        ? `[Time Taken: ${duration.trim()} minutes]\n\n${rawText}` 
        : rawText;

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const statsResult = (await plugin.client.submitJournal(entryContext)) as StatsResponse;

        // Construct the markdown block to inject
        const insertionText = `\n> [!info] Self Statistics\n> **+${statsResult.exp ?? '?'} EXP** | Level ${statsResult.level ?? '?'}\n> ${rawText}\n`;

        editor.replaceSelection(insertionText);
        new Notice("Journal entry processed and saved.");

    } catch (error) {
        console.error("SelfStats Plugin Error:", error);
        new Notice(`Failed to process entry: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}