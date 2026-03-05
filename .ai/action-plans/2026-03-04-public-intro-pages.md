# Action Plan: Public Intro Pages

**Date**: March 4, 2026  
**Purpose**: Add public-facing landing, about, and usage pages accessible before login  
**Status**: Implemented (public routes live)

---

## Overview

Currently, `/` redirects to `/app` which triggers `ProtectedRoute` → redirect to `/auth/login`. There are zero public-facing pages — just a login form. This plan adds a public landing page at `/`, plus `/about` and `/usage` info pages, all outside the auth gate.

### Architecture Decision

**Option chosen: New `features/landing/` feature module** with a lightweight public layout (no header tabs, no auth dependency). This keeps the existing authenticated app structure (`/app/*`) completely untouched.

```
Route Structure (After):
  /               → LandingPage (public)
  /about          → AboutPage (public)
  /usage          → UsagePage (public)
  /auth/login     → AuthView (public, existing)
  /auth/logout    → LogoutView (public, existing)
  /app/*          → ProtectedRoute → MainLayout → features (unchanged)
```

---

## Steps

### 1. Create public layout shell
**File**: `apps/web/src/components/layout/public-layout.tsx`

A minimal layout wrapper for public pages:
- Simple nav bar with logo/title + links (Home, About, Usage, Login)
- `<Outlet />` for page content
- No auth hooks, no Zustand stores
- Footer with minimal branding

### 2. Create landing feature module
**Directory**: `apps/web/src/features/landing/`

```
features/landing/
  components/
    landing-page.tsx      # Hero section, tagline, CTA → /auth/login
    about-page.tsx        # Project description, philosophy, tech overview
    usage-page.tsx        # How the system works, screenshots/diagrams
  index.ts                # Public exports
```

**Landing page content**:
- Hero: App name, tagline ("Gamify your growth"), brief description
- Feature highlights: Journal, AI Analysis, Progression System, Graph Topology
- CTA button → `/auth/login` (or `/app` if already logged in)

**About page content**:
- What is Self-Statistics System
- Philosophy: quantified self meets RPG progression
- Tech transparency (open source, local-first, Firebase)

**Usage page content**:
- Step-by-step walkthrough of the core loops
- Screenshots or placeholder diagrams for: journaling, AI analysis, graph building, stats dashboard

### 3. Update routes
**File**: `apps/web/src/app/routes.tsx`

Changes:
- `/` → `<PublicLayout>` with `<LandingPage />` as index (instead of redirect to `/app`)
- Add `/about` and `/usage` as children of `<PublicLayout>`
- Update catch-all `*` to redirect to `/` instead of `/app`
- Keep `/auth/*` and `/app/*` routes unchanged

```tsx
// New route structure
{ 
  path: "/",
  element: <PublicLayout />,
  children: [
    { index: true, element: <LandingPage /> },
    { path: "about", element: <AboutPage /> },
    { path: "usage", element: <UsagePage /> },
  ]
},
{ path: "/auth/login", element: <AuthView /> },
{ path: "/auth/logout", element: <LogoutView /> },
{ path: "/app", element: <ProtectedRoute />, children: [...] },
{ path: "*", element: <Navigate to="/" replace /> },
```

### 4. Add "Get Started" / "Login" navigation
- Public layout nav: links to `/`, `/about`, `/usage`, `/auth/login`
- Landing page CTA button → `/auth/login`
- If user is already logged in (optional enhancement): CTA → `/app` instead

### 5. Style with existing Tailwind
- Use the existing Tailwind + dark mode utilities (`dark:bg-slate-900`, etc.)
- Match the visual language of the login page (slate/indigo palette)
- No new CSS dependencies needed

### 6. Update documentation
- Update `docs/dev/features/` with a `features-landing.md` if substantial
- Update route table in relevant docs

---

## Scope Notes

**In scope**:
- Public layout shell, 3 pages (landing, about, usage), route changes

**Out of scope** (future):
- SEO meta tags / SSR (Vite SPA, no SSR currently)
- CMS-driven content
- Animated demos or interactive tutorials

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking existing `/app` routes | Public routes are siblings, not parents — zero overlap |
| Auth redirect loop | `ProtectedRoute` only wraps `/app/*`, public routes bypass it entirely |
| Persistence init delay on public pages | `usePersistence()` runs in `App` — could add a fast-path that skips waiting for IndexedDB on public routes if needed |

---

## Estimated Files Changed

| Action | File |
|--------|------|
| **Create** | `apps/web/src/components/layout/public-layout.tsx` |
| **Create** | `apps/web/src/features/landing/components/landing-page.tsx` |
| **Create** | `apps/web/src/features/landing/components/about-page.tsx` |
| **Create** | `apps/web/src/features/landing/components/usage-page.tsx` |
| **Create** | `apps/web/src/features/landing/index.ts` |
| **Edit** | `apps/web/src/app/routes.tsx` |

## Next

One consideration: The App component currently blocks rendering until IndexedDB persistence initializes (usePersistence()). Public pages don't need stores, so we may want to fast-path past that wait on public routes. This is an optional optimization.
Create a plan-of-action to only block rendering upon the actual web app view, not the public pages. 

---

## Completion Notes (2026-03-04)
- Public layout and landing/about/usage pages shipped under `/`, `/about`, `/usage`.
- Route catch-all now returns to `/` instead of `/app`.
- Persistence gate only applies to `/app/*` protected routes to keep public pages instant.

