# AI Analysis

After each journal entry, the system runs an AI analysis pipeline to extract structured insights.

## What It Extracts

- **Themes** — Recurring topics across entries (e.g., "focus", "health", "project X").
- **Blockers** — Issues or friction points you described.
- **Next actions** — Suggested steps derived from your own words.
- **Sentiment** — General tone of the entry (positive, neutral, negative).

## How It Works

1. Your entry text is sent to the Gemini AI model.
2. The model returns a structured breakdown.
3. Insights are displayed in the AI panel next to your entry.
4. Relevant data feeds into the progression system (XP, graph nodes).

## Privacy

- Analysis runs through the backend API with your Firebase session.
- Raw text is not stored by the AI provider beyond the request lifecycle.
- You can disable AI analysis in **Settings → AI Features**.

## Fallback

If the primary AI model is unavailable, the system automatically falls back to a secondary model to ensure analysis is always returned.
