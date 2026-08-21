# E2E Test Infra: Alanya Holidays Stage 2 Overhaul

## Test Philosophy
- Opaque-box, requirement-driven, and unit/integration verified.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinations + Real-World Workload Testing (Tiers 1-4) followed by Adversarial Coverage Hardening (Tier 5).

## Feature Inventory & Test Coverage Mapping
| # | Feature | Source (Requirement) | Tier 1 (Isolated Unit) | Tier 2 (Boundary & Errors) | Tier 3 (Integration & Pairwise) | Tier 4 (Real-World E2E) |
|---|---------|---------------------|:---------------------:|:--------------------------:|:-------------------------------:|:-----------------------:|
| F1 | Draft Status Schema Migration | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| F2 | Backend Draft DTOs & Validation | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| F3 | Backend Draft Endpoints & Service | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| F4 | Frontend `useListingDraft` Autosave | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| F5 | "List a Business" Modal Draft Integration | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| F6 | Admin Hub 4-Tab Navigation | ORIGINAL_REQUEST §R2 | ✓ | ✓ | ✓ | ✓ |
| F7 | Listings Moderation Filter Matrix | ORIGINAL_REQUEST §R2 | ✓ | ✓ | ✓ | ✓ |
| F8 | Claims Moderation Queue & RPC | ORIGINAL_REQUEST §R2 | ✓ | ✓ | ✓ | ✓ |
| F9 | Platform Data & Analytics Hub | ORIGINAL_REQUEST §R2 | ✓ | ✓ | ✓ | ✓ |
| F10 | Concierge Triage Integration | ORIGINAL_REQUEST §R2 | ✓ | ✓ | ✓ | ✓ |
| F11 | Merchant Dashboard Route & Navbar | ORIGINAL_REQUEST §R3 | ✓ | ✓ | ✓ | ✓ |
| F12 | Merchant My Listings & Drafts | ORIGINAL_REQUEST §R3 | ✓ | ✓ | ✓ | ✓ |
| F13 | Merchant Performance Analytics | ORIGINAL_REQUEST §R3 | ✓ | ✓ | ✓ | ✓ |
| F14 | Free Tier Upgrade Upsell | ORIGINAL_REQUEST §R3 | ✓ | ✓ | ✓ | ✓ |
| F15 | Merchant Claim Status Tracker | ORIGINAL_REQUEST §R3 | ✓ | ✓ | ✓ | ✓ |

## Test Execution Commands
- **Backend Test Runner**: `pnpm --filter @alanya-holidays/backend test` (or `npm test` in `backend/`)
- **Frontend Test Runner**: `pnpm --filter @alanya-holidays/frontend test` (or `npm test -- --run` in `frontend/`)
- **Type Checking**: `npm run type-check` across root / monorepo packages.
- **Build Verification**: `npm run build` across frontend and backend.
