# AI Agent Guidelines: pnpm Workspaces Management

**Last Updated**: March 2, 2026

## 1. Architectural Context
This repository is a polyglot monorepo utilizing **pnpm workspaces** with strict dependency isolation.
The workspace is defined in `pnpm-workspace.yaml`:
```yaml
packages:
  - apps/*
  - shared/*
```

## 2. Workspace Packages

| Package | Name | Description |
|---|---|---|
| `apps/web` | `web` | React frontend (Vite) |
| `apps/api-firebase` | `api-firebase` | Firebase Cloud Functions backend |
| `apps/obsidian-plugin` | `obsidian-self-stats-plugin` | Obsidian integration plugin |
| `shared/contracts` | `@self-stats/contracts` | Pure TypeScript interfaces |
| `shared/progression-system` | `@self-stats/progression-system` | EXP math & propagation engine |
| `shared/soul-topology` | `@self-stats/soul-topology` | Graph transforms & operations |
| `shared/plugin-sdk` | `@self-stats/plugin-sdk` | Universal platform-agnostic API client |

## 3. Execution Context
**CRITICAL RULE:** All `pnpm` commands MUST be executed from the **monorepo root directory**.
Do not `cd` into individual workspace folders to manage packages or run scripts.

## 4. Dependency Management

### Adding a Package to a Specific Workspace
```bash
# Add a runtime dependency
pnpm add <package-name> --filter <workspace-name>

# Add a development dependency
pnpm add -D <package-name> --filter <workspace-name>

# Example: Adding zod to the backend
pnpm add zod --filter api-firebase
```

### Adding a Workspace Dependency (Internal Package)
Internal dependencies use the `workspace:*` protocol in `package.json`:
```json
{
  "dependencies": {
    "@self-stats/contracts": "workspace:*",
    "@self-stats/progression-system": "workspace:*",
    "@self-stats/soul-topology": "workspace:*"
  }
}
```

### Adding a Dependency to the Root
Only install orchestration tools, linters, or workspace-wide tooling at the root.
```bash
pnpm add -D <package-name> -w
```

## 5. Task Execution
```bash
# Run a script in a specific workspace
pnpm --filter <workspace-name> run <script-name>

# Examples
pnpm --filter web run dev          # Frontend dev server
pnpm --filter api-firebase run build   # Build backend
pnpm --filter web run typecheck    # Type check frontend

# Root-level convenience scripts
pnpm run dev        # Runs web + api concurrently
pnpm run build      # Builds all apps
pnpm run deploy     # Build + sync secrets + firebase deploy
```

## 6. Strict Anti-Patterns (Do NOT Do These)
- **DO NOT** run `pnpm install` inside an `apps/*` or `shared/*` directory. This breaks workspace symlinks.
- **DO NOT** delete `pnpm-lock.yaml` unless a complete workspace dependency reset is explicitly requested.
- **DO NOT** use `npm` or `yarn` commands. This project uses pnpm exclusively.
- **DO NOT** use bare package names in imports for shared packages — always use the `@self-stats/*` scope.
- **DO NOT** create `node_modules` manually. Let pnpm handle the strict symlink structure.

## 7. Official Documentation
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm Filtering](https://pnpm.io/filtering)