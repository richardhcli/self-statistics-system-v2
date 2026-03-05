# Daily Log: 2026-03-05 — User Docs Viewer & Tailwind Migration

## Summary
Implemented the in-app user documentation viewer and migrated Tailwind CSS from CDN to PostCSS.

## Changes

### Tailwind CSS Migration (CDN → PostCSS v4-native)
- **Removed** CDN `<script src="https://cdn.tailwindcss.com">` and inline config from `index.html`
- **Replaced** v3-style `tailwind.config.js` with Tailwind v4 CSS-native directives in `global.css`:
  - `@source` for content scanning (replaces `content` array)
  - `@variant dark` for class-based dark mode (replaces `darkMode: 'class'`)
  - `@theme` for font override (replaces `theme.extend`)
  - `@plugin` for typography (replaces `plugins` array)
- **Deleted** `apps/web/tailwind.config.js` — no longer needed; v4 ignores `content`/`safelist` when `@config` is used
- **Root cause of broken styles**: `@config` directive caused Tailwind v4 to silently ignore the `content` array, resulting in zero utility classes generated
- **Moved** Google Fonts from CSS `@import url(...)` to HTML `<link>` tags with `preconnect` hints (better performance, avoids CSS ordering issue with PostCSS)
- Tailwind v4 (`4.2.1`) with `@tailwindcss/postcss` now processes all utility classes at build time

### User Docs Viewer Feature (`/docs/*`)
- Created `features/docs/` module: tree builder, sidebar, markdown viewer, layout
- 8 markdown files organized under `docs/user/` in 3 numbered sections
- Build-time `import.meta.glob` loads all docs eagerly via `@docs` Vite alias
- `react-markdown` + `remark-gfm` for rendering, `prose` classes from typography plugin

### Path Aliases
- Added `@docs` alias to both `vite.config.ts` and `tsconfig.json` pointing to `<root>/docs/`
- Added `server.fs.allow` for monorepo root so Vite can serve files from `docs/`

### About Page Fix
- Rewrote `about-page.tsx` to fix mojibake (double-encoded UTF-8 smart quotes) and JSX errors from manual edits

## Files Changed
| Action | File |
|--------|------|
| Edit | `apps/web/index.html` (remove CDN, add font links) |
| Edit | `apps/web/src/assets/css/global.css` (add Tailwind entry point) |
| Edit | `apps/web/vite.config.ts` (add `@docs` alias, `fs.allow`) |
| Edit | `apps/web/tsconfig.json` (add `@docs/*` path) |
| Edit | `apps/web/src/app/routes.tsx` (add `/docs/*` route) |
| Edit | `apps/web/src/components/layout/public-layout.tsx` (add Docs nav link) |
| Rewrite | `apps/web/src/features/landing/components/about-page.tsx` |
| Create | `apps/web/src/features/docs/` (full module) |
| Create | `docs/user/` (8 markdown files, 3 sections) |
| Create | `docs/dev/features/features-docs.md` |
| Edit | `docs/dev/tech-stack.md` (add `@docs` alias, clarify Tailwind PostCSS) |
| Edit | `docs/dev/features/features-landing.md` (add `/docs/*` route) |
| Edit | `.ai/action-plans/2026-03-05-user-docs-view.md` (status → Implemented) |

## Validation
- `pnpm --filter web typecheck` — 0 errors
- Vite dev server starts clean with no PostCSS errors
- All public routes render (/, /about, /usage, /docs/*)
