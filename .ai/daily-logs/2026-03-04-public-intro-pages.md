# 2026-03-04 — Public Intro Pages

## Changelog
- Added public layout shell with lightweight nav/footer for unauthenticated visitors.
- Built landing, about, and usage pages (hero, philosophy, loop walkthrough) with CTAs into login/app.
- Routed `/`, `/about`, `/usage` through PublicLayout; catch-all now redirects to `/`.
- App persistence gate now applies only to `/app/*` so public pages render without waiting for IndexedDB.

## Documentation
- Added [docs/dev/features/features-landing.md](../../docs/dev/features/features-landing.md).
- Updated [docs/dev/authentication/frontend-authentication.md](../../docs/dev/authentication/frontend-authentication.md) to reflect public routes and gating.
- Marked action plan [2026-03-04-public-intro-pages.md](../action-plans/2026-03-04-public-intro-pages.md) as implemented with completion notes.

## Follow-ups
- Replace placeholder screenshot blocks on usage page once assets are ready.
- Consider SEO/meta tags for public routes in a future pass.