# Action Plan: User Documentation Viewer (In-App Markdown Docs)

**Date**: March 5, 2026
**Purpose**: Render `docs/user/**/*.md` as a browsable, sidebar-navigated documentation viewer inside the public site
**Status**: Implemented

---

## Overview

The `docs/user/` directory is meant to hold user-facing documentation authored in plain markdown. Currently it contains two placeholder files (`overview.md`, `readme.md`). This plan adds a `features/docs` module that reads those files at build time via Vite, renders them with `react-markdown`, and presents them behind a sidebar layout under the public `/docs/*` route — accessible without login.

### Architecture Decision

**Option chosen: New `features/docs/` feature module** served through `PublicLayout` (the same shell used by `/`, `/about`, `/usage`). No auth dependency, no Zustand stores, no persistence gating.

```
Route Structure (After):
  /               → LandingPage (public, existing)
  /about          → AboutPage (public, existing)
  /usage          → UsagePage (public, existing)
  /docs           → DocsLayout → sidebar + Outlet (public, NEW)
  /docs/*         → MarkdownViewer (public, NEW)
  /auth/login     → AuthView (existing)
  /auth/logout    → LogoutView (existing)
  /app/*          → ProtectedRoute → MainLayout → features (unchanged)
```

### Why Not a Separate Docusaurus Site?

Docusaurus adds a parallel build pipeline, a second dev server, separate deployment, and a different styling system. This app already has Vite 6, `import.meta.glob`, React Router v7, Tailwind, and a PublicLayout shell — all the pieces needed to build this natively with zero new infrastructure.

---

## Steps

### 1. Install markdown rendering dependencies

```bash
pnpm --filter web add react-markdown remark-gfm
```

Only two packages. `react-markdown` renders `.md` strings as React elements. `remark-gfm` adds GitHub-Flavoured Markdown support (tables, strikethrough, autolinks, task lists).

No syntax highlighting library is needed initially — can be added later if code blocks appear in user docs.

### 2. Organise the `docs/user/` source folder

The existing folder is flat. Introduce numbered folder prefixes for ordering and group related pages:

```
docs/user/
  readme.md                          (central description, already exists)
  01-getting-started/
    overview.md                      (moved from root, fleshed out)
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

Numbered prefixes (`01-`, `02-`) control sidebar ordering. They are stripped from display labels at build time (details in Step 3).

### 3. Build the navigation tree generator

**File**: `apps/web/src/features/docs/utils/build-doc-tree.ts`

Uses Vite's `import.meta.glob` to discover every `.md` file under `docs/user/` at build time and produces a typed tree structure.

```ts
// ── types ──────────────────────────────────────────────────────────
/** A single markdown document resolved at build time. */
export interface DocNode {
  /** Display label derived from filename, e.g. "Overview" */
  label: string;
  /** URL-safe slug used in routing, e.g. "getting-started/overview" */
  slug: string;
  /** Raw markdown string (loaded eagerly via ?raw) */
  content: string;
}

/** A folder grouping with a display label and ordered children. */
export interface DocSection {
  label: string;
  children: DocNode[];
}

// ── glob import (Vite build-time) ──────────────────────────────────
//
// import.meta.glob eagerly imports every .md file under docs/user/ as
// raw text strings. The path is relative to the project root because
// Vite resolves from the workspace root where vite.config.ts lives
// (apps/web/).  The docs/ folder lives at the monorepo root, two
// levels up, so the glob anchor is "../../docs/user/".
//
// If Vite cannot resolve across the monorepo boundary, the fallback
// is to add an alias in vite.config.ts:
//   resolve.alias['@docs'] = path.resolve(__dirname, '../../docs/user')
// and glob from '@docs/**/*.md'.
//
const modules = import.meta.glob<string>(
  '../../docs/user/**/*.md',         // ← adjusted at implementation time
  { eager: true, query: '?raw', import: 'default' }
);

// ── helpers ────────────────────────────────────────────────────────
/** Strip numeric prefix: "01-getting-started" → "Getting Started" */
function prettifySegment(segment: string): string {
  return segment
    .replace(/^\d+-/, '')            // drop leading "01-"
    .replace(/\.md$/, '')            // drop extension
    .replace(/-/g, ' ')             // kebab → spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // title-case
}

/** "01-getting-started/overview.md" → "getting-started/overview" */
function toSlug(relativePath: string): string {
  return relativePath
    .replace(/^\d+-/gm, '')
    .replace(/\.md$/, '')
    .replace(/\\/g, '/');
}

// ── build ──────────────────────────────────────────────────────────
/**
 * Parse the glob results into an ordered section → doc tree.
 * Flat files (no subfolder) go into a "General" section.
 */
export function buildDocTree(): { sections: DocSection[]; flatMap: Map<string, DocNode> } {
  const sectionMap = new Map<string, DocNode[]>();
  const flatMap = new Map<string, DocNode>();

  for (const [rawPath, content] of Object.entries(modules)) {
    // rawPath example: "../../docs/user/01-getting-started/overview.md"
    const relative = rawPath.replace(/^.*docs\/user\//, '');  // "01-getting-started/overview.md"
    const parts = relative.split('/');

    const isNested = parts.length > 1;
    const folderKey = isNested ? parts[0] : '__root__';
    const fileName  = parts[parts.length - 1];

    const node: DocNode = {
      label: prettifySegment(fileName),
      slug: toSlug(isNested ? `${parts[0]}/${fileName}` : fileName),
      content: content as string,
    };

    flatMap.set(node.slug, node);

    if (!sectionMap.has(folderKey)) sectionMap.set(folderKey, []);
    sectionMap.get(folderKey)!.push(node);
  }

  // Sort sections by original key (numeric prefix preserves order)
  const sortedKeys = [...sectionMap.keys()].sort();
  const sections: DocSection[] = sortedKeys.map(key => ({
    label: key === '__root__' ? 'General' : prettifySegment(key),
    children: sectionMap.get(key)!,
  }));

  return { sections, flatMap };
}
```

### 4. Create the docs sidebar component

**File**: `apps/web/src/features/docs/components/docs-sidebar.tsx`

A custom sidebar (not `VerticalTabNav`) because docs navigation uses section headers derived from data rather than a static `TabConfig[]` array with icons. Uses `NavLink` for active-state styling.

```tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { DocSection } from "../utils/build-doc-tree";

interface DocsSidebarProps {
  sections: DocSection[];
}

/**
 * Docs sidebar navigation.
 * Renders a collapsible section list generated from the docs/user/ folder tree.
 */
export const DocsSidebar: React.FC<DocsSidebarProps> = ({ sections }) => {
  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 border-r border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/60 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
          <h2 className="text-lg font-bold">Documentation</h2>
        </div>
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.children.map((doc) => (
                  <li key={doc.slug}>
                    <NavLink
                      to={`/docs/${doc.slug}`}
                      className={({ isActive }) =>
                        [
                          "block px-3 py-2 text-sm rounded-lg transition-colors",
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                        ].join(" ")
                      }
                    >
                      {doc.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
```

### 5. Create the markdown viewer component

**File**: `apps/web/src/features/docs/components/markdown-viewer.tsx`

Reads the `*` splat from React Router, looks up the doc node from the flat map, and renders via `react-markdown`.

```tsx
import React from "react";
import { useParams, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocNode } from "../utils/build-doc-tree";

interface MarkdownViewerProps {
  flatMap: Map<string, DocNode>;
  defaultSlug: string;
}

/**
 * Renders a single markdown document from the docs tree.
 * Falls back to the default slug when the path matches nothing.
 */
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ flatMap, defaultSlug }) => {
  // React Router v7 splat: "/docs/getting-started/overview" → "*" = "getting-started/overview"
  const params = useParams();
  const slug = params["*"] || defaultSlug;
  const doc = flatMap.get(slug);

  if (!doc) {
    return <Navigate to={`/docs/${defaultSlug}`} replace />;
  }

  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {doc.content}
      </ReactMarkdown>
    </article>
  );
};
```

**Tailwind prose note**: The `@tailwindcss/typography` plugin provides the `prose` class for styled markdown output. If not already installed, add it:

```bash
pnpm --filter web add @tailwindcss/typography
```

### 6. Create the docs layout component

**File**: `apps/web/src/features/docs/components/docs-layout.tsx`

Composes sidebar + viewer. Calls `buildDocTree()` once (module-level, since it's based on eager imports).

```tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { buildDocTree } from "../utils/build-doc-tree";
import { DocsSidebar } from "./docs-sidebar";
import { MarkdownViewer } from "./markdown-viewer";

/** Build tree once at module load (all data is already eagerly imported). */
const { sections, flatMap } = buildDocTree();
const defaultSlug = sections[0]?.children[0]?.slug ?? "";

/**
 * Docs feature layout.
 * Sidebar on left, markdown content on right.
 * Designed to sit inside PublicLayout's <Outlet />.
 */
export const DocsLayout: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] -mx-4 sm:-mx-6 -mt-16">
      <DocsSidebar sections={sections} />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <MarkdownViewer flatMap={flatMap} defaultSlug={defaultSlug} />
      </main>
    </div>
  );
};
```

### 7. Add barrel export

**File**: `apps/web/src/features/docs/index.ts`

```ts
export { DocsLayout } from "./components/docs-layout";
```

### 8. Wire into routes

**File**: `apps/web/src/app/routes.tsx`

Add the `/docs` route as a new child under `PublicLayout`, alongside the existing landing pages:

```tsx
// New import
import { DocsLayout } from "../features/docs";

// Inside useRoutes array, add to the PublicLayout children:
{
  path: "/",
  element: <PublicLayout />,
  children: [
    { index: true, element: <LandingPage /> },
    { path: "about", element: <AboutPage /> },
    { path: "usage", element: <UsagePage /> },
    { path: "docs/*", element: <DocsLayout /> },   // ← NEW
  ],
},
```

### 9. Add "Docs" link to public nav

**File**: `apps/web/src/components/layout/public-layout.tsx`

Add `{ to: "/docs", label: "Docs" }` to the existing `navItems` array:

```ts
const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/usage", label: "Usage" },
  { to: "/docs", label: "Docs" },   // ← NEW
];
```

### 10. Add Vite alias (if cross-root glob fails)

Vite may not resolve `../../docs/user/` from `apps/web/`. If the glob returns an empty object, add an alias in `apps/web/vite.config.ts`:

```ts
resolve: {
  alias: {
    '@web': path.resolve(__dirname, './src'),
    '@docs': path.resolve(__dirname, '../../docs/user'),  // ← NEW
  }
}
```

Then update the glob in `build-doc-tree.ts` to:

```ts
const modules = import.meta.glob<string>(
  '@docs/**/*.md',
  { eager: true, query: '?raw', import: 'default' }
);
```

And adjust the relative-path stripping regex accordingly.

---

## Scope Notes

**In scope**:
- `features/docs/` module with sidebar, markdown viewer, tree builder
- Public `/docs/*` routes under `PublicLayout`
- `react-markdown` + `remark-gfm` dependencies
- `@tailwindcss/typography` for prose styling
- Organising `docs/user/` into numbered sections

**Out of scope** (future):
- Search within docs (can add a client-side filter over the flat map later)
- Versioned docs (no requirement currently)
- Table-of-contents sidebar within a single page
- Syntax-highlighted code blocks (add `rehype-highlight` when needed)
- Edit-on-GitHub links

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Vite glob fails across monorepo root boundary | Alias fallback (`@docs`) documented in Step 10 |
| `prose` class missing without typography plugin | Step 5 includes install command; can also fall back to manual Tailwind classes |
| Empty `docs/user/` folder at build time → no sidebar | `buildDocTree()` returns empty sections array; `DocsLayout` gracefully shows nothing or a placeholder |
| Markdown images with relative paths break | Author docs with repo-relative paths; Vite serves from public/ or resolve via alias |
| New `.md` files not detected in dev | Vite HMR picks up glob changes; worst case: restart dev server |

---

## Estimated Files Changed

| Action | File |
|--------|------|
| **Install** | `react-markdown`, `remark-gfm`, `@tailwindcss/typography` |
| **Create** | `apps/web/src/features/docs/utils/build-doc-tree.ts` |
| **Create** | `apps/web/src/features/docs/components/docs-sidebar.tsx` |
| **Create** | `apps/web/src/features/docs/components/markdown-viewer.tsx` |
| **Create** | `apps/web/src/features/docs/components/docs-layout.tsx` |
| **Create** | `apps/web/src/features/docs/index.ts` |
| **Edit** | `apps/web/src/app/routes.tsx` (add `/docs/*` route) |
| **Edit** | `apps/web/src/components/layout/public-layout.tsx` (add nav link) |
| **Edit** | `apps/web/vite.config.ts` (add `@docs` alias if needed) |
| **Organise** | `docs/user/` folder structure (numbered sections) |

---

## Patterns Referenced

- **Feature module isolation**: Same pattern as `features/landing/`, `features/settings/`, `features/debug/`
- **Sidebar + Outlet layout**: Follows `SettingsView` (`VerticalTabNav` + `<Outlet />`), adapted for data-driven nav
- **Public routing**: Extends `PublicLayout` children in `routes.tsx`, identical to how landing pages were added
- **Build-time data loading**: Vite `import.meta.glob` with `eager: true` + `?raw` — no runtime fetch, no API