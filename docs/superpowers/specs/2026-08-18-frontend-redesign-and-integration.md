# Design Specification: Alanya Holidays Frontend Redesign & Fullstack Integration

**Date:** 2026-08-18  
**Status:** Approved by User  
**Target:** Monorepo `@alanya-holidays/frontend` replacement with new community & luxury showcase platform

---

## 1. Executive Vision & Scope

Alanya Holidays is transitioning to a modern, high-conversion visual design on React 19, Tailwind CSS 3.4, Vite 8, and i18next. The new frontend replaces the legacy single-page layout with a full-featured community portal, interactive travel planner, luxury experience landing pages, and direct booking engine.

### 🚫 Explicit Scope Cuts (Excluded Pages & Features)
1. **`/leaderboard`**: Removed completely. Gamification/ranking points do not align with holiday rentals and local services.
2. **`/gift-cards`**: Removed from routes and navigation to prevent product dilution.
3. **`firebase` dependency**: Removed from `package.json`. All auth, database, and real-time messaging flow through Supabase and NestJS.

### 🌟 Active Feature Domains (42 Total Pages)
1. **Community & Forum**:
   - `/` (Portal Homepage), `/categories`, `/category/:id`, `/category/:id/:subId`, `/thread/:id`, `/new-thread`, `/community-hub`, `/members`, `/member/:id`, `/events`.
2. **Interactive Travel Tools**:
   - `/planner` (Drag-and-drop itinerary planner with `@dnd-kit`), `/travel-guides`, `/explore`, `/compare`, `/search`.
3. **Luxury Experience & Direct Booking Landing Pages**:
   - 11 Dedicated SEO Landing Pages: `/villa-stays`, `/yacht-charters`, `/helicopter-tours`, `/wine-tastings`, `/hammam-spa`, `/photography-excursions`, `/golf-vacations`, `/private-jets`, `/personal-chefs`, `/personal-driver`, `/personal-shopper`, plus `/luxury-experience` hub.
4. **Shop & E-Commerce**:
   - `/shop` (Merch/local products catalog), `/shop/:productId`, `/checkout`, `/booking-confirmation`.
5. **Business & Account Services**:
   - `/business/:id` (Local business directory & claiming), `/messages` (Direct host-guest messaging), `/admin` (Admin control dashboard), `/contact`, `/help`, `/about`, `/privacy`, `/terms`.
6. **Authentication**:
   - `/login`, `/register`, `/forgot-password` (Supabase Auth).

---

## 2. Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────┐
│              React 19 Frontend (Vite 8 + SPA)            │
│  - StyleSystem CSS Tokens & Dark Mode                    │
│  - react-router-dom v7 & react-i18next (RU/EN/TR/DE)     │
│  - @dnd-kit Planner & Lucide Icons                       │
└──────────────┬────────────────────────────┬──────────────┘
               │ (HTTPS REST API / WebSockets)
               ▼                            ▼
┌──────────────────────────────┐ ┌─────────────────────────┐
│     NestJS 11 Backend API    │ │      Supabase Auth      │
│  - Forum & Comments Service  │ │  - Sign In / Sign Up    │
│  - Properties & Services API │ │  - Password Recovery    │
│  - Bookings & Availability   │ │  - Session Tokens       │
│  - Stripe Webhooks & Billing │ └──────────┬──────────────┘
│  - Gemini AI Local Guide     │            │
└──────────────┬───────────────┘            │
               │                            │
               ▼                            ▼
┌──────────────────────────────────────────────────────────┐
│            PostgreSQL Database (Supabase Managed)        │
│  - Atomic Booking RPC & Calendar Locks                   │
│  - 118 Migration Schema Tables & RLS Policies            │
│  - Redis SWR Caching Layer                               │
└──────────────────────────────────────────────────────────┘
```

### Strict Architectural Boundaries:
- **No Direct DB Access in UI**: UI components consume data exclusively via API client services in `frontend/src/api-services/` or React Query / custom hooks communicating with `/api/...`.
- **Shared Contracts**: Models and DTOs adhere to `@alanya-holidays/shared`.

---

## 3. Step-by-Step Implementation Roadmap

```
[Phase 1: Structure & Dependencies] ➔ [Phase 2: Router & Layout Cleanup] ➔ [Phase 3: Core Service Wiring] ➔ [Phase 4: Verification & Build]
```

### Phase 1: Structure & Dependencies Migration
- Replace `frontend/src/` with files from `temp_new_frontend/src/`.
- Update `frontend/package.json`:
  - Add required UI dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `recharts`, `qrcode`, `i18next`, `react-i18next`.
  - Ensure `@alanya-holidays/shared: "workspace:*"` is linked.
  - Drop `"firebase"`.
- Run `pnpm install` across the monorepo.

### Phase 2: Router & Layout Cleanup
- Edit `frontend/src/router/config.tsx`:
  - Remove `/leaderboard` and `/gift-cards` routes.
  - Clean up Navbar, Footer, and MobileMenu components to remove links to excluded pages.
- Verify Tailwind CSS and Global Styles (`index.css`) render dark/light modes properly.

### Phase 3: Live API & Service Wiring
1. **Auth & Session**: Wire `AuthContext` to Supabase Auth (`supabase.auth.onAuthStateChange`, `supabase.auth.signInWithPassword`, `supabase.auth.signUp`).
2. **Forum Module**: Connect `ForumService` to `/api/forum` (categories, posts, comments, likes).
3. **Services & Properties**: Connect 11 experience landing pages to `/api/services` and `/api/properties`.
4. **Planner & AI Guide**: Connect Planner activities to `saved_itineraries` and Gemini AI guide (`/api/ai/guide`).
5. **Direct Messaging & Notifications**: Connect messages page to `/api/messages`.

### Phase 4: Full-Stack Verification & Testing
- Run `pnpm --filter @alanya-holidays/frontend run type-check` (0 errors).
- Run `pnpm --filter @alanya-holidays/frontend test` (`vitest`).
- Run `pnpm build` (100% clean monorepo production build).
