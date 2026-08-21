# Project: Alanya Holidays Platform Stage 2 Overhaul

## Architecture
Alanya Holidays is a full-stack platform consisting of:
- **Backend**: NestJS (TypeScript) with Modular Clean Architecture (`domain/`, `application/`, `infrastructure/`, `presentation/`), Supabase / PostgreSQL database, TypeORM / Supabase Client repository pattern, and JWT / AuthGuard authentication.
- **Frontend**: React 19 (Vite + TypeScript), React Router, TailwindCSS, Lucide React icons, Recharts for analytics visualization, and Clean Architecture API services layer (`frontend/src/api-services/`).
- **Database & Storage**: Supabase PostgreSQL with RLS policies, custom SQL migration scripts (`supabase/migrations/`), and stored procedures/RPCs for atomic operations (e.g. `approve_listing_claim`, `reject_listing_claim`, `get_directory_analytics_for_owner`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Draft Status Schema Migration | Update `directory_listings` CHECK constraint to include `'draft'` and adjust RLS policies for owner draft management. | M1 | R1 |
| F2 | Backend Draft DTOs & Validation | Create permissive `SaveListingDraftDto` and strict `PublishListingDraftDto` / `CreateListingDto`. | M1 | R1 |
| F3 | Backend Draft Endpoints & Service | `POST /directory/draft`, `POST /directory/:id/publish`, filter `status` on `GET /directory/me/listings`, isolate public queries with `status = 'approved'`. | M1 | R1 |
| F4 | Frontend `useListingDraft` Autosave Hook | 500ms debounced `localStorage` autosave (`alanya_listing_draft_${userId}`) with dual-persistence cloud sync. | M1 | R1 |
| F5 | "List a Business" Modal Draft Integration | "Save as Draft" action, unsaved changes recovery alert, draft resumption with `draftId` / `initialData`. | M1 | R1 |
| F6 | Admin Hub 4-Tab Navigation | Decompose `/admin` into `AdminTabsNav` with tabs: Listings, Claims, Analytics, Concierge. | M2 | R2 |
| F7 | Listings Moderation Filter Matrix | Full matrix (`all`, `pending`, `approved`, `rejected`, `draft`), search, category filter, quick preview, Approve, Reject modal with reason, Delete. | M2 | R2 |
| F8 | Claims Moderation Queue & Ownership Transfer | Moderation queue for submitted claims, claimant verification preview, Approve (triggering `approve_listing_claim` RPC), Reject with reason. | M2 | R2 |
| F9 | Platform Data & Analytics Hub | Backend `GET /admin/analytics` and frontend Recharts interactive charts & KPI cards (views, clicks by channel, active listings, tier distribution, claim conversion rate). | M2 | R2 |
| F10 | Concierge Triage Integration | Seamless integration of existing concierge enquiry triage into `ConciergeTab.tsx`. | M2 | R2 |
| F11 | Merchant Dashboard Route & Navigation | Register `/business/dashboard` route and add navigation shortcuts to `Navbar.tsx` (desktop & mobile) and `SettingsHero.tsx`. | M3 | R3 |
| F12 | Merchant My Listings & Drafts | Tab displaying user-owned/claimed listings and drafts with status badges (`draft`, `pending`, `approved`), quick metrics, edit, and resume draft. | M3 | R3 |
| F13 | Merchant Performance Analytics | Interactive Recharts charts (7d, 30d, 90d) for page views, calls, website clicks, and map directions for paid tiers (`voyager`, `signature`, `partner`). | M3 | R3 |
| F14 | Free Tier Upgrade Upsell Banner/Modal | Feature-locked promotional preview and upgrade modal for Free "Explorer" tier listings. | M3 | R3 |
| F15 | Merchant Claim Status Tracker | Tab for tracking pending, approved, and rejected ownership claims submitted by the merchant, backed by `GET /directory/me/claims`. | M3 | R3 |
| F16 | Full-Stack End-to-End Verification | 100% passing tests, type-check, lint, build verification, and cross-tier functional validation across all modules. | M4 | AC |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Universal Listing Drafts System | F1, F2, F3, F4, F5: Migration, Backend draft APIs & validation, Frontend dual persistence hook & ListBusinessModal draft workflows | none | DONE |
| M2 | Comprehensive Admin Hub & Platform Analytics | F6, F7, F8, F9, F10: 4-Tab Admin Hub, Listings Moderation filter matrix, Claims queue with ownership transfer RPC, Platform analytics & KPIs, Concierge tab | M1 | DONE |
| M3 | Merchant / Business Owner Dashboard | F11, F12, F13, F14, F15: `/business/dashboard` page, Navbar/Settings shortcuts, My Listings & Drafts, Paid Analytics with tier gating, Upsell modal, Claim tracker, `GET /directory/me/claims` | M1 | DONE |
| M4 | Full-Stack Integration & Acceptance Verification | F16: Complete automated test execution, TypeScript build verification, and regression prevention | M1, M2, M3 | DONE |

---

## Verification Summary
- **Backend Tests**: 74 test suites, 810 tests passing (100%).
- **Frontend Tests**: 60 test files, 815 tests passing (100%).
- **TypeScript Compilation**: 4/4 packages in scope clean (0 errors).
- **ESLint Code Quality**: 2/2 packages in scope clean (0 errors, 0 warnings).
- **Production Build**: Clean builds generated for NestJS backend dist, Vite production frontend bundle, and Shared library.
