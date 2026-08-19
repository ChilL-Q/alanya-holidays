# Plan: Frontend Monolithic Services Decomposition

## Goal
Decompose the 1000-line monolithic `frontend/src/api-services/services.service.ts` grab-bag into focused, deep domain client modules with clean seams, explicit domain DTOs, and direct adapters to backend endpoints.

## Global Constraints
- Strict TypeScript: ZERO `any`, ZERO `@ts-ignore` / `@ts-nocheck`.
- Zero direct database access: All UI components call domain services in `frontend/src/api-services/`.
- 100% Backward Compatibility: Existing pages continue to work seamlessly.
- TDD RED -> GREEN cycle for every new service.

## Tasks

### Task 1: Extract `properties.service.ts`
- Create `frontend/src/api-services/properties.service.ts` with clean domain DTOs for properties, search parameters, availability, and iCal feeds.
- Write full unit test suite `frontend/src/api-services/properties.service.test.ts`.

### Task 2: Extract `concierge.service.ts`
- Create `frontend/src/api-services/concierge.service.ts` with domain DTOs for luxury experiences (yachts, jets, helicopters, chefs, drivers, spa, wine, golf, photography).
- Write full unit test suite `frontend/src/api-services/concierge.service.test.ts`.

### Task 3: Extract `orders.service.ts` and Connect Checkout
- Create `frontend/src/api-services/orders.service.ts` for placing shop orders and fetching order status.
- Write full unit test suite `frontend/src/api-services/orders.service.test.ts`.
- Connect `frontend/src/pages/checkout/page.tsx` to `ordersService`.

### Task 4: Facade `services.service.ts` and Update Callers
- Refactor `services.service.ts` as a thin backward-compatibility facade delegating to the focused domain services.
- Update callers across luxury pages to import from `concierge.service.ts` and `properties.service.ts`.
- Ensure all 137 frontend test suites pass with 0 errors.
