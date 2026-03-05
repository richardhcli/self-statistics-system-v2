# AI Analysis

After each journal entry, the system runs an AI analysis pipeline to extract structured character data.

## What It Extracts

- **Actions** — Concrete activities you performed (e.g., studying, exercising, scheduling).
- **Skills** — Underlying skills exercised by those actions (e.g., memorisation, bench-press technique, habit forming).
- **Characteristics** — High-level traits impacted (e.g., intelligence, fitness, productivity).
- **Time estimates** — Duration associated with each action, used to calculate XP.

## How It Works

1. Your entry text is sent to the Gemini AI model.
2. The model returns a structured breakdown of actions, skills, and characteristics.
3. Results are displayed alongside your entry.
4. Extracted data maps onto the CDAG and feeds into the experience system (XP, levels, graph nodes).

## Privacy

- Analysis runs through the backend API with your Firebase session.
- Raw text is not stored by the AI provider beyond the request lifecycle.
- You can disable AI analysis in **Settings → AI Features**.

## Fallback

If the primary AI model is unavailable, the system automatically falls back to a secondary model to ensure analysis is always returned.
