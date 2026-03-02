# 2026-03-02 — Documentation Overhaul

## Context
Phase 2.5 (Monorepo Refactor for Plugin API Integration) completed Feb 17 – Mar 2. All project documentation was severely out of date with references to the old single-app structure, `npm` commands, `@systems/*` aliases, and `src/systems/` paths.

## What Changed

### CHANGELOG.md
- Added comprehensive **Phase 2.5** entry covering the entire monorepo refactor, organized into Added/Changed/Fixed/Removed sections.

### Complete Rewrites (7 files)
| File | Summary |
|------|---------|
| `docs/dev/jumpstart.md` | npm → pnpm, localhost:3000 → 5173, monorepo structure diagram, per-workspace commands |
| `docs/dev/workspace/pnpm-workspace-guidelines.md` | Renamed from `npm-workspace-guidelines.md`. Full pnpm workspace reference |
| `docs/dev/architecture/architecture.md` | Rewritten for monorepo: shared packages, apps, build pipeline |
| `docs/dev/backend/functions/firebase-functions.md` | 3-layer architecture, new function exports, secret management |
| `docs/dev/backend/functions/plugins-style-guide.md` | Custom Token auth + plugin-sdk client architecture |
| `docs/dev/integrations/obsidian.md` | Local REST API → dedicated Obsidian plugin |
| `docs/dev/features/features-integration.md` | New auth model, connection code flow |

### Major Updates (8 files)
| File | Changes |
|------|---------|
| `docs/dev/architecture/architecture-distinctions.md` | `/systems` directory → `shared/*` packages |
| `docs/dev/architecture/feature-composition.md` | `@systems/*` → `@self-stats/*` |
| `docs/dev/backend/firebase-backend.md` | Updated links, removed broken migration plan link |
| `docs/dev/backend/firebase-backend-features.md` | Added 3-layer backend section, fixed all paths |
| `docs/dev/backend/firebase-backend-schema.md` | Fixed reference paths |
| `docs/dev/integrations/overview.md` | Added Plugin SDK architecture |
| `docs/readme.md` | Complete rewrite — fixed all broken links, current doc map |
| `docs/next_steps.md` | Removed completed phases 1-2, cleaned webhooks, updated structure |

### Batch Path Fixes (17 files, ~89 lines)
Systematic replacement of `src/` → `apps/web/src/` in both markdown display text and link targets across:
- `docs/dev/tech-stack.md`
- `docs/dev/ai-and-gamification.md`
- `docs/dev/cdag-topology.md`
- `docs/dev/architecture/feature-composition.md`
- `docs/dev/authentication/frontend-authentication.md`
- `docs/dev/backend/firebase-backend-auth.md`
- `docs/dev/features/features-debug.md`
- `docs/dev/features/features-datastores-debug.md`
- `docs/dev/features/features-journal.md`
- `docs/dev/features/features-statistics.md`
- `docs/dev/features/features-visual-graph.md`
- `docs/dev/features/journal/features-journal.md`
- `docs/dev/LLM-usage/ai-pipeline-strategy.md`
- `docs/dev/state-management/state-management-README.md`
- `docs/dev/state-management/PERSISTENCE_ARCHITECTURE.md`
- `docs/dev/state-management/ORCHESTRATOR_PATTERN.md`
- `docs/dev/state-management/firebase-backend.md`

### Alias Replacements
- `@systems/progression` → `@self-stats/progression-system` across all active docs
- `src/systems/progression/` → `shared/progression-system/` across all active docs
- `src/lib/soulTopology/` → `shared/soul-topology/` across all active docs

### Blueprint Updates
- `.ai/blueprints/project-guidelines.md`: Updated tech stack (React 19, Vite 6, TS 5.8), project structure section (shared/*, apps/*)
- `.ai/blueprints/universal-validation-guidelines.md`: npm Workspaces link → pnpm Workspaces link

### Overview/Tech-Stack
- `docs/dev/overview.md`: Custom Technologies section rewritten for shared packages
- `docs/dev/tech-stack.md`: Updated Vite alias docs, Systems Architecture → Shared Packages

## Files NOT Touched (Intentional)
- `docs/archived/*` — Historical logs, preserved as-is
- `docs/dev/ai-workflow.md` — No outdated references found
- `docs/dev/mentality/*` — Philosophy docs, no code paths
- `docs/user/*` — Placeholder docs, no code references
