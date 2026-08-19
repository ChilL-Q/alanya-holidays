# Plan: Backend Domain Core Deepening (Pragmatic DDD)

## Goal
Deepen backend domain models across Properties, Services/Offerings, and Reviews modules into rich entities and Value Objects with intention-revealing repository seams, eliminating raw `any` types and encapsulating business invariants.

## Global Constraints
- Strict TypeScript: ZERO `any`, ZERO `@ts-ignore` / `@ts-nocheck`.
- 100% Backward Compatibility: All existing REST endpoints, query parameters, responses, and Supabase database schemas must remain fully compatible.
- Pragmatic DDD Architecture:
  - `domain/entities/`: Pure TypeScript rich domain entities containing invariant rules.
  - `domain/value-objects/`: Immutable Value Objects.
  - `domain/repositories/`: Intention-revealing repository interfaces.
  - `infrastructure/mappers/`: Two-way domain <-> persistence mappers.
  - `infrastructure/repositories/`: Concrete Supabase database adapters.
- TDD RED -> GREEN cycle for every slice.

## Tasks

### Task 1: Common Shared Domain Value Objects
- Move/Re-export `Money` VO and introduce `Coordinates` & `ReviewRating` in `backend/src/common/domain/value-objects/`.
- Add comprehensive unit tests.
- Files: `backend/src/common/domain/value-objects/*`

### Task 2: Properties Module Pragmatic DDD
- Create `PropertyEntity` with invariants (pricing, stay requirements, photo validations, active/approved status transitions).
- Create `IPropertiesRepository` interface, `PropertyMapper`, and `SupabasePropertiesRepository`.
- Refactor `PropertiesService` to use repository interface and domain entities, removing all `any` types and raw DB queries.
- Update tests in `properties.service.spec.ts` and add `property.entity.spec.ts`.

### Task 3: Services & Offerings Module Pragmatic DDD
- Create `ServiceOfferingEntity` with invariants (capacity, pricing, duration, category/type rules).
- Create `IServicesRepository` interface, `ServiceOfferingMapper`, and `SupabaseServicesRepository`.
- Refactor `ServicesService` removing all `any` types and raw DB operations.
- Update and add comprehensive unit tests.

### Task 4: Reviews Module Pragmatic DDD
- Create `ReviewEntity` with moderation status lifecycle (`pending`, `approved`, `rejected`) and `ReviewRating` VO (1..5 range).
- Create `IReviewsRepository` interface, `ReviewMapper`, and `SupabaseReviewsRepository`.
- Refactor `ReviewsService` with role checks and domain entity methods.
- Update and add comprehensive unit tests.

### Task 5: Full System Verification
- Run complete test suites (`npm test` in backend and frontend) and verify 0 type errors and 0 test failures.
