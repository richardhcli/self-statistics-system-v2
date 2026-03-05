# Journaling

Journaling is the primary input method. Every entry feeds the AI analysis pipeline and progression system.

## Entry Types

- **Manual entry** — Type a structured reflection with optional tags and goals.
- **Quick log** — Short-form capture for moments when you just need to jot something down.
- **Voice entry** — Dictate your thoughts; speech is transcribed and processed the same way.

## Writing an Entry

1. Navigate to the **Journal** tab.
2. Choose your input method (text or voice).
3. Write or speak your reflection.
4. Submit — AI analysis triggers automatically.

## Entry Storage

- Entries persist locally in IndexedDB immediately on submit.
- Background sync pushes entries to Firebase when online.
- The journal tree (year → month → day) organises entries for fast navigation.

## Tips

- Be honest and specific — the AI extracts better themes from concrete details.
- Short entries still count. Consistency matters more than length.
- Use tags to create recurring threads you can track over time.
