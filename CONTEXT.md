# Alanya Holidays — Ubiquitous Language & Domain Model

This document captures the domain model and ubiquitous language for the **Alanya Holidays** platform.

**Status markers:** 🟢 **Live** — wired end-to-end and under active development · ⏸️ **Parked** — shipped and functional, no new development · 💤 **Dormant** — backend built, no frontend consumer yet.

> **Current focus (2026-08):** everything already surfaced on the frontend — Forum, Blog, Events, Shop, Directory/Business dashboard, Admin panel, Seller panel. Luxury concierge growth is parked.
>
> **Scope rule:** строим только то, у чего уже есть фронтенд-поверхность. Домены без фронтенда (booking guest flow, host lifecycle, services provider) не трогаем до отдельного решения.

## Core Concepts & Domain Terminology

### 1. Community: Forum & Events 🟢 (Собщество: Форум и События)
Community hub where travelers and locals discuss Alanya.
- **Thread / Post**: Discussion topic with nested **Comments**, likes and bookmarks.
- **Forum Category**: Themed section of the forum (tree structure); management is admin-only.
- **Report**: User-flagged post or comment routed into moderation (`forum/reports`).
- **Event**: Community event with **RSVP** (join/leave) and an attendee list.
- **Member**: Public user profile within the forum member directory.

### 2. Blog 🟢 (Блог)
Editorial content platform with community contribution.
- **Post**: Published article addressed by `slug`.
- **Submission**: Draft article submitted by a contributor; approved/rejected by admin before publishing.
- **Tag**: Taxonomy attached to posts.

### 3. Shop & Products 🟢 (Магазин)
E-commerce catalog with buyer checkout via Stripe-backed orders.
- **Product → Variant/SKU**: Sellable item hierarchy owned by a **Seller** (ownership-based authorization, no dedicated vendor role).
- **Order**: Buyer purchase flowing through `/checkout`; buyers track theirs in settings (**My Orders**).
- **Seller Panel**: seller-facing tabs on `/business/dashboard` — My Products (create/edit catalog items via `products/mine`) and Incoming Orders (fulfillment state machine: `pending_payment` → `paid` → `shipped` → `completed`, cancellable before shipping). Ownership enforced by `product_items.seller_id`.

### 4. District Directory 🟢 (Справочник мест и услуг)
Curated directory of local businesses, attractions, and services.
- **Listing Addon**: Paid promotional badge or placement boost for directory entries.
- **Claimed Listing**: Business owner verification of a directory entry.
- **Listing Moderation**: The admin *role* over directory listings (approve/reject), not a separate domain. See ADR-0001.
- **Protected Fields**: Listing attributes only the platform may set (verification, featuring, scoring); never writable by owners.
- **Business Dashboard**: Seller-facing portal at `/business/dashboard` — my listings & drafts, claim tracker, owner analytics, Voyager subscription upgrades.

### 5. Subscription & Checkout 🟢 (Подписки и Платежи)
Stripe-integrated monetization for business profiles and listing upgrades.
- **Host/Business Subscription**: Recurring membership (self-serve Voyager plan; Custom plan = contact flow).
- **Checkout Session**: Stripe Session handling subscription or one-time addon payment, processed behind the `PaymentGateway` port with idempotent webhook handling (`processed_stripe_events`).

### 6. AI Local Guide 🟢 (ИИ Гид и Планировщик)
Interactive AI assistant (Gemini model) providing itineraries, district tips, and trip recommendations in multi-languages (EN, RU, TR). Served through Nest `/ai/*` with prompt sanitization and rate limiting.

### 7. Admin Panel & Moderation 🟢 (Админ-панель)
Cross-cutting administration at `/admin`: enquiries inbox (concierge leads), platform analytics, audit logs, plus per-domain moderation tabs (directory listings, claims queue, blog submissions, forum reports, bookings + payouts/refunds, reviews moderation, users & roles).
- **Enquiry**: Lead submitted from public forms into `concierge_enquiries`, triaged by admins (status/assign).
- **Moderation Audit Log**: Centralized record of admin actions (`moderation_audit_log`).

### 8. Concierge Experiences ⏸️ (Люкс-направление — заморожено)
Luxury experience landing pages (yacht charters, golf, private jets, hammam, etc.). Booking here follows the **Enquiry Model**: form → `POST /enquiries` → manual admin triage. No dates, calendar, or online payment. Pages remain reachable; feature development is parked.

### 9. Booking Domain 💤 (Бронирование — спящий домен)
Self-serve reservation core, fully built on the backend and intentionally not wired to the frontend yet.
- **Pending / Confirmed / Cancelled / Expired Booking**: Lifecycle enforced by atomic RPC (advisory locking, overlap check, date blocking) and cron cleanup.
- **Booking Payment Flow**: Stripe Checkout session carrying `metadata.bookingIds` confirmed by webhook handler. *Gap: no endpoint creates the booking checkout session yet.*
- **Target decision**: wire self-serve booking for villa stays (properties have availability calendars + iCal sync); experiences stay on the Enquiry Model.

### 10. Property Listing 💤 host-side (Недвижимость)
Verified holiday rental listings across Alanya's districts (Mahmutlar, Oba, Cleopatra, Kargıçak). Public browsing works; **host lifecycle** (create/draft/publish, iCal sync, availability editing) is dormant until the Booking Domain is wired.
- **Host**: Property owner listing rentals on zero-commission direct terms.
- **Availability Calendar**: Host calendar defining nightly prices, blockouts, seasonal rates.

### 11. Edge Gateway & Proxy 🟢 (Маршрутизация и Единая Точка Входа)
Nginx reverse proxy coordinating frontend SPA static delivery, NestJS API proxying (`/api/`), Supabase Storage (`/storage/v1/object/public/`), legacy Edge Functions (`/functions/v1/`, incl. the thin Stripe webhook forwarder to the backend).

## Naming Registry (канонические имена — не создавать дубликаты)

> **Правило:** перед созданием новой функции, сервиса, компонента или статуса — сначала ищи каноническое имя здесь и в коде (`api-services/*.service.ts`, `backend/src/<module>/`). Продолжай существующую цепочку имён; новые ветви именуй по тем же паттернам.

### Frontend API services (`frontend/src/api-services/`)
Один файл = один домен. Экспорт: класс `XService` + singleton `export const xService = new XService()` + именованные алиасы функций.

| Файл | Singleton | Зона |
|---|---|---|
| `admin.service.ts` | `adminService` | админ-панель: модерация, enquiries, analytics, audit |
| `ai-guide.service.ts` | `aiGuideService` | ИИ-гид |
| `billing.service.ts` | `billingService` | подписки Voyager |
| `blog.service.ts` | `blogService` | блог |
| `bookings.service.ts` | `bookingsService` | брони (пока только read/cancel) |
| `chat.service.ts` | `chatService` | личные сообщения |
| `concierge.service.ts` | `conciergeService` | заявки люкс-направления |
| `directory.service.ts` | `directoryService` | справочник |
| `events.service.ts` | `eventsService` | события форума |
| `favorites.service.ts` | `favoritesService` | избранное |
| `forum.service.ts` | `forumService` | форум |
| `itineraries.service.ts` | `itinerariesService` | планировщик |
| `notifications.service.ts` | `notificationsService` | уведомления |
| `orders.service.ts` | `ordersService` | заказы магазина |
| `products.service.ts` | `productsService` | каталог магазина + товары продавца |
| `properties.service.ts` | `propertiesService` | недвижимость |
| `storage.service.ts` | `storageService` (объект) | загрузка файлов |

### Канонические глагольные паттерны
- `getMy*` — данные текущего юзера как покупателя/владельца: `getMyOrders`, `getMyProducts`, `getUserBookings`, `getMyClaims`, `getMyListings`
- `getSeller*` / `updateSeller*` — юзер в роли **продавца** (заказы с его товарами): `getSellerOrders`, `updateSellerOrderStatus`
- `createMyProduct` / `updateMyProduct` — CRUD товаров продавца (frontend); backend-зеркало: `createCatalogItem` / `updateCatalogItem`
- `submitConciergeEnquiry` — единственная точка подачи заявок (`POST /enquiries`; `adminService.submitEnquiry` и `conciergeService.createEnquiry` — делегаты к ней)
- `ordersService.createOrder` — единственный путь оформления заказа (`POST /products/orders`; `productsService.createProductOrder` — делегат)
- `directoryService.deleteListing` — единственное удаление листинга; админский вызов идёт через него
- Backend repository: `getMyCatalogItems`, `sellerOwnsAnyCatalogItem`, `getOrdersContainingCatalogItems`, `getAllOrders`, `updateOrderStatus`

### Правило одного пути (single source of truth)
Один HTTP-эндпоинт = один метод-владелец в api-services. Всем остальным методам, которым нужен тот же маршрут, — **делегировать** к владельцу, а не дублировать `apiClient.*` вызов. Публичные алиасы допустимы, копии реализации — нет.

### Критичное разделение таблиц магазина
- **`product_items`** — то, что реально продаётся (checkout → `order_items.product_id`). В коде это **CatalogItem**: методы `*CatalogItem*`. Владелец — `product_items.seller_id`
- **`products` + `product_variants`** — легаси-таблицы вендорского CRUD, продаются нигде. В коде это **Product**: методы `insertProduct`, `getProductOwnership` (seller_id/artisan_id). Не смешивать с CatalogItem!

### Компоненты Business Dashboard (`pages/business/dashboard/components/`)
`MerchantHero`, `MyListingsTab`, `MyProductsTab`, `SellerOrdersTab`, `PerformanceAnalyticsTab`, `ClaimTrackerTab`, `UpgradeModal`. Табы типа `DashboardTab`: `listings | products | orders | analytics | claims | upgrades`.

### Компоненты Admin Hub (`pages/admin/components/`)
`ListingsModerationTab`, `ClaimsQueueTab`, `ContentModerationTab`, `ForumModerationTab`, `BookingsAdminTab`, `ReviewsModerationTab`, `UsersAdminTab`, `AuditLogTab`, `PlatformAnalyticsTab`, `ConciergeTab`. Табы типа `AdminTab`: `listings | claims | content | forum | bookings | reviews | users | audit | analytics | concierge`.

### Статусные словари (не изобретать новые значения)
- **Order** (`order_headers.status`): `pending_payment → paid → shipped → completed`; `cancelled` — до отгрузки. Переходы в `ProductsService.ORDER_STATUS_TRANSITIONS`
- **product_items.status**: `active | inactive | draft` (CHECK в БД)
- **Booking**: `pending | confirmed | cancelled | expired`
- **Directory listing tier**: `explorer | voyager | signature | partner`

### Route-конвенции backend
- Публичные: `@Controller('<domain>')`; админские: `@Controller('<domain>/admin')`
- Литеральные маршруты объявлять **до** параметрических catch-all (`mine`, `orders/seller` — до `:id`)

## Known Gaps (tracked, not bugs)
- `bookings` module: no frontend consumer for the guest booking flow; booking checkout-session endpoint missing.
- Properties and services admin CRUD have no admin UI (backend endpoints exist); properties/services domains are parked.
- Legacy vendor `products`/`product_variants` tables are disconnected from the shop: the storefront sells `product_items`, and seller CRUD now targets `products/mine` (catalog items). The old `/products` vendor CRUD remains but powers no UI — consolidation candidate.
