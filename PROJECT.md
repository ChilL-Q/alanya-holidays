# Project: Alanya Holidays Platform — Phase 2: Moderation & Administration

## Architecture
- **Monorepo Structure**: Turbo monorepo with `backend/` (NestJS 11 + Express + Jest) and `frontend/` (React 19 + Vite + TailwindCSS + Vitest) and `supabase/` (PostgreSQL migrations & Deno Edge Functions).
- **Backend Architecture**: Pragmatic DDD / Clean Architecture (`domain/` -> `application/` -> `infrastructure/` -> `presentation/`).
  - Strict RBAC: `@UseGuards(AuthGuard, RolesGuard)` and `@RequireRole('admin')` for all administrative endpoints.
  - Caching: Multi-level cache with Redis invalidation (`directory:*`, `forum:*`).
  - Audit Trail: Immutable centralized `public.moderation_audit_log` with RLS isolation.
  - Notification Outbox: Durable transactional `public.email_outbox` table with Edge Function dispatch.
- **Frontend Architecture**:
  - Admin Hub (`frontend/src/pages/admin/page.tsx`) with dynamic URL tab synchronization (`?tab=listings|claims|content|forum|audit|analytics|concierge`).
  - Isolated API Client Layer (`frontend/src/api-services/admin.service.ts`) returning strongly typed DTOs.
  - Atomic UI Components: Modals, tooltips, responsive data tables, bulk action toolbars with optimistic updates and error rollbacks.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | `GET /forum/reports` | Paginated listing of forum violation reports with status/type filter | M1 | Survey |
| 2 | `POST /forum/reports/:id/resolve` | Mark forum violation report as resolved | M1 | Survey |
| 3 | `GET /forum/stats` | Forum platform statistics (topics, replies, online members, latest user) | M1 | Survey |
| 4 | Forum Post/Comment Moderation | Pin, unpin, soft-remove, restore, and hard-delete forum posts and comments | M1 | Survey |
| 5 | `ForumModerationTab.tsx` | Admin Hub tab container for forum reports, removed content, discussions | M1 | Survey |
| 6 | `ForumReportsList.tsx` | Interactive reports queue with status filters and quick actions | M1 | Survey |
| 7 | `ForumPostPreviewModal.tsx` | Contextual modal inspecting reported content and author | M1 | Survey |
| 8 | `ForumStatsCard.tsx` | Real-time KPI metrics card grid for forum activity | M1 | Survey |
| 9 | Directory Curation Endpoints | `POST /directory/:id/feature`, `/unfeature`, `/verify`, `/unverify`, `/score` | M2 | Survey |
| 10 | Listings In-Table Curation Toggles | Interactive star (★) and checkmark (✓) toggle buttons with tooltips | M2 | Survey |
| 11 | Listings Score Adjustment | Modal/inline score editor updating `base_score` | M2 | Survey |
| 12 | Bulk Curation Actions | Extend `BulkActionsToolbar.tsx` with "Feature Selected" and "Verify Selected" | M2 | Survey |
| 13 | `moderation_audit_log` Table | PostgreSQL table, composite indexes, and admin-read RLS migration | M3 | Survey |
| 14 | `ModerationAuditService` | Centralized audit logger recording all admin actions across modules | M3 | Survey |
| 15 | `GET /admin/audit-logs` | Admin endpoint for querying audit history with filter matrix and pagination | M3 | Survey |
| 16 | `AuditLogTab.tsx` | Admin Hub tab displaying filterable, searchable audit event history table | M3 | Survey |
| 17 | Listing Pending Notification Hook | Trigger notification enqueue on listing creation or transition to `pending` | M4 | Survey |
| 18 | `admin_listing_notification` Email | Supabase Edge Function Zod schema & Resend HTML template | M4 | Survey |
| 19 | E2E Integration & Verification | Full verification across all 2,600+ tests, build, typecheck, adversarial audits | M5 | Survey |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Forum Moderation & Administration Hub | Task 2.1: Backend report pagination & stats, frontend `ForumModerationTab`, `ForumReportsList`, `ForumPostPreviewModal`, `ForumStatsCard`, pin/remove/restore flows | none | DONE |
| M2 | Directory Listings Curation Controls | Task 2.2: Backend `feature`, `unfeature`, `verify`, `unverify`, `score` endpoints, frontend in-table toggles and `BulkActionsToolbar` batch actions | none | DONE |
| M3 | Universal Moderation Audit Logging System | Task 2.3: PostgreSQL migration `20260826000000_create_moderation_audit_log.sql`, `ModerationAuditService`, `GET /admin/audit-logs`, frontend `AuditLogTab` | M1, M2 | DONE |
| M4 | Admin Email Notifications for New Pending Listings | Task 2.4: Outbox enqueueing in `DirectoryListingService` on `status='pending'`, Edge Function Zod schema & `admin_listing_notification` template | M2 | DONE |
| M5 | Final Milestone: Full E2E Integration & Adversarial Verification | Comprehensive validation: 100% test pass rate across 2,900+ tests, build, typecheck, adversarial audit review | M1, M2, M3, M4 | DONE |

---

## Interface Contracts

### 1. Forum Moderation (`backend/src/forum` ↔ `frontend/src/api-services/admin.service.ts`)
- `GET /forum/reports?includeResolved=boolean&page=number&limit=number&target_type=string`:
  - Returns: `{ data: ForumReport[], total: number, page: number, limit: number, totalPages: number }` or `ForumReport[]`.
- `POST /forum/reports/:id/resolve`:
  - Returns: `{ success: boolean }`.
- `POST /forum/posts/:id/pin` (`body: { pinned: boolean }`) -> `{ success: boolean }`.
- `POST /forum/posts/:id/remove` (`body: { removed: boolean }`) -> `{ success: boolean }`.
- `DELETE /forum/posts/:id` -> `{ success: boolean }`.
- `POST /forum/comments/:id/remove` (`body: { removed: boolean }`) -> `{ success: boolean }`.
- `DELETE /forum/comments/:id` -> `{ success: boolean }`.

### 2. Directory Curation (`backend/src/directory` ↔ `frontend/src/api-services/admin.service.ts`)
- `POST /directory/:id/feature` -> `{ success: boolean, is_featured: true }`.
- `POST /directory/:id/unfeature` -> `{ success: boolean, is_featured: false }`.
- `POST /directory/:id/verify` -> `{ success: boolean, is_verified: true }`.
- `POST /directory/:id/unverify` -> `{ success: boolean, is_verified: false }`.
- `POST /directory/:id/score` (`body: { score: number }`) -> `{ success: boolean, base_score: number }`.

### 3. Moderation Audit Logging (`backend/src/admin` ↔ `frontend/src/api-services/admin.service.ts`)
- Table: `public.moderation_audit_log`
  - Columns: `id UUID`, `entity_type TEXT`, `entity_id TEXT`, `action TEXT`, `admin_id UUID`, `reason TEXT`, `metadata JSONB`, `created_at TIMESTAMPTZ`.
- `GET /admin/audit-logs?entity_type=&action=&admin_id=&startDate=&endDate=&page=1&limit=20`:
  - Returns: `{ data: ModerationAuditLogItem[], total: number, page: number, limit: number, totalPages: number }`.

### 4. Admin Email Notification Outbox (`backend/src/directory` ↔ `supabase/functions/send-email`)
- Enqueue payload:
  ```json
  {
    "type": "admin_listing_notification",
    "to": "admin@alanyaholidays.com",
    "data": {
      "listingId": "UUID",
      "listingName": "Business Name",
      "ownerEmail": "merchant@example.com",
      "category": "restaurants",
      "tier": "featured"
    }
  }
  ```

---

## Code Layout

- **Backend Modules**:
  - `backend/src/forum/`: `dto/forum-reports.dto.ts`, `forum.repository.ts`, `application/forum-report.service.ts`, `forum-moderation.controller.ts`, `forum.controller.ts`.
  - `backend/src/directory/`: `dto/curate-listing.dto.ts`, `presentation/directory-admin.controller.ts`, `application/directory-listing.service.ts`, `directory.service.ts`.
  - `backend/src/admin/`: `moderation-audit.repository.ts`, `moderation-audit.service.ts`, `dto/audit-log.dto.ts`, `admin.controller.ts`, `admin.module.ts`.
  - `backend/src/bookings/` or `backend/src/common/`: `email-outbox.repository.ts`.
- **Database & Edge Functions**:
  - `supabase/migrations/20260826000000_create_moderation_audit_log.sql`
  - `supabase/functions/send-email/index.ts`
- **Frontend Modules**:
  - `frontend/src/pages/admin/page.tsx`
  - `frontend/src/pages/admin/components/AdminTabsNav.tsx`
  - `frontend/src/pages/admin/components/ListingsModerationTab.tsx`
  - `frontend/src/pages/admin/components/BulkActionsToolbar.tsx`
  - `frontend/src/pages/admin/components/ForumModerationTab.tsx`
  - `frontend/src/pages/admin/components/ForumReportsList.tsx`
  - `frontend/src/pages/admin/components/ForumPostPreviewModal.tsx`
  - `frontend/src/pages/admin/components/ForumStatsCard.tsx`
  - `frontend/src/pages/admin/components/AuditLogTab.tsx`
  - `frontend/src/api-services/admin.service.ts`
  - `frontend/src/api-services/forum.service.ts`
