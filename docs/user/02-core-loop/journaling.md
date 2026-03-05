# Journaling

Journaling is the primary input method. Every entry feeds the AI analysis pipeline and progression system.

## Entry Types

- **Manual entry** — Type a reflection or structured entry via keyboard.
- **Voice entry** — Dictate your thoughts; speech is transcribed and processed the same way. Falls back to Web Speech API when the primary transcription service is unavailable.

## Writing an Entry

1. Navigate to the **Journal** tab.
2. Choose your input method (text or voice).
3. Write or speak your reflection.
4. Submit — AI analysis triggers automatically.

The desktop layout keeps the input panel sticky on the left while the journal scrolls on the right.

## Entry Storage

- Firebase is the source of truth for all entries.
- Zustand + IndexedDB act as a read-aside cache for fast reads and offline access.
- The journal tree (year → month → day) organises entries for fast navigation and lazy loading.

## Tips

- Be honest and specific — the AI extracts better actions and skills from concrete details.
- Short entries still count. Consistency matters more than length.
