# Frontend Redesign & Fullstack Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace legacy frontend with the new 42-page React 19 / Vite 8 community and luxury booking platform, remove excluded pages (`/leaderboard`, `/gift-cards`), drop `firebase`, and wire real Supabase Auth, Forum, Services, and Planner APIs.

**Architecture:** Monorepo SPA (`frontend/`) communicating via HTTPS REST with NestJS 11 backend (`backend/src/`) and Supabase PostgreSQL with Redis SWR caching. Clean Architecture boundary strictly enforced (UI components only consume repository/API client abstractions, no direct database queries in UI).

**Tech Stack:** React 19, Vite 8, TypeScript 5.8, Tailwind CSS 3.4, `@dnd-kit/core`, `@dnd-kit/sortable`, `recharts`, `qrcode`, `lucide-react`, `react-router-dom` v7, `react-i18next`, `@alanya-holidays/shared`.

## Global Constraints
- Do NOT use `any` types or `@ts-ignore` / `@ts-nocheck`.
- UI components MUST NOT import Supabase database SDKs directly; use API client services or repository hooks.
- All code changes must pass `tsc --noEmit` with 0 errors.
- Monorepo package `@alanya-holidays/shared: "workspace:*"` must be respected.
- Excluded pages (`/leaderboard`, `/gift-cards`) and `firebase` dependency must be completely omitted.

---

### Task 1: Package Dependencies & Source Migration

**Files:**
- Modify: `frontend/package.json`
- Create/Overwrite: `frontend/src/` (from `temp_new_frontend/src/`)
- Modify: `frontend/vite.config.ts`, `frontend/tailwind.config.ts`, `frontend/index.html`

- [ ] **Step 1: Update `frontend/package.json`**
Remove `firebase`, add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `recharts`, `qrcode`, `i18next`, `react-i18next`, `@alanya-holidays/shared: "workspace:*"`.
- [ ] **Step 2: Copy source files from `temp_new_frontend/src/` into `frontend/src/`**
- [ ] **Step 3: Run `pnpm install` in workspace root**
- [ ] **Step 4: Verify package resolution and initial type-check**

---

### Task 2: Router & Navigation Cleanup (Purge Excluded Pages)

**Files:**
- Modify: `frontend/src/router/config.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx` (or equivalent Navbar in `frontend/src/components/`)
- Modify: `frontend/src/components/layout/Footer.tsx`
- Delete: `frontend/src/pages/leaderboard/`
- Delete: `frontend/src/pages/gift-cards/`

- [ ] **Step 1: Delete `frontend/src/pages/leaderboard/` and `frontend/src/pages/gift-cards/` directories**
- [ ] **Step 2: Remove `/leaderboard` and `/gift-cards` routes from `frontend/src/router/config.tsx`**
- [ ] **Step 3: Remove all navigation links to Leaderboard and Gift Cards from Navbar, Footer, and Mobile menu**
- [ ] **Step 4: Verify router builds without missing imports**

---

### Task 3: API Client Layer & Supabase Auth State Integration

**Files:**
- Create: `frontend/src/lib/api-client.ts`
- Modify: `frontend/src/lib/supabase.ts`
- Create: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/pages/login/page.tsx`, `frontend/src/pages/register/page.tsx`, `frontend/src/pages/forgot-password/page.tsx`

- [ ] **Step 1: Create standardized API client communicating with `/api/...`**
- [ ] **Step 2: Initialize Supabase client in `frontend/src/lib/supabase.ts` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`**
- [ ] **Step 3: Create AuthContext managing session, user profile, login, registration, and logout**
- [ ] **Step 4: Wire AuthContext into Login, Register, and User Dropdown components**

---

### Task 4: Forum & Community API Integration

**Files:**
- Create: `frontend/src/api-services/forum.service.ts`
- Modify: `frontend/src/pages/home/page.tsx`
- Modify: `frontend/src/pages/categories/page.tsx`
- Modify: `frontend/src/pages/category/page.tsx`
- Modify: `frontend/src/pages/thread/page.tsx`
- Modify: `frontend/src/pages/new-thread/page.tsx`

- [ ] **Step 1: Implement `ForumService` with methods: `getCategories()`, `getCategoryBySlug()`, `getThreads()`, `getThreadById()`, `createThread()`, `createComment()`**
- [ ] **Step 2: Connect Homepage trending discussions and categories to `ForumService`**
- [ ] **Step 3: Connect Category, Subcategory, and Thread detail pages to `ForumService`**
- [ ] **Step 4: Connect New Thread creation form to `ForumService.createThread()`**

---

### Task 5: Luxury Experiences & Direct Booking Integration

**Files:**
- Create: `frontend/src/api-services/services.service.ts`
- Modify: 11 experience landing pages (`/villa-stays`, `/yacht-charters`, `/helicopter-tours`, `/wine-tastings`, `/hammam-spa`, `/photography-excursions`, `/golf-vacations`, `/private-jets`, `/personal-chefs`, `/personal-driver`, `/personal-shopper`)
- Modify: `frontend/src/pages/checkout/page.tsx`
- Modify: `frontend/src/pages/booking-confirmation/page.tsx`

- [ ] **Step 1: Create `ServicesService` to fetch properties and services by category from `/api/services` and `/api/properties`**
- [ ] **Step 2: Connect landing pages to fetch and render live items from `ServicesService` with graceful fallback to curated showcases**
- [ ] **Step 3: Connect Checkout to `/api/bookings` and Stripe payment intent flow**

---

### Task 6: Interactive Planner & Gemini AI Guide Integration

**Files:**
- Create: `frontend/src/api-services/ai-guide.service.ts`
- Modify: `frontend/src/pages/planner/page.tsx`
- Modify: `frontend/src/components/` (Planner drag-and-drop cards)

- [ ] **Step 1: Implement `AiGuideService` communicating with `/api/ai/guide`**
- [ ] **Step 2: Connect Planner page to Gemini AI assistant for auto-generating multi-day Alanya itineraries**
- [ ] **Step 3: Enable drag-and-drop itinerary reordering with `@dnd-kit`**

---

### Task 7: Full Monorepo Build, Type-Check & Test Verification

**Files:**
- Workspace root

- [ ] **Step 1: Run `pnpm --filter @alanya-holidays/frontend run type-check` (verify 0 errors)**
- [ ] **Step 2: Run `pnpm --filter @alanya-holidays/frontend test`**
- [ ] **Step 3: Run `pnpm build` across entire monorepo (`shared`, `backend`, `frontend`)**
- [ ] **Step 4: Run `graphify update .`**
