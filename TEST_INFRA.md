# E2E Test Infra: Alanya Holidays Platform

## Test Philosophy
- Opaque-box, requirement-driven, regression prevention.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Tier 1 (Smoke) | Tier 2 (Core) | Tier 3 (Extended) | Tier 4 (Live E2E) |
|---|---------|----------------------|:--------------:|:-------------:|:-----------------:|:-----------------:|
| 1 | Auth & Session Management | R1.1, R2.4, Auth Flows | `auth.spec.ts` | `profile.spec.ts`, `rbac.spec.ts` | `roles-and-permissions.spec.ts` | Complete Auth Cycle |
| 2 | Stays & Properties Catalog | R1.3, R2.2 | `booking.spec.ts` | `host-property.spec.ts` | `reviews.spec.ts` | Real DB Query & Filter |
| 3 | Cart & Gift Order Checkout | R2.3, R2.4 | `checkout.spec.ts` | `booking-full-flow.spec.ts` | `stripe-checkout.spec.ts` | Full Order Placement |
| 4 | Multilingual Localization | R2.5 | `localization.spec.ts` | `navigation.spec.ts` | `home.spec.ts` | Language Toggle Live |
| 5 | Directory & Community Forum | R1.2, R1.3, R2.2 | `directory-voting.spec.ts` | `favorites.spec.ts` | `blog.spec.ts`, `chat.spec.ts` | Live Voting & Comments |
| 6 | Services, Itineraries & eSIM | Backlog | `esim.spec.ts` | `ai-planner.spec.ts` | `new-features.spec.ts` | Service Request Flow |

## Test Architecture
- **Backend Unit & Integration Runner**: Jest (`pnpm --filter @alanya-holidays/backend test`)
- **Backend E2E Runner**: Jest + Supertest (`pnpm --filter @alanya-holidays/backend run test:e2e`)
- **Frontend Unit & Component Runner**: Vitest (`pnpm --filter @alanya-holidays/frontend exec vitest run`)
- **Frontend E2E Runner**: Playwright (`pnpm --filter @alanya-holidays/frontend exec playwright test`)
- **Type Checker**: TypeScript Compiler (`pnpm run type-check`)
- **Linter**: ESLint 9 (`pnpm run lint`)
- **Production Bundler**: Vite / NestJS CLI / Turborepo (`pnpm run build`)

## Coverage Thresholds
- **Backend Test Pass Rate**: 100% (86/86 suites, 1,039+ tests passing)
- **Frontend Test Pass Rate**: 100% (76/76 files, 1,012+ tests passing)
- **Type Safety**: 0 errors across all workspaces under strict TypeScript
- **Linter**: 0 errors, 0 warnings
- **Production Builds**: Clean exit code 0 across `@alanya-holidays/shared`, `@alanya-holidays/backend`, `@alanya-holidays/frontend`
