# Progression System

The progression system gamifies your growth by turning journal activity into measurable stats through a path-weighted propagation pipeline.

## Pipeline

1. **Entry → Actions + Time** — AI analysis extracts the actions you performed and how long each took.
2. **Actions → XP** — Duration converts into experience points (30 min = 1.0 XP base unit).
3. **Upward propagation through CDAG** — XP flows from action nodes upward through skills to characteristics. Each edge weight determines the proportion of XP that propagates. If a node is reached by multiple paths, the intensity is averaged across paths rather than summed.
4. **Progression root** — All paths eventually terminate at a single "progression" root node, providing a global metric of lifetime advancement.
5. **Results** — Per-node XP changes are returned to you and stored.

## XP & Levels

- **Level formula**: Level = floor(log₂(XP + 1)). Each level requires exponentially more XP.
- XP accumulates per node in the CDAG (actions, skills, characteristics).
- A **global level** is computed from your total accumulated XP across all nodes.
- All XP values are rounded to 4 decimal places for precision.

## The 7 Core Attributes

The system defines seven top-level characteristics that the AI classifies toward:

- **Vitality** — Physical resilience, fitness, and health
- **Intellect** — Analytical capacity and technical rigor
- **Wisdom** — Metacognition, judgement, and depth
- **Social** — Charisma, collaboration, and empathy
- **Discipline** — Focus, self-control, and habits
- **Creativity** — Innovation, design, and artistry
- **Leadership** — Vision, influence, and direction

Organic characteristics that don't fit these seven are preserved as-is.

## Philosophy

The system avoids punitive mechanics. Progress is always forward — you cannot lose levels or have stats decreased. Because the AI runs at temperature 0.0, identical inputs produce identical results, making your level a reliable reflection of effort.
