# Frontend Remaining Work

_Last reviewed: 2026-08-27_

## Scope of this document

This file tracks **only frontend-facing work** that is already surfaced in the product.

Included surfaces:
- `frontend/src/pages/admin/*`
- `frontend/src/pages/explore/page.tsx`
- `frontend/src/pages/business/page.tsx`
- `frontend/src/pages/business/dashboard/page.tsx`
- `frontend/src/pages/blog/*`
- `frontend/src/pages/forum/*`
- `frontend/src/pages/events*`
- `frontend/src/pages/shop/*`
- `frontend/src/pages/planner/page.tsx`
- `frontend/src/pages/settings/page.tsx`
- `frontend/src/pages/villa-stays/page.tsx`
- `frontend/src/pages/yacht-charters/page.tsx`

Explicitly **out of scope for now**:
- guest booking checkout flow
- host lifecycle / property-host tooling
- backend-only admin CRUD with no frontend surface yet
- dormant backend domains that are not currently exposed in UI

---

## What is already in good shape

### Admin sync is meaningfully better now
Recent work already improved the most important admin/frontend synchronization risks:
- admin tabs can use strict API error mode via `throwOnError`
- most admin tabs now auto-refresh through `frontend/src/hooks/useAutoRefresh.ts`
- admin hub badge counts are refreshed from live sources
- forum moderation now shows explicit error state instead of silently degrading
- removed forum posts are no longer accessible to public users through direct URL

Relevant files:
- `frontend/src/api-services/admin.service.ts`
- `frontend/src/hooks/useAutoRefresh.ts`
- `frontend/src/pages/admin/page.tsx`
- `frontend/src/pages/admin/components/ForumModerationTab.tsx`
- other admin tab components under `frontend/src/pages/admin/components/`

### Core live frontend surfaces look mostly correct
These surfaces are already primarily live-data driven and are not the main risk area:
- `frontend/src/pages/explore/page.tsx`
- `frontend/src/pages/business/dashboard/page.tsx`
- `frontend/src/pages/settings/page.tsx`
- most of shop/admin/forum/blog moderation flows

The remaining issues are less about missing backend wiring and more about:
1. local fallback behavior that can mask backend truth
2. inconsistent retry/error UX
3. unclear product signaling on enquiry-only pages

---

## Remaining frontend work by priority

## P0 — High priority

### 1) Clean up misleading local fallback behavior on live pages
There are still pages/components where frontend can quietly show curated local data after live API failure or missing backend records.

This is the biggest remaining frontend integrity risk because it can make admin changes appear "not synced" even when the backend is correct.

#### Highest-risk places

**Business detail page**
- File: `frontend/src/pages/business/page.tsx`
- Starts with synchronous local lookup:
  - `directoryService.getListingByIdSync(businessId)`
- Then loads live data asynchronously.
- Error retry currently uses full page reload:
  - `window.location.reload()`

**Directory service single listing fetch**
- File: `frontend/src/api-services/directory.service.ts`
- `getListingById()` falls back to `getListingByIdSync()`:
  - when backend returns empty data
  - on `404`
  - and even on some other fetch failures if local fallback exists

This is convenient for curated/demo content, but risky for pages meant to reflect actual directory moderation state.

**Embedded venue cards inside content**
- File: `frontend/src/components/article/EmbeddedVenueCard.tsx`
- Initializes from `getListingByIdSync()` before live fetch.
- Can temporarily show stale curated content even if live listing changed or disappeared.

#### Recommendation
Split listing reads into two explicit modes instead of one hybrid behavior:
- **live-strict mode** for pages that should mirror backend truth
- **curated-fallback mode** only where intentionally editorial/demo-driven

Practical first step:
- add an explicit option on directory fetch methods such as `allowSyncFallback?: boolean`
- set `allowSyncFallback: false` on `business/page.tsx` and any moderation-sensitive surface
- keep fallback only where product intentionally wants curated resilience

---

### 2) Standardize user-facing retry/error UX
Error handling is still inconsistent across frontend surfaces.

#### Current inconsistencies
- `frontend/src/pages/business/page.tsx` uses `ErrorState` but retries via hard reload
- `frontend/src/pages/shop/page.tsx` uses a custom inline error block and hard reload
- `frontend/src/pages/planner/page.tsx` suppresses supporting-data failures silently
- `frontend/src/pages/home/components/UpcomingEventsCarousel.tsx` swallows event fetch failures completely

#### Recommendation
Adopt one consistent pattern:
- local `loadData()` / `reload()` function per page
- retry button should call that function directly
- show explicit message when data is unavailable
- avoid `window.location.reload()` unless there is no component-level recovery path

This is frontend-only work and will make sync/debugging much easier.

---

### 3) Decide which pages are intentionally local-first vs expected to be backend-truth
Right now the codebase mixes two product modes:
- pages that should reflect current backend state
- pages that intentionally preserve curated content for resilience/marketing

That line is not documented clearly enough in code or UX.

#### Current examples
- `frontend/src/pages/villa-stays/page.tsx` starts from `propertiesService.getVillasSync()` and falls back to local villas if live API is empty/fails
- `frontend/src/pages/yacht-charters/page.tsx` starts from `conciergeService.getYachtsSync()` and keeps local curated yachts as base content
- `frontend/src/pages/home/components/UpcomingEventsCarousel.tsx` starts from `eventsService.getEventsSync()`
- `frontend/src/pages/planner/page.tsx` is local-first by product design, but supporting business/event lookups are live

#### Recommendation
Document and encode the product intent:
- **strict live**: admin, business dashboard, shop, business detail, explore
- **curated/enquiry-first**: villa stays, yacht charters, possibly some home content
- **local-first utility**: planner

This should be reflected both in code behavior and user messaging.

---

## P1 — Medium priority

### 4) Improve planner resilience and transparency
- File: `frontend/src/pages/planner/page.tsx`

Current behavior:
- businesses/events are fetched live
- failures are silently ignored in `.catch(() => {})`
- planner still works because plans are local-first via hooks, but users get no signal that suggestion/linking data is incomplete

#### Recommendation
Keep planner local-first, but add light transparency:
- small non-blocking banner if business/event suggestions failed to load
- distinguish between:
  - no saved plans
  - no supporting live suggestions
  - backend unavailable for enrichment

This is not a blocker, but it would reduce confusion.

---

### 5) Add admin freshness affordances
- File: `frontend/src/pages/admin/page.tsx`
- Related hook: `frontend/src/hooks/useAutoRefresh.ts`

Auto-refresh now exists, which is good.
What is still missing is explicit freshness signaling such as:
- "Auto-refresh every 30s"
- "Last updated 12s ago"
- maybe a small stale indicator if last refresh failed

This is not required for correctness, but it would help operators trust the admin panel more.

---

### 6) Replace hard page reload retry in shop
- File: `frontend/src/pages/shop/page.tsx`

Current retry strategy:
- `window.location.reload()`

Recommendation:
- extract current fetch logic into reusable `loadCatalog()` function
- retry should call `loadCatalog()`
- optionally preserve selected category while retrying

This is a small but worthwhile polish item.

---

### 7) Replace hard page reload retry in business detail
- File: `frontend/src/pages/business/page.tsx`

Current retry strategy:
- `window.location.reload()`

Recommendation:
- expose a local reload function that re-fetches listing + reviews
- if similar businesses fail, keep that non-blocking
- reserve full reload only for unrecoverable auth/router/session issues

---

## P2 — Product clarity / expectation management

### 8) Make enquiry-only flows visually explicit
These pages currently look rich enough that users may infer full inventory/booking behavior, while actual product behavior is enquiry-based.

#### Affected pages
- `frontend/src/pages/villa-stays/page.tsx`
- `frontend/src/pages/yacht-charters/page.tsx`

#### Recommendation
Add explicit product framing near hero or CTA area:
- "Enquiry-based availability"
- "Request options and we confirm manually"
- "Not instant booking"

That reduces the mismatch between curated cards and actual transaction model.

---

### 9) Review home/event carousel positioning
- File: `frontend/src/pages/home/components/UpcomingEventsCarousel.tsx`

Current behavior:
- initial events come from `eventsService.getEventsSync()`
- live fetch failures are swallowed silently
- if filtered date window yields zero events, component disappears

This is probably acceptable for homepage resilience, but product intent should be explicit:
- if homepage is meant to be marketing-first, current approach is defensible
- if homepage should reflect only live forum events, then sync fallback should be reduced

Not urgent, but worth deciding deliberately.

---

## Page-by-page assessment

### `frontend/src/pages/explore/page.tsx`
**Status:** mostly healthy

What looks good:
- live API-driven listing load
- uses abortable fetch pattern
- has explicit loading and error state

Remaining note:
- this page is in better shape than `business/page.tsx`; use it as the reference pattern for other list/detail pages

### `frontend/src/pages/business/page.tsx`
**Status:** functional but still sync-risky

Concerns:
- sync local bootstrap via `getListingByIdSync()`
- service-layer fallback can hide backend 404/removal cases
- retry is hard page reload
- similar business fetch errors are silently ignored

Recommended order:
1. make live fetch behavior explicit
2. restrict fallback usage
3. replace reload with local re-fetch

### `frontend/src/pages/business/dashboard/page.tsx`
**Status:** mostly healthy

What looks good:
- live dashboard fetch via `getMyListings()`, `getMyClaims()`, `getOwnerAnalytics()`
- proper auth gating
- clear role-based UX

Minor follow-up:
- unify error presentation beyond `alert()` in delete path later if desired

### `frontend/src/pages/villa-stays/page.tsx`
**Status:** intentionally hybrid, but should be clarified

What it does now:
- bootstraps with `propertiesService.getVillasSync()`
- tries live fetch from `getProperties({ type: "villa" })`
- if backend returns empty/fails, goes back to local villas
- user action is enquiry submission, not instant booking

Assessment:
- acceptable if this page is treated as curated enquiry inventory
- risky if users or admins expect strict backend-truth inventory

Need:
- product copy clarity
- explicit decision on whether empty backend should still show curated inventory

### `frontend/src/pages/yacht-charters/page.tsx`
**Status:** similar to villa stays

What it does now:
- bootstraps from `conciergeService.getYachtsSync()`
- fetches live yachts
- shows explicit fetch error, but still starts with curated base content

Need:
- same product clarity decision as villa stays
- ensure copy reflects enquiry workflow, not real-time charter booking

### `frontend/src/pages/planner/page.tsx`
**Status:** local-first by design, but supporting live data is too silent on failure

What looks correct:
- planner core is local-first and persists through hooks
- that matches the current product model well

Need:
- non-blocking messaging when live businesses/events fail to enrich planner

### `frontend/src/pages/shop/page.tsx`
**Status:** mostly good, minor UX cleanup left

What looks good:
- catalog and category loading are live
- loading / empty / error states are present

Need:
- replace hard reload retry with in-page retry
- optionally standardize error UI with shared `ErrorState`

### `frontend/src/pages/settings/page.tsx`
**Status:** healthy

What looks good:
- auth guard is clear
- tab state is URL-synced
- checkout return feedback is surfaced to user

No major frontend sync concern found here.

### `frontend/src/pages/admin/page.tsx`
**Status:** healthy after recent work

What looks good:
- live badge aggregation from admin APIs
- manual refresh exists
- auto-refresh exists
- permission gating is explicit

Remaining nice-to-have:
- add last-updated / stale-state indicator

---

## Recommended execution order

If continuing only on frontend, I would do the remaining work in this order:

1. **Directory/business truth cleanup**
   - `frontend/src/api-services/directory.service.ts`
   - `frontend/src/pages/business/page.tsx`
   - `frontend/src/components/article/EmbeddedVenueCard.tsx`

2. **Retry/error UX standardization**
   - `frontend/src/pages/shop/page.tsx`
   - `frontend/src/pages/business/page.tsx`
   - optionally shared pattern/component reuse

3. **Product clarity for enquiry pages**
   - `frontend/src/pages/villa-stays/page.tsx`
   - `frontend/src/pages/yacht-charters/page.tsx`

4. **Planner transparency improvements**
   - `frontend/src/pages/planner/page.tsx`

5. **Admin freshness indicator**
   - `frontend/src/pages/admin/page.tsx`
   - related admin tab headers if desired

---

## My recommendation on what to choose next

If the goal is **real sync confidence between admin actions and what users see on frontend**, the best next move is:

### Choose next: directory/business fallback cleanup
Why:
- it directly affects whether admin moderation changes are reflected on public pages
- it is the highest risk for false perception of "data still exists" after removal/change
- it improves trust in both admin and public frontend without touching dormant backend work

Concretely, the very next frontend task should be:
- make `directoryService.getListingById()` support strict live mode
- use strict live mode on `frontend/src/pages/business/page.tsx`
- then remove hard reload retry from that page

---

## Not in scope for now

Do **not** spend time on these yet unless product direction changes:
- booking guest checkout UI
- host-side property lifecycle UI
- admin UI for backend-only properties/services CRUD
- deeper backend consolidation of legacy product tables

These are valid future tasks, but they are not the highest-value frontend follow-up right now.
