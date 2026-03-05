# Feature: Docs Viewer (Public Markdown Documentation)
**Last updated**: 2026-03-05

## What It Does
- Renders `docs/user/**/*.md` as a browsable documentation site inside the public layout.
- Sidebar-navigated sections derived from the folder structure at build time.
- Markdown rendered with `react-markdown` + `remark-gfm`, styled via `@tailwindcss/typography` `prose` classes.
- No auth required — accessible at `/docs/*` without login.

## Core Files (Start Here)
- Tree builder: [apps/web/src/features/docs/utils/build-doc-tree.ts](../../../apps/web/src/features/docs/utils/build-doc-tree.ts)
- Sidebar nav: [apps/web/src/features/docs/components/docs-sidebar.tsx](../../../apps/web/src/features/docs/components/docs-sidebar.tsx)
- Markdown renderer: [apps/web/src/features/docs/components/markdown-viewer.tsx](../../../apps/web/src/features/docs/components/markdown-viewer.tsx)
- Layout shell: [apps/web/src/features/docs/components/docs-layout.tsx](../../../apps/web/src/features/docs/components/docs-layout.tsx)
- Barrel export: [apps/web/src/features/docs/index.ts](../../../apps/web/src/features/docs/index.ts)
- Content source: [docs/user/](../../user/) (8 markdown files in 3 numbered folders)

## Architecture
- **Build-time loading**: Vite `import.meta.glob` with `eager: true` + `?raw` imports all markdown at compile time. Zero runtime fetch.
- **`@docs` alias**: Vite and TypeScript path alias pointing to `<monorepo-root>/docs/`. Used in the glob pattern (`@docs/user/**/*.md`).
- **Numbered folder ordering**: Folders prefixed `01-`, `02-`, `03-` control sidebar section order. Prefixes are stripped from display labels.
- **Slug routing**: React Router v7 splat param (`/docs/*`) maps URL segments to document slugs.

## Routes
- `/docs` → Redirects to the first document
- `/docs/*` → DocsLayout (sidebar + MarkdownViewer)

## Dependencies
- `react-markdown` — Renders markdown strings as React elements
- `remark-gfm` — GitHub-Flavoured Markdown support (tables, strikethrough, task lists)
- `@tailwindcss/typography` — Provides `prose` classes for styled markdown output

## Content Structure
```
docs/user/
  01-getting-started/
    overview.md
    installation.md
  02-core-loop/
    journaling.md
    ai-analysis.md
    progression.md
  03-features/
    graph.md
    statistics.md
    integrations.md
```

## Behavior Notes
- Adding or renaming `.md` files in `docs/user/` is picked up by Vite HMR (may require dev server restart in rare cases).
- If the glob returns no files, the layout renders an empty sidebar gracefully.
- The `prose` styling requires `@tailwindcss/typography` loaded via `@plugin` in the CSS entry point.
