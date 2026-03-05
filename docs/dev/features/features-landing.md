# Feature: Landing (Public Intro)
**Last updated**: 2026-03-04

## What It Does
- Public-facing entry for visitors before authentication (home, about, usage).
- Lightweight layout with top nav, footer, and CTA to login/app.
- Mirrors visual language of the auth page using Tailwind slate/indigo palette.

## Core Files (Start Here)
- Public shell: [apps/web/src/components/layout/public-layout.tsx](../../apps/web/src/components/layout/public-layout.tsx)
- Landing page: [apps/web/src/features/landing/components/landing-page.tsx](../../apps/web/src/features/landing/components/landing-page.tsx)
- About page: [apps/web/src/features/landing/components/about-page.tsx](../../apps/web/src/features/landing/components/about-page.tsx)
- Usage walkthrough: [apps/web/src/features/landing/components/usage-page.tsx](../../apps/web/src/features/landing/components/usage-page.tsx)
- Feature exports: [apps/web/src/features/landing/index.ts](../../apps/web/src/features/landing/index.ts)

## Routes
- `/` → LandingPage (public)
- `/about` → AboutPage (public)
- `/usage` → UsagePage (public)
- `/auth/*` → Auth/Logout (public), unchanged
- `/app/*` → ProtectedRoute → MainLayout (authenticated)

## Behavior Notes
- Public pages bypass store/persistence gating; `/app/*` still waits for IndexedDB hydration.
- CTA button routes to `/app/journal` if authenticated, otherwise `/auth/login`.
- Public layout does not pull Zustand stores or global headers to keep load fast.