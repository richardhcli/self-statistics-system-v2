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
import type { JournalEntryResponse, StatChange } from '@self-stats/plugin-sdk';

export function registerCommands(plugin: SelfStatsPlugin) {
    plugin.addCommand({
        id: 'new-journal-entry',
        name: 'New journal entry',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            new JournalModal(plugin.app, (rawText, duration) => {
                handleJournalEntry(plugin, editor, rawText, duration).catch((err) => {
                    console.error("Error in handleJournalEntry:", err);
                });
            }).open();
        }
    });
}

async function handleJournalEntry(plugin: SelfStatsPlugin, editor: Editor, rawText: string, duration: string) {
    if (!plugin.client) {
        new Notice("System unconfigured. Please enter your Firebase settings first.");
        return;
    }
    
    if (!rawText.trim()) {
        new Notice("No text provided in the journal entry.");
        return;
    }

    new Notice("Analyzing self statistics...");

    const entryContext = duration.trim() 
        ? `[Time Taken: ${duration.trim()} minutes]\n\n${rawText}` 
        : rawText;

    try {
        const statsResult = await plugin.client.submitJournalEntry(entryContext);
        const insertionText = buildCallout(statsResult, rawText);
        editor.replaceSelection(insertionText);
        new Notice("Journal entry processed and saved.");
    } catch (error) {
        console.error("SelfStats Plugin Error:", error);
        new Notice(`Failed to process entry: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

function buildCallout(result: JournalEntryResponse, originalText: string): string {
    const changes = result.statChanges ?? [];
    const totalExp = result.stats?.totalIncrease ?? 0;

    // Header line: highlight the largest single increase
    let summaryLine: string;
    const largest = changes[0] as StatChange | undefined;
    if (largest) {
        summaryLine = `> EXP UP!! **${largest.name}**: ${largest.oldValue} → ${largest.newValue} (+${largest.increase}) (+${totalExp} total EXP)`;
    } else {
        summaryLine = `> +${totalExp} EXP`;
    }

    // Nested collapsible with all per-stat deltas
    const detailLines = changes.map(
        (c) => `> > - ${c.name}: ${c.oldValue} → ${c.newValue} (+${c.increase})`
    );

    // actual user input:
    const userEntry = originalText.replace(/\n/g, "\n> ")

    // time right now:
    const timestamp = new Date().toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });

    const parts = [
        `> [!info] Self Statistics`,
        `> ${timestamp} - ${userEntry}`,
        summaryLine,
    ];

    if (detailLines.length > 0) {
        parts.push(`> > [!success]- All increases:`);
        parts.push(...detailLines);
    }

    parts.push(`> `);

    return "\n" + parts.join("\n") + "\n";
}