# Project: Alanya Holidays Frontend Optimization & Quality Hardening

## Architecture
The Alanya Holidays frontend is a React 19 + TypeScript + Vite + TailwindCSS application utilizing `react-router-dom` for client-side routing, Supabase for authentication & backend state, and modular contexts/hooks for cart, favorites, comparison, and theming.

### Key Architecture Modules:
- **Routing & Code Splitting**: `frontend/src/router/config.tsx` (all 43 application routes lazily loaded), `frontend/src/router/index.ts` (centralized `<Suspense>` wrapper with `<LoadingSpinner />` fallback).
- **Build & Vendor Bundling**: `frontend/vite.config.ts` (custom Rollup `manualChunks` partitioning vendor modules into `vendor-react`, `vendor-supabase`, `vendor-i18n`, `vendor-charts`, `vendor-dnd`, `vendor-maps`, `vendor-stripe`, `vendor-icons`, `vendor-date-fns`, `vendor-validation`, `vendor-headlessui`, `vendor-toast`, `vendor-sentry` — guaranteeing all chunks < 500 kB).
- **State & Context Architecture**: Root-level providers (`DarkModeContext`, `useFavorites`, `useCompare`, `useCart`) with stable `useMemo` reference equality.
- **UI & Accessibility**: Compliant ARIA semantics, accessible interactive containers (`role="button"`, `tabIndex={0}`, `onKeyDown`), descriptive `aria-label` attributes on icon buttons.
- **Security & Content Sanitation**: XSS-safe search query highlighting without unsafe HTML injection.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Centralized Loading Spinner | Create accessible `<LoadingSpinner />` component with `role="status"` and `aria-live="polite"` | M1 | Survey R1 | DONE |
| 2 | Dynamic Route Code Splitting | Convert all 43 statically imported pages in `router/config.tsx` to `React.lazy()` dynamic imports | M1 | Survey R1 | DONE |
| 3 | Suspense Route Wrapper | Wrap `useRoutes` in `router/index.ts` with `<Suspense fallback={<LoadingSpinner />}>` | M1 | Survey R1 | DONE |
| 4 | Vite Vendor manualChunks | Configure fine-grained `manualChunks` in `vite.config.ts` to ensure all production chunks are < 500 kB | M1 | Survey R1 | DONE |
| 5 | Stable Colgroup Keys | Replace `key={Math.random()}` with deterministic entity keys in `pages/compare/page.tsx` | M2 | Survey R2 | DONE |
| 6 | Immutable Tag Sorting | Replace in-place `.sort()` mutation in `pages/compare/page.tsx` with immutable `[...tags].sort()` | M2 | Survey R2 | DONE |
| 7 | DarkModeContext Stability | Wrap `{ isDark, toggle }` in `useMemo` in `components/base/DarkModeContext.tsx` | M2 | Survey R3 | DONE |
| 8 | FavoritesContext Stability | Wrap `FavoritesContextValue` in `useMemo` in `hooks/useFavorites.tsx` | M2 | Survey R3 | DONE |
| 9 | CompareContext Stability | Wrap `CompareContextValue` in `useMemo` in `hooks/useCompare.tsx` | M2 | Survey R3 | DONE |
| 10 | CartContext Stability | Memoize derived `totalItems` and `CartContextValue` in `hooks/useCart.tsx` | M2 | Survey R3 | DONE |
| 11 | CartDrawer Accessibility | Add `aria-label` to close, increment, decrement, delete buttons; add `role="dialog"` | M3 | Survey R4 | DONE |
| 12 | Toast Accessibility | Add `aria-label` on dismiss button, add `role="status"|"alert"`, `tabIndex={0}`, `onKeyDown`, `aria-live` | M3 | Survey R4 | DONE |
| 13 | Navbar Accessibility | Add `aria-label` on mobile dismiss button, add keyboard listener on notification items, `aria-expanded` on dropdowns | M3 | Survey R4 | DONE |
| 14 | Search XSS Sanitation | Eliminate raw HTML injection in `pages/search/page.tsx` using safe React tokenization or DOMPurify | M3 | Survey R4 | DONE |
| 15 | Global Quality Gate & E2E Validation | Verify `npm run build` (<500 kB chunks), `npm run type-check` (0 errors), `npm run lint` (0 warnings), `npm test` (100% passing) | M4 | Master Gate | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Route Splitting & Vendor Chunks | `router/config.tsx`, `router/index.ts`, `LoadingSpinner.tsx`, `vite.config.ts` | none | DONE |
| M2 | React State & Context Stability | `pages/compare/page.tsx`, `DarkModeContext.tsx`, `useFavorites.tsx`, `useCompare.tsx`, `useCart.tsx` | none | DONE |
| M3 | Accessibility & HTML Sanitation | `CartDrawer.tsx`, `Toast.tsx`, `Navbar.tsx`, `pages/search/page.tsx` | none | DONE |
| M4 | Final E2E Verification & Hardening | Full build size check, 43 dynamic routes check, type-check, lint, full 141-file test suite | M1, M2, M3 | DONE |

## Code Layout
- `frontend/src/components/base/LoadingSpinner.tsx` (M1)
- `frontend/src/router/config.tsx` (M1)
- `frontend/src/router/index.ts` (M1)
- `frontend/vite.config.ts` (M1)
- `frontend/src/pages/compare/page.tsx` (M2)
- `frontend/src/components/base/DarkModeContext.tsx` (M2)
- `frontend/src/hooks/useFavorites.tsx` (M2)
- `frontend/src/hooks/useCompare.tsx` (M2)
- `frontend/src/hooks/useCart.tsx` (M2)
- `frontend/src/components/feature/CartDrawer.tsx` (M3)
- `frontend/src/components/base/Toast.tsx` (M3)
- `frontend/src/pages/home/components/Navbar.tsx` (M3)
- `frontend/src/pages/search/page.tsx` (M3)
