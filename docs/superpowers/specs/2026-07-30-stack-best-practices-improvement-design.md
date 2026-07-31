# Stack Best-Practices Improvement — Design Spec

**Date:** 2026-07-30
**Branch context:** `feat/sprint2-wave2-ui-updates` (work to be done on new dedicated branches per phase)
**Drivers:** production security · developer velocity · stability/quality

## Context

Audit of the Alanya Holidays monorepo (React 19 frontend ~84.7k LOC, NestJS backend
~12.1k LOC, Deno edge functions ~5.5k LOC, Supabase/Postgres with 114 migrations,
deployed on Hostinger VPS behind Nginx). The codebase is production-grade: strong CI
(audit → lint → type-check → test → coverage → deno → build), clean edge functions
(0 `console.log`, Stripe signature verification, rate limiting), no secrets in git, and
security maturity (e.g. the vote-RPC fix migration documents the anon-EXECUTE footgun).

This spec addresses the concrete best-practice gaps found during the audit. It is scoped
to real findings — no speculative refactoring.

## Findings (audit results)

| ID | Severity | Status | Finding |
|----|----------|--------|---------|
| BE-1 | 🔴 Critical | verified | NestJS backend has **no server-side input validation** — no `ValidationPipe`, no `class-validator`, no Zod (0 matches), 0 validated `.dto.ts`. `main.ts` wires only `GlobalHttpExceptionFilter`. Controllers do raw `JSON.parse(filters)` on query params (`properties.controller.ts:247`, `services.controller.ts:174`) → 500 on malformed input, no schema check on bodies. Backend is publicly reachable via Nginx and handles bookings/payments. |
| DB-1 | 🟠 High | needs audit | `SECURITY DEFINER` functions potentially missing `SET search_path = public`. File-level grep flags up to 10 migrations, but ~half are REVOKE/GRANT/trigger migrations (string in comment, not a live function body). Real count requires per-function audit. |
| BE-2 | 🟠 Medium | needs audit | Other service-role RPC calls (`track_listing_view`, `track_listing_click`, claim RPCs, `increment_forum_post_view`, `increment_blog_views`) may resolve the acting user via `auth.uid()`, which is NULL under the service-role singleton client. The vote RPCs were already fixed (migration `20260721181153`); apply the same `p_user_id` + REVOKE-anon pattern where a counter/action attributes to a user. |
| FE-1 | 🟠 Medium | verified | 3 import cycles in the blog module via barrel `frontend/modules/blog/index.ts`: `BlogPostCard.tsx → modules/blog/index.ts → {BlogPage,BlogCategoryPage,BlogPostPage} → BlogPostCard.tsx`. Breaks tree-shaking; init-order risk. |
| FE-2 | 🟢 Medium | verified | God files: `types/models.ts` (805), `routes/AppRoutes.tsx` (586), `pages/DirectoryCategoryPage.tsx` (577), `components/directory/DirectoryMapView.tsx` (552). Only the first two are in scope. |
| Q-1 | 🟢 Low | needs audit | Silent error swallowing (`|| 0`, unchecked `Promise.all` element `.error`) per the project's own CLAUDE.md anti-pattern. |
| Q-2 | 🟢 Low | verified | 23 frontend files use `setInterval`/`setTimeout`/`addEventListener`/`.subscribe(` — spot-check each `useEffect` returns a cleanup function. |
| Q-3 | 🟢 Low | verified | 17 `as any` + 4 `@ts-ignore` in app code (excludes tests). Replace with correct types. |

**Explicitly NOT in scope (YAGNI):** `console.log` in `frontend/scripts/*` (CLI seed scripts, acceptable); wholesale god-file refactor beyond the two named files; new abstractions "for the future".

## Plan — 3 phases, each an independent PR

Acceptance for every phase: green CI (lint, type-check, all tests, coverage, build) with
0 new warnings. Cheap/low-risk tasks first within each phase.

### Phase 1 — Production security (PR 1)

1. **DB-1** — Per-function `SECURITY DEFINER` audit. For each live function definition
   missing `SET search_path = public`, add it via a new append-only migration
   (`YYYYMMDDHHMMSS_add_search_path_to_definer_functions.sql`) with a purpose comment.
   If the audit finds 0 real cases, document that and close DB-1 without a migration.
2. **BE-2** — Audit the listed service-role RPCs. For any that attribute an action to a
   user via `auth.uid()`, add an explicit `p_user_id` param (server-verified by
   `AuthGuard`) plus a REVOKE-from-anon block, mirroring migration `20260721181153`.
   View/click counters that do not attribute to a user need no change.
3. **BE-1** — Add a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true,
   transform: true })` in `main.ts`. Introduce `class-validator`/`class-transformer` DTOs
   for controller `@Body()` and `@Query()` inputs, starting with money/booking paths
   (bookings, checkout/webhooks-adjacent, properties, directory). Replace raw
   `JSON.parse(filters)` with typed, validated query DTOs. Keep existing response shapes.

### Phase 2 — Developer velocity (PR 2)

4. **FE-1** — Break the 3 blog cycles: import `BlogPostCard` directly from its module path
   in `BlogPage`/`BlogCategoryPage`/`BlogPostPage` instead of through the barrel; verify
   the barrel no longer re-imports the pages that import it. Confirm no new cycles.
5. **FE-2 (narrow)** — Split `types/models.ts` into domain-scoped type modules
   (e.g. `types/property.ts`, `types/directory.ts`, `types/booking.ts`, …) with a
   re-export barrel to preserve existing import paths. Split `routes/AppRoutes.tsx` into
   route groups (e.g. by domain), keeping `React.lazy` boundaries intact. Do NOT touch
   `DirectoryCategoryPage.tsx` or `DirectoryMapView.tsx`.

### Phase 3 — Stability / quality (PR 3)

6. **Q-1** — Grep for `|| 0` and multi-await `Promise.all` sites; for each, add
   `.error` checks/logging and switch to `??` where `0`/`false` are valid values.
7. **Q-2** — Review the 23 effect files; add missing cleanup (clearInterval/clearTimeout/
   removeEventListener/unsubscribe) where absent.
8. **Q-3** — Replace the 17 `as any` and 4 `@ts-ignore` with proper types; where a type is
   genuinely unavailable, narrow with a documented type guard instead of suppression.

## Risks & mitigations

- **BE-1 could break existing clients** if the frontend sends fields the DTO rejects
  (`forbidNonWhitelisted`). Mitigation: introduce DTOs path-by-path, run E2E smoke after
  each controller, start with `whitelist` (strip) before `forbidNonWhitelisted` (reject).
- **DB migrations are append-only.** DB-1/BE-2 migrations must be additive and tested with
  `supabase db reset` locally before push.
- **FE-2 type split** risks import churn. Mitigation: keep a re-export barrel so no call
  sites change; rely on type-check to catch misses.

## Out of scope / follow-ups
- Deeper god-file decomposition (Directory pages) — revisit only when next touched.
- Bundle-size / code-splitting review beyond existing `React.lazy` usage.
