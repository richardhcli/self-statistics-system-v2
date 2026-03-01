/**
 * @file journal-modal.ts
 * @description
 * Native Obsidian modal implementation for capturing journal inputs.
 * * AI CONTEXT & ARCHITECTURE NOTE:
 * We deliberately avoid using the community "Modal Forms" plugin here to prevent 
 * third-party dependency failures. This uses `obsidian.Modal` directly.
 */

import { App, Modal, Setting, TextAreaComponent, TextComponent } from 'obsidian';

export class JournalModal extends Modal {
    private rawText: string = "";
    private duration: string = "";
    private onSubmit: (rawText: string, duration: string) => void;

    constructor(app: App, onSubmit: (rawText: string, duration: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        
        new Setting(contentEl).setName('New journal entry').setHeading();

        new Setting(contentEl)
            .setName('Journal text')
            .setDesc('What did you accomplish?')
            .addTextArea((text: TextAreaComponent) => {
                text.setPlaceholder('I built a native Obsidian modal...')
                    .onChange(value => {
                        this.rawText = value;
                    });
                text.inputEl.rows = 6;
                text.inputEl.cols = 50;
            });

        new Setting(contentEl)
            .setName('Time taken (optional)')
            .setDesc('Estimated duration in minutes.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('30')
                    .onChange(value => {
                        this.duration = value;
                    });
            });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Process with AI')
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(this.rawText, this.duration);
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty(); // Prevent memory leaks per Obsidian best practices
    }
}