# Project: Alanya Holidays Platform - Stages 3 & 4 (Refactoring 3.5 & Unified Admin CRUD)

## Architecture
- **Monorepo Structure**: Turborepo with `pnpm` workspaces (`backend`, `frontend`, `shared`).
- **Backend Architecture**: NestJS with Pragmatic Domain-Driven Design and Clean Architecture (`domain/` -> `application/` -> `infrastructure/` -> `presentation/`).
- **Frontend Architecture**: React 19 + Vite SPA with React Router v7 (`/admin`), Tailwind CSS 3.4 (OKLCH color system), `recharts` for analytics visualization, and `ApiClient` singleton.
- **Database & Auth**: Supabase PostgreSQL with RLS, Supabase Auth with custom role resolution via `profiles.role`, declarative `RolesGuard` + `@RequireRole('admin')`.
- **E2E Quality Gates**: 13/13 critical backend flows (`app.e2e-spec.ts`, `critical-flows.e2e-spec.ts`, `payment-flow.e2e-spec.ts`), 107/107 unit test suites, 0 TypeScript errors, `turbo build` zero-error pass.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Directory & Forum Invariant Unit Tests | Safety-net unit test suites verifying protected fields filtering, tier photo limits, draft state machine, and race-safe toggles | M1 (Stage 3.1) | `docs/PLAN_STAGES_3_4.md` § 1.1 |
| 2 | Deduplicate `getUserRole()` via `UserRolesRepository` | Replace 10 duplicate `getUserRole` repository methods with centralized `UserRolesRepository` | M1 (Stage 3.1) | Survey / `PLAN_STAGES_3_4.md` § 1.2 |
| 3 | Deduplicate Value Objects (`Money`, `StayPeriod`) | Centralize and re-export `Money` and `StayPeriod` in `backend/src/common/domain/value-objects/` | M1 (Stage 3.1) | Survey / `PLAN_STAGES_3_4.md` § 1.3 |
| 4 | `listing-input.schema.ts` Single Source of Truth | Centralized input normalization, `PROTECTED_FIELDS` stripping, and tier photo limits | M2 (Stage 3.2) | `docs/PLAN_STAGES_3_4.md` § 2.1 |
| 5 | Split `DirectoryService` | Separate `DirectoryListingService` (listings, search, votes, owner lifecycle) and `ListingClaimService` (claims, verification, approval) | M2 (Stage 3.2) | `docs/PLAN_STAGES_3_4.md` § 2.2 |
| 6 | Split `DirectoryController` | Separate public/owner routes in `DirectoryController` and admin moderation in `DirectoryAdminController` with `RolesGuard` | M2 (Stage 3.2) | `docs/PLAN_STAGES_3_4.md` § 2.3 |
| 7 | Forum Repository Projections & `toggleRow` Helper | Move SQL projections (`POST_SELECT`, `EVENT_SELECT`) and annotations to `ForumRepository`; add generic `toggleRow` for PG 23505 race tolerance | M3 (Stage 3.3) | `docs/PLAN_STAGES_3_4.md` § 3.1 |
| 8 | Split `ForumService` | Separate `ForumDiscussionService`, `ForumEventService`, and `ForumReportService` | M3 (Stage 3.3) | `docs/PLAN_STAGES_3_4.md` § 3.2 |
| 9 | Shared Author-or-Admin Permission Helper | Centralized helper verifying resource ownership or admin role | M3 (Stage 3.3) | `docs/PLAN_STAGES_3_4.md` § 3.3 |
| 10 | Admin-Guard Unification | Migrate residual in-service role checks to declarative `RolesGuard + @RequireRole('admin')` across all admin routes | M4 (Stage 3.4) | `docs/PLAN_STAGES_3_4.md` § 3.4 |
| 11 | Domain Admin CRUD Controllers | Implement dedicated admin controllers for properties, services, events, products, users, bookings | M5 (Stage 4) | `docs/PLAN_STAGES_3_4.md` § 4.1 |
| 12 | Admin Coverage Matrix Documentation | Complete CRUD & RBAC matrix documentation in `docs/admin-coverage.md` | M5 (Stage 4) | `docs/PLAN_STAGES_3_4.md` § 4.1 |
| 13 | Platform Analytics Expansion | Database RPC `get_platform_analytics` & `AdminRepository.getPlatformAnalytics` expanded with multi-domain breakdowns | M5 (Stage 4) | `docs/PLAN_STAGES_3_4.md` § 4.2 |
| 14 | Frontend Admin Views & Charts | Admin dashboard tabs, data tables, filter toolbars, detail modals, and Recharts visualization adhering to OKLCH design system | M5 (Stage 4) | `docs/PLAN_STAGES_3_4.md` § 4.3 |
| 15 | Full Workspace Quality Gate & Production Build | Verify 100% test pass (unit + 13/13 e2e), 0 lint/type errors, and `turbo build` | M6 (Final Gate) | Master Quality Gate |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Stage 3.1: Foundation & Invariant Tests (PR-1) | `directory.invariants.spec.ts`, `forum.invariants.spec.ts`, `UserRolesRepository` deduplication (10 files), VO re-exports (`Money`, `StayPeriod`) | None | DONE |
| M2 | Stage 3.2: Directory Domain Split (PR-2) | `listing-input.schema.ts`, `DirectoryListingService`, `ListingClaimService`, `DirectoryAdminController`, backward-compatible exports | M1 | IN_PROGRESS |
| M3 | Stage 3.3: Forum Domain Split & Repository Projections (PR-3) | SQL projections in `ForumRepository`, generic `toggleRow`, `ForumDiscussionService`, `ForumEventService`, `ForumReportService`, author-or-admin helper | M1 | PLANNED |
| M4 | Stage 3.4: Admin-Guard Unification (PR-4) | Unify admin endpoints across controllers to `RolesGuard + @RequireRole('admin')` | M2, M3 | PLANNED |
| M5 | Stage 4: Unified Admin CRUD, Analytics & Frontend Panel | Domain admin controllers (properties, services, events, products, users, bookings), `docs/admin-coverage.md`, analytics RPC & repository, frontend admin views & charts | M4 | PLANNED |
| M6 | Final Verification & Production Build | Full workspace verification: 13/13 backend E2E tests, frontend unit/E2E tests, 0 lint/type errors, `turbo build` | M5 | PLANNED |

---

## Interface Contracts

### 1. `UserRolesRepository` (VERIFIED & IN USE)
```typescript
@Injectable()
export class UserRolesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}
  async getRole(userId: string): Promise<string | undefined>;
}
```

### 2. `listing-input.schema.ts` (M2 CONTRACT)
```typescript
export const PROTECTED_FIELDS = [
  'id',
  'created_at',
  'updated_at',
  'is_verified',
  'is_featured',
  'base_score',
  'subscription_id',
  'listing_locations',
  'owner_user_id',
  'rejection_reason',
] as const;

export const TIER_PHOTO_LIMITS: Record<string, number> = Object.freeze(
  Object.assign(Object.create(null), {
    explorer: 5,
    voyager: 50,
    signature: 100,
    partner: 100,
  })
);

export function validatePhotoLimit(tier?: string, gallery?: unknown[]): void;
export function stripProtectedFields<T extends Record<string, unknown>>(input: T): Partial<T>;
export function normalizeListingInput(input: Partial<DirectoryListingRecord>): Record<string, unknown>;
```

### 3. Directory Split Services (M2 CONTRACT)
- **`DirectoryListingService`**: handles `getDirectoryListings`, `getDirectoryListing`, `searchDirectoryListings`, `saveDraft`, `publishDraft`, `createDirectoryListing`, `updateDirectoryListing`, `deleteDirectoryListing`, `voteForListing`, `approveDirectoryListing`, `rejectDirectoryListing`.
- **`ListingClaimService`**: handles `submitListingClaim`, `verifyClaimEmail`, `getListingClaims`, `getMyListingClaims`, `approveListingClaim`, `rejectListingClaim`.
- **`DirectoryAdminController`**: routes `@Controller('directory')` -> `GET /directory/admin/listings`, `GET /directory/admin/status/:status`, `GET /directory/admin/pending`, `POST /directory/:id/approve`, `POST /directory/:id/reject`, `GET /directory/claims`, `POST /directory/claims/:id/approve`, `POST /directory/claims/:id/reject` with `@UseGuards(AuthGuard, RolesGuard)` and `@RequireRole('admin')`.
- **`DirectoryService` Facade**: forwards all methods to `DirectoryListingService` and `ListingClaimService` for 100% backward compatibility.
