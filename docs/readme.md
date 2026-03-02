# Documentation Index

**Last Updated**: March 2, 2026  
**Purpose**: Central entry point for all project documentation

---

## Quick Start

| Audience | Start Here |
|----------|-----------|
| **AI Agents** | [.ai/blueprints/project-guidelines.md](../.ai/blueprints/project-guidelines.md) — patterns, rules, decision trees |
| **Developers** | [dev/jumpstart.md](./dev/jumpstart.md) — clone → install → run in 2 minutes |
| **Overview** | [dev/overview.md](./dev/overview.md) — project purpose, stack, and philosophy |

---

## Documentation Map

### Architecture
| File | Purpose |
|------|---------|
| [architecture/architecture.md](./dev/architecture/architecture.md) | Monorepo structure + folder map |
| [architecture/architecture-distinctions.md](./dev/architecture/architecture-distinctions.md) | /lib vs /stores vs shared/* separation |
| [architecture/feature-composition.md](./dev/architecture/feature-composition.md) | Component composition patterns |
| [architecture/css-architecture.md](./dev/architecture/css-architecture.md) | CSS layering strategy |
| [tech-stack.md](./dev/tech-stack.md) | Technologies & version inventory |

### State Management
| File | Purpose |
|------|---------|
| [state-management-README.md](./dev/state-management/state-management-README.md) | Overview and decision tree |
| [GLOBAL_STATE.md](./dev/state-management/GLOBAL_STATE.md) | Zustand store pattern spec (immutable) |
| [ORCHESTRATOR_PATTERN.md](./dev/state-management/ORCHESTRATOR_PATTERN.md) | Cross-store coordination |
| [LOCAL_STATE.md](./dev/state-management/LOCAL_STATE.md) | Component-level state |
| [PERSISTENCE_ARCHITECTURE.md](./dev/state-management/PERSISTENCE_ARCHITECTURE.md) | IndexedDB + Zustand persistence |
| [firebase-backend.md](./dev/state-management/firebase-backend.md) | Firebase schema + auth flow |

### Firebase Backend
| File | Purpose |
|------|---------|
| [firebase-backend.md](./dev/backend/firebase-backend.md) | Backend architecture index |
| [firebase-backend-schema.md](./dev/backend/firebase-backend-schema.md) | Firestore schema reference |
| [firebase-backend-auth.md](./dev/backend/firebase-backend-auth.md) | Auth providers + custom tokens |
| [firebase-backend-features.md](./dev/backend/firebase-backend-features.md) | Services + operations reference |
| [firebase-functions.md](./dev/backend/functions/firebase-functions.md) | Cloud Functions runbook |
| [plugins-style-guide.md](./dev/backend/functions/plugins-style-guide.md) | Plugin integration rules |

### Authentication
| File | Purpose |
|------|---------|
| [frontend-authentication.md](./dev/authentication/frontend-authentication.md) | Frontend auth flow + components |
| [api-authentication-pipeline.md](./dev/authentication/api-authentication-pipeline.md) | Custom token pipeline for external clients |

### AI & Gamification
| File | Purpose |
|------|---------|
| [ai-and-gamification.md](./dev/ai-and-gamification.md) | AI pipeline + progression system |
| [ai-pipeline-strategy.md](./dev/LLM-usage/ai-pipeline-strategy.md) | Prompt engineering + model fallback |
| [cdag-topology.md](./dev/cdag-topology.md) | Concept DAG graph design |

### Integrations
| File | Purpose |
|------|---------|
| [integrations/overview.md](./dev/integrations/overview.md) | Plugin SDK architecture |
| [integrations/obsidian.md](./dev/integrations/obsidian.md) | Obsidian plugin details |

### Feature Documentation
| File | Purpose |
|------|---------|
| [features-statistics.md](./dev/features/features-statistics.md) | Statistics RPG dashboard |
| [features-journal.md](./dev/features/features-journal.md) | Journal pipeline overview |
| [features-visual-graph.md](./dev/features/features-visual-graph.md) | Concept graph visualization |
| [features-developer-graph.md](./dev/features/features-developer-graph.md) | Developer graph editor |
| [features-settings.md](./dev/features/features-settings.md) | Settings interface |
| [features-debug.md](./dev/features/features-debug.md) | Debug console |
| [features-integration.md](./dev/features/features-integration.md) | Obsidian + external plugins |
| [features-user-info.md](./dev/features/features-user-info.md) | User identity |
| [features-datastores-debug.md](./dev/features/features-datastores-debug.md) | Datastore debug tools |

### Workspace & Build
| File | Purpose |
|------|---------|
| [pnpm-workspace-guidelines.md](./dev/workspace/pnpm-workspace-guidelines.md) | pnpm monorepo conventions |
| [build/](./dev/build/) | Build configuration docs |

### Project Evolution
| File | Purpose |
|------|---------|
| [CHANGELOG.md](../CHANGELOG.md) | Version history |
| [next_steps.md](./next_steps.md) | Immediate TODO items |
| [archived/](./archived/) | Historical session logs and migration notes |

---

## Document Standards

**Immutable** (enforceable specs — do not modify without careful review):
- `state-management/GLOBAL_STATE.md` — Zustand store pattern
- `architecture/architecture-distinctions.md` — /lib vs /stores vs shared/* separation

**Descriptive** (updated as the project evolves):
- All feature docs, architecture overviews, integration guides, and changelog
