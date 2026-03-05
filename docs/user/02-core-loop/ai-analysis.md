# AI Analysis

After each journal entry, the system runs a 3-layer semantic extraction pipeline using Google Gemini AI.

## The 3-Layer Extraction

1. **Action Extraction** — Gemini identifies 1–5 concrete actions you performed (e.g., "Debugging", "Squats") along with time estimates.
2. **Skill Mapping** — Actions are aggregated into professional or personal skills (e.g., "Frontend Engineering").
3. **Attribute Characterisation** — Skills are mapped toward the 7 core attributes (Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership). The AI is guided but not forced — organic characteristics are preserved when they don't cleanly fit.

## Determinism

The AI runs at **temperature 0.0** — identical journal inputs will always produce identical extraction results, making your stats a reliable reflection of effort.

## Generalisation Engine

When the pipeline encounters a new concept that doesn't exist in the graph yet, it generates a chain of up to 10 increasingly abstract concepts, terminating at the "progression" root. Each link includes proportional edge weights.

## How It Works

1. Your entry text is sent to the Gemini model (primary: `gemini-3-flash-preview`).
2. The model returns a structured breakdown of actions, skills, and characteristics.
3. Results are displayed alongside your entry.
4. Extracted data maps onto the CDAG and feeds into the experience system (XP, levels, graph nodes).

## Privacy

- Analysis runs through the backend API with your Firebase session.
- Raw text is not stored by the AI provider beyond the request lifecycle.

## Fallback

If the primary model is unavailable, the system automatically falls back to `gemini-2.0-flash` to ensure analysis is always returned.
