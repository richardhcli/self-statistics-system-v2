# Characteristic Graph (CDAG)

The CDAG (Characteristic Directed Acyclic Graph) is an interactive, stable DAG visualisation of your cognitive hierarchy — showing how effort flows from concrete actions up to high-level traits.

## Structure

The graph uses a hierarchical left-to-right layout:

- **Characteristics (left)** — Seven core attributes (Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership) plus any organic concepts.
- **Skills (middle)** — Specific abilities like memorisation, bench-press technique, or habit forming.
- **Actions (right)** — Concrete activities like studying, exercising, or scheduling.

Edge weights (0–1) represent proportions — how much a child contributes to its parent. Thicker, more opaque edges indicate higher weight.

## Visual Encoding

- **Node colours**: Indigo (Characteristics), Amber (Skills), Emerald (Actions).
- **Edge direction**: Arrows point from parent concepts to child actions.

## How It Updates

- Each journal entry triggers the AI extraction pipeline, which generates small hierarchy fragments.
- Fragments merge into the main topology. If an edge already exists, its weight gradually shifts toward the new predicted value (adaptive learning).
- New nodes and edges appear as the AI identifies connections from your entries.

## Interacting with the Graph

- Navigate to the **Graph** tab to view the full CDAG.
- Nodes snap to their calculated grid positions. Drag a node to explore, and it teleports back on release.
- Drag a node over its vertical neighbour in the same column to swap their positions.
- **Select a node** to highlight it with an indigo glow. Immediate parents and children are traced with indigo strokes, and connecting edges turn solid indigo to reveal the flow of effort.

## Use Cases

- See which characteristics are growing fastest.
- Trace how a specific action contributes to high-level traits.
- Compare paths and decide where to focus effort next.
