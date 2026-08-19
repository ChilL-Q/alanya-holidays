# Implementation Plan: Backend Type-Safety & ESLint Warning Remediation

**Goal:** Eliminate all TypeScript `any` types, `@typescript-eslint/no-base-to-string`, `@typescript-eslint/unbound-method`, and unsafe member accesses (`.includeRemoved`, etc.) across `backend/src/`.

---

## Task 1: Forum Module Type-Safety & `includeRemoved` Fix
- **Files**:
  - `backend/src/forum/types/forum.types.ts`
  - `backend/src/forum/dto/forum-posts.dto.ts`
  - `backend/src/forum/dto/forum-comments.dto.ts`
  - `backend/src/forum/dto/forum-categories.dto.ts`
  - `backend/src/forum/dto/forum-events.dto.ts`
  - `backend/src/forum/dto/forum-reports.dto.ts`
  - `backend/src/forum/dto/index.ts`
  - `backend/src/forum/repositories/forum-posts.repository.ts`
  - `backend/src/forum/repositories/forum-categories.repository.ts`
  - `backend/src/forum/repositories/forum-events.repository.ts`
  - `backend/src/forum/repositories/forum-reports.repository.ts`
  - `backend/src/forum/repositories/forum-stats.repository.ts`
  - `backend/src/forum/services/forum-posts.service.ts`
  - `backend/src/forum/services/forum-categories.service.ts`
  - `backend/src/forum/services/forum-events.service.ts`
  - `backend/src/forum/services/forum-reports.service.ts`
  - `backend/src/forum/services/forum-stats.service.ts`
  - `backend/src/forum/controllers/forum-posts.controller.ts`
  - `backend/src/forum/controllers/forum-comments.controller.ts`
  - `backend/src/forum/controllers/forum-categories.controller.ts`
  - `backend/src/forum/controllers/forum-events.controller.ts`
  - `backend/src/forum/controllers/forum-reports.controller.ts`
  - `backend/src/forum/controllers/forum-posts.controller.spec.ts`
  - `backend/src/forum/services/forum-posts.service.spec.ts`
- **Actions**:
  1. Add strict filters (`ForumPostsFilter`, `ForumPostsRepoFilter`, `ForumEventsFilter`, `ForumCommentsFilter`), DB input types (`InsertForumPostDbInput`, etc.), and pagination responses.
  2. Implement DTO classes with `class-validator` and `class-transformer`.
  3. Update repository and service signatures from `any` to strict types. Fix `!filters.includeRemoved` and `filters.removedOnly`.
  4. Ensure `forum-posts.service.spec.ts` and `forum-posts.controller.spec.ts` pass with typed mocks.
- **Verification**: `npx eslint "src/forum/**/*.ts"` has 0 errors and 0 warnings, `npm test -- --testPathPattern=forum` passes 100%.

---

## Task 2: Domain Mappers & `no-base-to-string` Errors
- **Files**:
  - `backend/src/bookings/infrastructure/booking.mapper.ts`
  - `backend/src/properties/infrastructure/mappers/property.mapper.ts`
  - `backend/src/reviews/infrastructure/mappers/review.mapper.ts`
  - `backend/src/reviews/domain/entities/review.entity.ts`
  - `backend/src/services/infrastructure/mappers/service-offering.mapper.ts`
  - `backend/src/services/services.service.ts`
  - `backend/src/properties/properties.service.ts`
- **Actions**:
  1. Replace blind `String(unknown)` conversions in `BookingMapper.toDomain`, `PropertyMapper.toDomain`, `ReviewMapper.toDomain`, and `ServiceOfferingMapper.toDomain` with safe type-narrowing functions (`typeof val === 'string' ? val : fallback`).
  2. Fix `status: ReviewStatus | string` redundant union in `review.entity.ts`.
  3. Fix `services.service.ts` and `properties.service.ts` string casts.
- **Verification**: `npx eslint "src/{bookings,properties,reviews,services}/infrastructure/**/*.ts"` has 0 errors, `npm test` passes.

---

## Task 3: Bookings, Users, Directory, Blog, Media & Webhooks Type Safety
- **Files**:
  - `backend/src/bookings/dto/booking-repository.dto.ts`
  - `backend/src/bookings/bookings.controller.ts`
  - `backend/src/bookings/bookings.repository.ts`
  - `backend/src/bookings/bookings.service.ts`
  - `backend/src/users/dto/update-user-profile.dto.ts`
  - `backend/src/users/users.controller.ts`
  - `backend/src/users/users.service.ts`
  - `backend/src/webhooks/stripe-webhook.service.ts`
  - `backend/src/media/media-processing.service.ts`
- **Actions**:
  1. Define typed DTOs and return shapes for bookings and users.
  2. Use typed `AuthenticatedRequest` in controllers.
  3. Eliminate `catch (err: any)` in favor of `catch (err: unknown)` with proper `err instanceof Error` type narrowing.
  4. Fix repository join type assertions in `bookings.repository.ts`.
- **Verification**: `npx eslint "src/{bookings,users,webhooks,media}/**/*.ts"` clean, `npm test` passes.

---

## Task 4: Test Specs & Unbound Method Corrections
- **Files**:
  - `backend/src/ai/ai-guide.controller.spec.ts`
  - `backend/src/notifications/notifications.controller.ts`
  - `backend/src/notifications/notifications.controller.spec.ts`
  - `backend/src/properties/properties.service.spec.ts`
  - `backend/src/reviews/reviews.service.spec.ts`
  - `backend/src/webhooks/stripe-webhook.service.spec.ts`
  - `backend/src/bookings/bookings.service.spec.ts`
  - `backend/src/bookings/bookings.controller.spec.ts`
  - `backend/src/users/users.controller.spec.ts`
  - `backend/src/users/users.service.spec.ts`
  - `backend/src/media/media-processing.service.spec.ts`
  - `backend/src/media/media.controller.spec.ts`
- **Actions**:
  1. Fix `notifications.controller.ts` methods by removing unnecessary `async` (`@typescript-eslint/require-await`).
  2. In spec files, replace class method references in `expect(service.method)` with direct mock function references or `jest.Mocked`.
  3. Replace `(service as any).handlePrivateMethod` in `stripe-webhook.service.spec.ts` with a typed test interface harness.
  4. Remove unused imports and variables in all spec files.
- **Verification**: `npm test` runs all test suites with 100% pass rate.

---

## Task 5: Final Comprehensive Verification
- **Actions**:
  1. Run `npm run lint` across entire backend and verify 0 errors and 0 warnings.
  2. Run `npm test` and verify 63/63 test suites pass.
  3. Run `npm run build` and verify clean build.
