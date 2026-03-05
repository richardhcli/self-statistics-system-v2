# Action Plan: Tailwind v4 PostCSS Migration (CDN → Build-Time)

**Date**: March 5, 2026
**Purpose**: Fix broken Tailwind styling by properly configuring Tailwind v4 PostCSS pipeline with CSS-native configuration
**Status**: Implemented

---

## Root Cause

The migration from CDN to PostCSS broke all styling because:

1. `global.css` uses `@config "../../../tailwind.config.js"` to reference a v3-style JS config
2. **Tailwind v4 ignores the `content` array when `@config` is present** — content detection must use `@source` directives instead
3. **Tailwind v4 ignores the `safelist` array when `@config` is present** — safelisting must use `@source inline()` instead
4. Without source scanning, zero utility classes are generated → page renders as plain unstyled HTML

The archived `2026-02-01-CSS_RENDERING_FIX.md` concluded that PostCSS couldn't handle dynamic classes — this was a v3-era finding. Tailwind v4's scanner detects both branches of ternary expressions in string literals. A full audit of the codebase confirms all dynamic patterns are safe.

## Solution: CSS-Native Tailwind v4 Configuration

Replace the v3 `tailwind.config.js` entirely with Tailwind v4's CSS-native directives in `global.css`:

| v3 JS Config | v4 CSS Directive |
|--------------|-----------------|
| `content: [...]` | `@source "..."` (auto-detection + explicit sources) |
| `darkMode: 'class'` | `@variant dark (&:where(.dark, .dark *))` |
| `theme.extend.fontFamily.sans` | `@theme { --font-sans: 'Inter', sans-serif; }` |
| `safelist: [...]` | `@source inline("...")` |
| `plugins: []` | `@plugin "..."` (already done for typography) |

---

## Steps

### 1. Rewrite `global.css` Tailwind directives

Replace the current header:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@config "../../../tailwind.config.js";
```

With CSS-native v4 configuration:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* Source scanning: component files + HTML entry */
@source "../../**/*.{ts,tsx,js,jsx,html}";
@source "../../../index.html";

/* Dark mode: class-based toggling */
@variant dark (&:where(.dark, .dark *));

/* Theme: font override */
@theme {
  --font-sans: 'Inter', sans-serif;
}
```

Paths are relative to `global.css` at `apps/web/src/assets/css/`:
- `../../**/*` → `apps/web/src/**/*` (all components)
- `../../../index.html` → `apps/web/index.html`

### 2. Delete `tailwind.config.js`

The v3-style config is no longer consumed. Remove `apps/web/tailwind.config.js`.

### 3. Validate rendering

- Run `pnpm --filter web typecheck`
- Start dev server and visually verify: `/`, `/about`, `/usage`, `/docs/*`
- Check that dynamic class patterns render (toggle states, active tabs, etc.)

### 4. Update documentation

- Update `docs/dev/tech-stack.md` to reflect CSS-native config
- Update daily log
- Archive this action plan

---

## Dynamic Class Audit Summary

32 dynamic class patterns found across the codebase. All are safe for build-time scanning:

- **Low risk (28 patterns)**: Ternary expressions with complete string literals — both branches are visible to the scanner.
- **Medium risk (4 patterns)**: Classes from switch/Record/object lookups (`log-item.tsx`, `persistence-view.tsx`, `datastores-console.tsx`). The class strings are defined as literals in the same files, so the scanner can detect them.

No `clsx`/`twMerge` usage. No classes constructed from string concatenation. No safelist needed beyond what auto-detection provides.

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Some dynamic classes missed by scanner | Audit confirms all class literals are in scanned files. Add `@source inline()` if any are discovered |
| Other CSS files outside `src/` contain Tailwind | Only `global.css` and `layout.css` exist — both in `src/assets/css/` |
| Typography plugin incompatible with v4 | `@tailwindcss/typography@0.5.19` supports v4 via `@plugin` directive |
| `darkMode: 'class'` behavior differs | v4 `@variant dark` directive provides identical behavior |
