# MegiLance Frontend: Architecture Overview and Consolidation Plan

This document summarizes the current project structure, identifies duplication and routing conflicts, and outlines a single-source-of-truth (SSOT) consolidation plan aligned with `frontend/PROJECT_PAGES.md`.

## Current Structure (High-Level)

- `app/`
  - `(auth)/`
    - `login/`, `signup/`, `forgot-password/`, `reset-password/`
    - `auth-dashboard/` (component library reused by portal dashboard)
  - `(portal)/`
    - `dashboard/` (main portal dashboard + subroutes: `analytics/`, `community/`, `projects/`, `wallet/`)
    - `messages/` (route that reuses the `app/Messages` component library)
    - `client/` (projects, payments, reviews, settings, etc.)
    - `admin/` (dashboard, users, projects, payments, support, ai-monitoring, settings)
    - `audit-logs/`, `notifications/`, `search/`, `help/`
  - Public routes and pages per `PROJECT_PAGES.md` (home, blog, pricing, faq, etc.)
  - `Messages/` (feature component library for the Messages experience)
  - `components/` (shared UI)
  - `layouts/` (shared layouts)
- `legacy/`
  - `admin/`, `client/`, `audit-logs/` (moved from conflicting root app routes)
- `lib/utils.ts` (contains `cn` helper)
- `jsconfig.json` (path alias: `@/*`)

## Duplications and Conflicts (Found and Addressed)

- Duplicate routes due to route-group ignoring in Next.js:
  - `app/admin` vs `app/(portal)/admin` → moved root `app/admin` to `legacy/admin/`.
  - `app/client` vs `app/(portal)/client` → moved root `app/client` to `legacy/client/`.
  - `app/audit-logs` vs `app/(portal)/audit-logs` → moved root `app/audit-logs` to `legacy/audit-logs/`.
- `(auth)/dashboard` vs `(portal)/dashboard` conflict:
  - Renamed `(auth)/dashboard` → `(auth)/auth-dashboard` and updated imports in `app/(portal)/dashboard/Dashboard.tsx`.
- Messages global CSS in component file:
  - Moved global CSS imports to `app/(portal)/messages/page.tsx` per App Router rules.

## Known Remaining Build Issues (as of this audit)

- Messages build error persists referencing `ConversationList` even after fixing relative types imports and relocating global CSS.
  - Hypotheses:
    - Residual module resolution due to cache; or another import path typo.
    - A separate module-not-found elsewhere halting the build with a misleading trace.
- Many files import `@/lib/utils` and the file exists (`lib/utils.ts`) with `cn`. This should be resolved with `jsconfig.json`.

## Single Source of Truth (SSOT) Plan

- Portal routes live only under `app/(portal)/...`.
- Auth routes live only under `app/(auth)/...`.
- Reusable dashboard pieces from auth reside under `app/(auth)/auth-dashboard/` strictly as a component library (no page routing).
- Messages UI components live in `app/Messages/` and are consumed by `app/(portal)/messages/page.tsx`.
- Any former root routes (`app/admin`, `app/client`, `app/audit-logs`) remain in `legacy/` for reference and will be removed once parity is confirmed.

## Standardization Rules

- Path aliases: use `@/*` (configured in `jsconfig.json`).
- No cross-group page routing: only component reuse between route groups.
- Global CSS imports only at route level (`page.tsx`), not inside components.
- Per-component styling with `.common.module.css`, `.light.module.css`, `.dark.module.css`.

## Consolidation and Fix Plan (Batch Execution)

1) Build Stabilization
   - Ensure `@/lib/utils` resolves everywhere (already present and aliased).
   - Re-run `npm run build` and fix the first missing module or path error reported.
   - Verify Messages feature:
     - Confirm `app/(portal)/messages/page.tsx` imports `@/app/Messages/Messages` and its CSS at route-level.
     - Confirm all Messages subcomponents import `../types` (done for `ConversationList` and `ChatWindow`).
     - Confirm `app/api/messages` routes read/write JSON from `db/messages.json` without path errors.

2) Route Hygiene
   - Enforce no pages outside `(auth)` and `(portal)` that overlap those segments.
   - Keep `legacy/` folders out of `app/` to avoid collisions (done).

3) Lint/ARIA Clean-up (post-build green)
   - Fix remaining ARIA attribute warnings in `app/(portal)/client/...` and `app/(portal)/admin/...`.

4) Documentation
   - Keep this file updated; add a ROUTES_MAP.md indexing each user-facing page to its component.

## Immediate Next Actions

- Re-run production build to surface current blocking error.
- Patch the missing/incorrect import(s) until the build succeeds.
- After green build, run a quick lint pass and fix ARIA issues flagged.

