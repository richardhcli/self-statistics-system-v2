# Characteristic Graph (CDAG)

The CDAG (Characteristic Directed Acyclic Graph) is a visual model of human characteristics that tracks how your effort flows from concrete actions up to high-level traits.

## Structure

The graph is organised from general to specific (parent → child):

- **Characteristics** — High-level traits such as intelligence, wisdom, fitness, endurance, productivity.
- **Skills** — Specific abilities like memorisation, bench-press technique, or habit forming.
- **Actions** — Concrete activities like studying, exercising, or scheduling.

Edge weights represent proportions — how much an action contributes to a skill, or a skill to a characteristic.

## How It Updates

- Each journal entry feeds actions and time into the experience system.
- XP propagates upward through the CDAG, updating every relevant node.
- New nodes and edges appear as the AI identifies connections from your entries.

## Interacting with the Graph

- Navigate to the **Graph** tab to view the full CDAG.
- Click a node to see related entries, XP, and level.
- Zoom, pan, and drag to explore clusters.

## Use Cases

- See which characteristics are growing fastest.
- Trace how a specific action contributes to high-level traits.
- Compare paths and decide where to focus effort next.
