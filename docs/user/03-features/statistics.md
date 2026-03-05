# Statistics Dashboard (Character Sheet)

The statistics dashboard is your RPG-style character sheet — a real-life status screen showing levels, XP, and attribute breakdowns powered by the progression system.

## Header

The stats header displays your name, class, total EXP, today's gain, yesterday's gain, and a progress bar toward the next global level.

## Views (4 Tabs)

### Status (Default)

1. **Attribute Radar Chart** — 7-axis radar visualisation of your core attribute levels (Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership).
2. **Attribute Grid** — Cards for each core attribute showing icon, level badge, description, and XP progress bar.
3. **Recent Neural Impact** — The last 5 journal entries with their EXP gain, sorted by time.
4. **Skill Clusters** — Skill nodes grouped by their closest characteristic parent, each showing total XP and child skills with levels.

### Experience

Lists the top 10 nodes by experience.

### Levels

1. **Global Level Badge** — Your overall level computed via the logarithmic curve from total accumulated XP.
2. **XP Progress Bar** — Gradient bar showing fractional progress toward the next level with current/next XP thresholds.
3. **Top 3 Contributors** — Nodes ranked by EXP contribution (excluding the root).

### All Statistics

Summary metrics: total EXP, total levels, highest EXP node, highest level node, total node count, total edge count.

## Delta Tracking

- **Total EXP** — Lifetime cumulative growth.
- **Today's Gain** — EXP gained since midnight.
- **Yesterday's Gain** — EXP gained during the previous calendar day.

All stats update in real time as entries are processed. Charts use the same data that feeds the progression system — no separate calculation.
