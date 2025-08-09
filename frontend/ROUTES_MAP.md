# MegiLance Routes Map (App Router)

This map lists user-facing routes and their primary components. Routes under `(auth)` render without global chrome. Routes under `(portal)` render with portal chrome (sidebar, etc.).

## Auth
- /login → `app/(auth)/login/page.tsx` → `Login.tsx`
- /signup → `app/(auth)/signup/page.tsx` → `Signup.tsx`
- /forgot-password → `app/(auth)/forgot-password/page.tsx` → `ForgotPassword.tsx`
- /reset-password → `app/(auth)/reset-password/page.tsx` → `ResetPassword.tsx`

Notes:
- All auth pages use a two-panel grid layout via their `*.common.module.css` files.
- Branding panel is provided by `app/components/Auth/BrandingPanel/BrandingPanel.tsx` wrapped by a local `.brandingSlot` div.
- Breakpoints: mobile single-column; ≥768px two-column (brand | form); ≥1280px 1/1 columns.

## Portal (Authenticated/Preview)
- /dashboard → `app/(portal)/dashboard/page.tsx`
  - /dashboard/analytics → `app/(portal)/dashboard/analytics/page.tsx`
  - /dashboard/community → `app/(portal)/dashboard/community/page.tsx`
  - /dashboard/projects → `app/(portal)/dashboard/projects/page.tsx`
  - /dashboard/wallet → `app/(portal)/dashboard/wallet/page.tsx`
- /messages → `app/(portal)/messages/page.tsx`
- /notifications → `app/(portal)/notifications/page.tsx`
- /search → `app/(portal)/search/page.tsx`
- /help → `app/(portal)/help/page.tsx`
- /client/... → `app/(portal)/client/*`
- /admin/... → `app/(portal)/admin/*`
- /audit-logs → `app/(portal)/audit-logs/page.tsx`

Preview Mode:
- If `NEXT_PUBLIC_PREVIEW_MODE=1`, auth checks are bypassed and quick links appear on `/login`.

## Public
- / → `app/page.tsx` (Home)
- /about → `app/about/page.tsx`
- /blog → `app/blog/page.tsx`
- /blog/[slug] → `app/blog/[slug]/page.tsx`
- /contact → `app/contact/page.tsx`
- /pricing → `app/pricing/page.tsx`
- /faq → `app/faq/page.tsx`
- /jobs → `app/jobs/page.tsx`
- /clients → `app/clients/page.tsx`
- /freelancers → `app/freelancers/page.tsx`
- /legal/privacy → `app/legal/privacy/page.tsx`
- /legal/terms → `app/legal/terms/page.tsx`
- /security → `app/security/page.tsx`
- /support → `app/support/page.tsx`
- /teams → `app/teams/page.tsx`
- /testimonials → `app/testimonials/page.tsx`

## Conventions
- Per-component styles: `*.common.module.css`, `*.light.module.css`, `*.dark.module.css`.
- Combine common + theme classes with `cn(common[key], theme[key])` in components to avoid overwriting layout classes.
- Path alias: `@/*` (see `jsconfig.json`).
