# Jumpstart Guide: Running the Application

**Last Updated**: March 2, 2026

Follow these steps to get the monorepo running locally for development and testing.

## Prerequisites
- **Node.js 20** (LTS)
- **pnpm** (enable via `corepack enable pnpm` in an elevated terminal)
- **Java** (required for Firebase Firestore emulator)
- **Firebase CLI** (`npm install -g firebase-tools`)

## 1. Install Dependencies

From the **monorepo root** directory:

```bash
pnpm install
```

This links all workspace packages (`shared/*`, `apps/*`) and installs dependencies via pnpm's strict symlink structure.

## 2. Environment Configuration

Create a `.env` file in `apps/api-firebase/` with your Google AI API key:

```
GOOGLE_AI_API_KEY=your-key-here
```

For production deployment, secrets are managed via Google Cloud Secret Manager (see [esbuild-backend-bundler.md](build/esbuild-backend-bundler.md)).

## 3. Start the Development Stack

Boot both the Vite frontend and Firebase emulators simultaneously:

```bash
pnpm run dev
```

This runs `concurrently`:
- **Web app**: `pnpm --filter web run dev` → Vite dev server at [http://localhost:5173](http://localhost:5173)
- **API**: `pnpm --filter api-firebase run serve` → esbuild watch + Firebase emulators

## 4. Individual Workspace Commands

```bash
# Web app only
pnpm --filter web run dev

# Backend only (build + emulators)
pnpm --filter api-firebase run serve

# Run typechecks
pnpm --filter web run typecheck

# Run backend lint
pnpm --filter api-firebase run lint

# Build all
pnpm run build

# Deploy (build + sync secrets + firebase deploy)
pnpm run deploy
```

## 5. Obsidian Plugin Development

```bash
# Development build (watch mode)
pnpm --filter obsidian-self-stats-plugin run dev

# Production build
pnpm --filter obsidian-self-stats-plugin run build
```

Copy the built `main.js` and `manifest.json` into your Obsidian vault's `.obsidian/plugins/self-stats/` directory.

## 6. Workspace Structure

```
self-statistics-system-v2/          # Monorepo root
├── apps/
│   ├── web/                        # React frontend (Vite)
│   ├── api-firebase/               # Firebase Cloud Functions backend
│   └── obsidian-plugin/            # Obsidian integration plugin
├── shared/
│   ├── contracts/                  # @self-stats/contracts — pure TS interfaces
│   ├── progression-system/         # @self-stats/progression-system — EXP math
│   ├── soul-topology/              # @self-stats/soul-topology — graph transforms
│   └── plugin-sdk/                 # @self-stats/plugin-sdk — universal API client
├── testing/                        # Backend test scripts & emulator harnesses
├── pnpm-workspace.yaml             # Workspace definition
├── tsconfig.base.json              # Shared TS config with @self-stats/* aliases
└── package.json                    # Root scripts (dev, build, deploy)
```

## Related Docs
- [Workspace management](workspace/pnpm-workspace-guidelines.md)
- [Backend bundling](build/esbuild-backend-bundler.md)
- [Dev vs Prod environments](build/dev-vs-prod.md)


