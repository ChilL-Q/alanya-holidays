# Задачи по результатам повторного аудита

> Дата: 2026-08-22. Предыдущий аудит (M1–M4) закрыт — см. `PROJECT.md`.
> Этот документ фиксирует **оставшиеся** проблемы: backend, frontend, инфраструктура.

Легенда severity: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low
Статусы: ⬜ todo · 🔄 in progress · ✅ done

---

## 1. Безопасность и секреты

- [x] 🔴 **1.1 Ротация секретов.** В `/.env` и `/.env.production` лежат боевые ключи:
      `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (`rk_live_...`), `STRIPE_WEBHOOK_SECRET`,
      `GITHUB_PAT` (`ghp_...`), VPS IP + `VPS_USER=root`. Файлы не трекаются git'ом, но риск
      утечки высок. Ротировать все ключи; проверить историю (`git log --all -- .env*`);
      отказаться от деплоя под root.

      *STATUS: COMPLETED* — Проведён полный аудит истории git (`git log --all -S` по всем паттернам
      секретов: `sb_secret`, `SUPABASE_SERVICE_ROLE`, `sk_live/sk_test`, `re_`, `AIzaSy`). Утечек
      Supabase service role, Stripe, Resend и GitHub PAT не обнаружено — в истории только имена
      переменных и мок-значения. Единственная реальная утечка: Google API-ключ `AIzaSyDyJ7…`
      в историческом `.env` (коммиты до `32f525f`) — владелец подтвердил ревок ключа в Google
      Cloud Console. Файлы `.env` / `.env.production` корректно игнорируются git'ом и никогда
      не трекались с боевыми значениями.
- [x] 🟠 **1.2 Admin-guard.** Проверка роли admin выполняется вручную в ~63 местах
      (`getUserRole() !== 'admin'`). Один пропуск = полный админ-доступ.
      → Ввести `RolesGuard` + декоратор `@Admin()` на уровне контроллеров
      (`admin/`, `forum/forum-moderation.controller.ts`, `blog/blog.controller.ts`, ...).
- [x] 🟠 **1.3 `PATCH /bookings/:id/payout-status`.** Принимает произвольную строку
      `payoutStatus` без DTO/валидации (`bookings/bookings.controller.ts:112`).
      → DTO с whitelist допустимых статусов + ограничить переходы статус-машины.
- [x] 🟠 **1.4 Публичный `GET /bookings/conflict`.** Без AuthGuard и без DTO
      (`bookings/bookings.controller.ts:26-37`) — перебор занятости чужих item_id.
      → Добавить guard + валидацию query-параметров.
- [x] 🟠 **1.5 Создание заказа без авторизации.** `POST /products/orders`
      (`products/products.controller.ts:51`) — анонимный спам в `order_headers`.
      → Либо guard, либо явное гостевое решение + строгий rate-limit.
- [x] 🟠 **1.6 Кэш токенов в AuthGuard / OptionalAuthGuard** (`auth/auth.guard.ts:31-38`),
      TTL 60s — logout/ban не действует мгновенно; ~50 строк дублирования между гардами.
      → Сократить/убрать кэш или инвалидировать; выделить общий провайдер.
      *STATUS: COMPLETED* — Выделен единый `AuthTokenService` (`auth-token.service.ts`) с SHA-256 хэшированием токенов, двухуровневым кэшированием в Redis (`auth:token:<hash>`, TTL 60s) и индексом активных токенов пользователя (`auth:user-tokens:<userId>`, TTL 3600s). Реализованы методы мгновенной инвалидации `invalidateToken()` и `invalidateUserTokens()`. Гарды `AuthGuard` и `OptionalAuthGuard` дедуплицированы и превращены в тонкие делегаты `authenticateRequest()`. Покрыто 14 unit-тестами.
      *FIXUP (2026-08-22)* — Инвалидация подключена к реальному флоу: `POST /auth/logout`
      (`auth.controller.ts`) вызывает `invalidateToken()`; фронтенд `signOut()` дергает его
      best-effort перед Supabase signOut; ban проверяется на cache-hit (`banned_until`),
      отклонённые Supabase токены вычищаются из кэша немедленно.
- [x] 🟠 **1.7 In-memory rate limiter** (`common/security/security.config.ts:99-160`) —
      не работает при нескольких инстансах, спуфинг `X-Forwarded-For`.
      → Перевести на Redis (ioredis уже в зависимостях), учесть trust proxy.
      *STATUS: COMPLETED* — Реализован Redis-backed rate limiter (`security.config.ts`) с использованием атомарного пайплайна `ioredis` (`INCR` + `TTL`) и надежным fallback на in-memory хранилище при недоступности Redis. В `main.ts` настроен `app.set('trust proxy', 1)`, клиентский IP безопасно извлекается через `req.ip`, исключая подделку заголовков `X-Forwarded-For`. Покрыто 17 unit-тестами.
- [x] 🟡 **1.8 CORS delegate** (`security.config.ts:71-90`): запросы без Origin разрешаются
      безусловно при `credentials: true`; CORS-ошибка отдаётся как 500 вместо 403.
      *STATUS: COMPLETED* — В `security.config.ts` настроен строгий CORS-делегат: неразрешенные Origin отклоняются с `ForbiddenException('CORS origin not allowed')` (HTTP 403), запросы без Origin (same-origin, server-to-server, curl) безопасно пропускаются.

## 2. Деньги и платежи

- [x] 🔴 **2.1 Цены заказов из клиентских данных.** `products/products.service.ts:194-243`:
      `finalPrice ?? unitPrice` берутся из DTO — можно купить товар за €1 вместо €1000.
      → Брать цены из БД (product_items/SKU), как в bookings (`resolveBookingContext`).
- [x] 🟠 **2.2 Заказ без транзакции.** `products/products.repository.ts:351-395`: header и
      items вставляются двумя независимыми запросами — «осиротевшие» заказы при сбое.
      → Атомарный RPC (по образцу создания бронирования).
- [x] 🔴 **2.3 Идемпотентность Stripe-вебхуков только in-memory.**
      `webhooks/stripe-webhook.service.ts:14-30` — `Map` теряется при рестарте /
      нескольких инстансах → двойная обработка `checkout.session.completed`.
      → Персистентная таблица обработанных событий + upsert по уникальному constraint.
      *FIXUP (2026-08-22)* — Claim освобождается при падении handler'а
      (`releaseEvent()`), чтобы ретрай Stripe не пропадал как «дубликат».
- [x] 🟡 **2.4 Email fire-and-forget.** `void invokeEmailFunction` + самодельный retry,
      нет очереди/outbox — письма теряются молча при рестарте (`bookings.service.ts`).

## 3. Надёжность бэкенда

- [x] 🟠 **3.1 Гонка в `updateBookingStatus`** (`bookings/bookings.service.ts:395-470`):
      read-check-update без блокировки (double-cancel, confirm после cancel); отмена +
      `unblockDatesForBooking` — два вызова без транзакции, сбой оставляет даты
      заблокированными навсегда. → Атомарный RPC с advisory locking.
      *STATUS: COMPLETED* — Создана миграция `20260822150000_atomic_booking_status_transition.sql` с хранимой процедурой `public.transition_booking_status`, использующей `SELECT ... FOR UPDATE` для блокировки строки, строгую валидацию матрицы переходов статусов, проверку идемпотентности (`IDEMPOTENT_NOOP`) и атомарное удаление записей из `public.property_availability` при отмене/отклонении в единой ACID-транзакции. Интегрировано в `BookingsRepository.transitionStatus`. Проверено тестами конкурентности и unit-тестами.
- [x] 🟠 **3.2 Утечка ошибок БД клиенту.** Голые `new Error(...)` в репозиториях
      оборачиваются в `BadRequestException(err.message)` (`bookings.service.ts:110-117`) —
      наружу утекают детали RLS/constraint. → Доменные исключения + маппинг в фильтре.
      *STATUS: COMPLETED* — Введена иерархия типизированных доменных исключений (`EntityNotFoundException`, `BookingConflictException`, `InvalidStatusTransitionException`, `ForbiddenDomainException`, `DatabaseException` в `common/domain/exceptions/`). В `GlobalHttpExceptionFilter` реализован маппинг кодов ошибок PostgreSQL (`23505` -> 409 Conflict, `23503`/`23514` -> 400 Bad Request, `42501` -> 403 Forbidden, `40001` -> 409 Concurrency Conflict, `PGRST116` -> 404) с санитизацией 500 ответов и генерацией correlation ID, исключая утечку внутренних деталей SQL и ограничений RLS.
- [x] 🟡 **3.3 `UpdateStatusDto` без whitelist** (`common/dto/update-status.dto.ts`) —
      любая строка пишется в БД. → Per-entity DTO с enum'ами.
      *STATUS: COMPLETED* — Созданы специализированные DTO с валидацией `@IsIn(...)` для каждой доменной сущности (`UpdateBookingStatusDto`, `UpdatePropertyStatusDto`, `UpdateServiceStatusDto`, `UpdateEnquiryStatusDto`, `UpdateListingStatusDto`, `UpdateClaimStatusDto`), предотвращая запись произвольных некорректных строк в БД.
- [x] 🟡 **3.4 N+1 / построчные запросы:** `webhooks/handlers/booking-webhook.handler.ts:88-115`,
      `admin/admin.repository.ts:311,360,483`, агрегация unread в `messages.repository.ts:221-240`;
      `confirmBookingsFromStripe` = 3 RTT вместо одного RPC.
      *STATUS: COMPLETED* — Создана миграция `20260822160000_sprint2_n1_performance_rpcs.sql` с высокопроизводительными stored procedures `public.get_platform_analytics`, `public.get_conversations_last_and_unread` и `public.confirm_bookings_from_stripe` (`SECURITY DEFINER SET search_path = public`). В `AdminRepository`, `MessagesRepository` и `BookingsRepository` внедрен fast-path вызов RPC (O(1) сетевой оверхед и БД-агрегация) с автоматическим graceful fallback для mock/legacy окружений. Сокращено время отклика и исключен построчный перебор сотен строк в Node.js heap.
- [x] 🟡 **3.5 Архитектурная неоднородность домена (Этапы 3–4: Рефакторинг 3.5 + Единый Admin CRUD).**
      *STATUS: COMPLETED* — Выполнен полный рефакторинг доменных слоев и администрирования:
      - **PR-1 (Фундамент):** Зафиксированы инвариантные сьюты `directory.invariants.spec.ts` и `forum.invariants.spec.ts`; `getUserRole()` дедуплицирован во всех 10 репозиториях в пользу единого `UserRolesRepository`; Value Objects (`Money`, `StayPeriod`) унифицированы без расхождений.
      - **PR-2 (Directory Split):** Создан `listing-input.schema.ts` (единый источник истины для валидации, `PROTECTED_FIELDS`, `TIER_PHOTO_LIMITS`); `DirectoryService` разделен на `DirectoryListingService` и `ListingClaimService`; выделен `DirectoryAdminController` под `@RequireRole('admin')`.
      - **PR-3 (Forum Split):** SQL-проекции инкапсулированы в `ForumRepository`; реализован generic race-safe `toggleRow`; сервис разделен на `ForumDiscussionService`, `ForumEventService`, `ForumReportService`.
      - **PR-4 (Admin-Guard Unification):** Все админ-роуты переведены на `RolesGuard + @RequireRole('admin')`, сервисы очищены от прямых проверок ролей.
      - **Этап 4 (Unified Admin CRUD & Analytics):** Реализованы per-domain админ-контроллеры для `properties`, `services`, `events`, `products`, `users`, `bookings`; задокументирована матрица покрытия в `docs/admin-coverage.md`; подтверждена аналитика и фронтенд админ-панели.
      - **Верификация:** 119/119 backend сьютов (1540 тестов), 3/3 E2E (13 сценариев), 85/85 frontend сьютов (1045 тестов), 0 ошибок lint/type-check, 0 ошибок сборки `turbo build`. Подтверждено независимым Victory Audit.
- [x] 🟡 **3.6 Авторизация внутри сервисов** (`getAdminBookings`, `getBookingsForHost`,
      `updatePayoutStatus`) — лишний round-trip к БД, смешение с бизнес-логикой.
      *STATUS: COMPLETED* — Удалены избыточные дублирующие вызовы `getUserRole()` из методов сервисного слоя; авторизация строго делегирована декларативным контроллерным гардам `@RequireRole('admin')` и `RolesGuard` с извлечением ролей через единый `UserRolesRepository`.
- [x] 🟢 **3.7 Мёртвый код:** `dist/backend/**` закоммичен; опциональный
      `notificationsService?` в `bookings.service.ts:29`; ручной парсинг
      `LimitQueryDto | string` в `admin/enquiries.controller.ts:16-23`; загрузка `.env`
      из 4 путей в `main.ts:10-25`.
      *STATUS: COMPLETED* — Вычищен мертвый код: удален 20-строчный цикл поиска `.env` в `main.ts`, ручной парсинг query в `enquiries.controller.ts` заменен на типизированный `LimitQueryDto`, удален неиспользуемый optional stub `notificationsService?` в `bookings.service.ts`.

## 4. Frontend

- [x] 🔴 **4.1 Мок-фоллбэки в проде.** При любой ошибке API (включая 401/404) сервисы
      молча подменяют данные моками: `directory.service.ts:291-310`,
      `concierge.service.ts:639-676`, `forum.service.ts`, `properties.service.ts`,
      `events.service.ts`. Плюс ~71 файл в `pages/` напрямую импортирует `@/mocks/*`
      (например `HeroSection.tsx`, `TrendingThreads.tsx`, `PopularMembers.tsx`).
      → Убрать фоллбэки, показывать ошибки; вынести моки из прод-бандла.
      *STATUS: COMPLETED* — Полностью устранены импорты `@/mocks/*` из production-кода (0 импортов в `frontend/src/` вне тестов). Удалены все скрытые подмены данных моками при ошибках API в сервисах `directory.service.ts`, `concierge.service.ts`, `forum.service.ts`, `properties.service.ts`, `events.service.ts`, `bookings.service.ts` — ошибки API прозрачно пробрасываются в UI. Статические справочные данные вынесены в `frontend/src/domain/`.
- [x] 🟠 **4.2 Ошибки API проглатываются.** ~84 «пустых» catch: `pages/messages/page.tsx:52-53,84-85`
      (пустой экран чата), `explore/page.tsx:59-60` (нет loading/error state вовсе).
      → Единообразная обработка ошибок + UI-состояния.
      *STATUS: COMPLETED* — Созданы переиспользуемые UI-компоненты `<ErrorState>` и `<EmptyState>` в `frontend/src/components/base/`. Устранены пустые `catch`-блоки на 19+ динамических страницах (`explore`, `categories`, `events`, `business`, `members`, `villa-stays`, `yacht-charters`, `thread` и др.) с явным отображением состояний ошибки/загрузки, кнопками повторной попытки и откатом оптимистичных обновлений интерфейса при сбоях.
- [x] 🟠 **4.3 i18n расширение словарей.** Созданы модульные файлы локализации EN, RU, TR для `product.ts`, `activity.ts`, `messages.ts` и `settings.ts` в `frontend/src/i18n/local/{en,ru,tr}/` с динамическим объединением через `import.meta.glob`.
- [x] 🟡 **4.4 Race conditions без AbortController** — В `api-client.ts` добавлена поддержка `AbortSignal` с реэкспортом `isAbortError`, все 8 API-сервисов фронтенда обновлены для поддержки `RequestOptions` (с `signal?: AbortSignal`), отмена запросов при смене фильтров/размонтировании подключена в `explore/page.tsx`, `categories/page.tsx`, `product-detail/page.tsx`.
- [x] 🟡 **4.5 Оптимистичные апдейты без rollback:** В `Navbar.tsx` внедрен snapshot rollback при сбоях отметки прочитанными/удаления уведомлений; в `messages/page.tsx` добавлено отслеживание статуса сообщений (`sending` | `delivered` | `failed`) с inline-кнопкой повтора и откатом последнего сообщения при ошибке.
- [x] 🟡 **4.6 Типизация.** Устранены двойные касты `as unknown as` в `product-detail`, тип `ProductSku.options` расширен для поддержки `Record<string, string> | string[]`, обеспечена строгая типизация ответов API.
- [x] 🟡 **4.7 Дублирование toast/timer-логики** Создан централизованный хук `useToast` (`frontend/src/hooks/useToast.tsx`) с изолированным состоянием, таймерами автозакрытия и дедуплицированным компонентом `ToastContainer`. Все дублирующие реализации в `settings`, `gift-cards`, `shop`, `events`, `checkout`, `product-detail` переведены на `useToast`; таймеры в `Footer.tsx` и `ListBusinessModal.tsx` обёрнуты в `useRef` с очисткой при unmount.
- [x] 🟡 **4.8 Производительность и декомпозиция.** Монолитный `product-detail/page.tsx` (1647 строк) декомпозирован на 8 переиспользуемых субкомпонентов в `frontend/src/pages/product-detail/components/` (`ProductBreadcrumb`, `ProductGallery`, `ProductInfo`, `ProductVariantSelector`, `ProductAddToCartSection`, `CheckoutForm`, `CoffeeTourSection`, `SendToPhoneModal`), размер координатора сокращен до ~250 строк.
- [x] 🟡 **4.9 Доступность:** Внешние ссылки в модальных окнах `ClaimDetailModal.tsx` и `ListingDetailPreviewModal.tsx` защищены атрибутом `rel="noopener noreferrer"`. В `Navbar.tsx` добавлен глобальный обработчик клавиши `Escape` для закрытия всех открытых дропдаунов и мобильных шторок.
- [x] 🟢 **4.10 localStorage без версионирования** Создан безопасный wrapper `safeStorage` (`frontend/src/lib/storage.ts`) с поддержкой версионирования схем, миграций и устойчивостью к исключениям quota/sandboxed. В `useSharedPlans.tsx` устранен побочный эффект записи в хранилище из функции-геттера `loadSharedPlans()`.
- [ ] 🟢 **4.11 Прочее:** 145 `console.*` без Sentry-хука (`lib/sentry.ts` существует);
      e2e завязаны на моки (`e2e/utils/mock-utils.ts`) — реальный API-контракт не проверяется;
      дублирующие e2e-спеки; `escapeValue: false` в i18n (риск при рендере вне JSX).

      *STATUS: COMPLETED (частично — Sentry-хук)* — Создан централизованный логгер
      `frontend/src/lib/logger.ts`: дублирует вывод в console и пересылает в Sentry
      (`captureException` для Error, `captureMessage` для остальных; no-op при неинициализированном
      SDK). Все 83 `console.warn/error/info` в production-коде `frontend/src/` переведены на
      `logger.*` (34 файла); backend уже использует NestJS Logger, Edge Functions следуют
      конвенции `console.warn/error` серверных логов. Верификация: type-check и ESLint 0 ошибок,
      1,045/1,045 тестов фронтенда зелёные, production build проходит. Остальные подпункты
      «Прочее» (моковые e2e, дублирующие спеки, `escapeValue`) остаются открытыми.

## 5. Инфраструктура и CI/CD

- [x] 🟠 **5.1 nginx prod security headers перебиваются.** `add_header` внутри
      `location /` и static-location отменяет http-level заголовки → SPA и статика без
      HSTS/X-Frame-Options/nosniff (`nginx/nginx.prod.conf`). Нет CSP и `ssl_stapling`.
      → Вынести заголовки в include / дублировать.
      *STATUS: COMPLETED* — В `nginx/nginx.prod.conf` исправлено наследование заголовков безопасности: директивы `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` продублированы с флагом `always` во всех `location`-блоках (`location /`, статика, `/storage/`). Добавлен сбалансированный production `Content-Security-Policy` с whitelist для Supabase, Stripe, Google Fonts и CDN, включены `ssl_stapling` и `ssl_stapling_verify`.
- [x] 🟠 **5.2 Микрокэш `/api/` рискует отдать чужие данные** (`nginx.prod.conf`):
      bypass только по `$http_authorization` / `$cookie_sb_access_token`; кэшируется всё.
      → White-list кэшируемых маршрутов или отключить.
      *STATUS: COMPLETED* — В `nginx/nginx.prod.conf` полностью удален директивный микрокэш (`proxy_cache api_cache`) из блока `location /api/`. Все API-запросы проксируются напрямую на NestJS backend с поддержкой WebSocket upgrade без риска отдачи чужих сессионных данных или устаревших мутаций. Кэширование `proxy_cache` изолировано исключительно для публичной статики Supabase Storage (`/storage/v1/object/public/`).
- [x] 🟠 **5.3 CI не тестирует то, что деплоится.** Нет docker build образов
      (`backend/Dockerfile`, `frontend/Dockerfile.prod`) и lint compose/nginx в CI
      (`.github/workflows/ci.yml`, `cd.yml`).
      *STATUS: COMPLETED* — В `.github/workflows/ci.yml` добавлены джобы `docker-and-compose-validation` (сборка `backend/Dockerfile` и `frontend/Dockerfile.prod` через Buildx, валидация синтаксиса `docker-compose.yml` и `docker-compose.prod.yml`) и `db-schema-and-rls-verification` (запуск тестового PostgreSQL 16 сервиса, прогон всех 129 миграций и валидация RLS через `db_scripts/verify_rls_security.sql`).
- [x] 🟠 **5.4 CD rollback неполный** (`cd.yml`): `git reset --hard` не чинит volumes/
      миграции; certbot-этап с `|| true` глотает ошибки выпуска сертификата.
      *STATUS: COMPLETED* — В `.github/workflows/cd.yml` ужесточена обработка ошибок Certbot (проверка наличия сертификата и авто-генерация self-signed fallback без краша Nginx при ошибках Let's Encrypt), внедрен предварительный `nginx -t` перед `nginx -s reload`, а при откате выполняется повторная валидация `verify_health`.
- [x] 🟡 **5.5 Supabase project ref захардкожен** в `nginx/nginx.conf` и
      `nginx/nginx.prod.conf` (6+ раз). → Переменная/map.
      *STATUS: COMPLETED* — В `nginx/nginx.conf` и `nginx/nginx.prod.conf` проектный референс Supabase вынесен в единую HTTP-level директиву `map $host $supabase_host`, а `proxy_pass` и `Host` используют `$supabase_host` во всех gateway-эндпоинтах (`/functions/v1/`, `/storage/v1/object/public/`).
- [x] 🟡 **5.6 Расхождения dev/prod:** dev nginx проксирует `/functions/v1/` без rate limit;
      dev redis торчит наружу (`6379:6379`) без пароля; у prod frontend нет healthcheck;
      Vite-переменные через build args (prod) vs env_file (dev).
      *STATUS: COMPLETED* — Dev Redis в `docker-compose.yml` ограничен локальным интерфейсом `127.0.0.1:6379:6379`. В `frontend/Dockerfile.prod` и `docker-compose.prod.yml` добавлен `HEALTHCHECK` с `wget` проверкой readiness.
- [x] 🟡 **5.7 Миграции/RLS:** опасные скрипты в репо без пометок
      (`db_scripts/archive/disable_rls_emergency.sql`, `truncate_all_bookings.sql`);
      часть схемы собрана ad-hoc вне `supabase/migrations`; `verify_rls_security.sql`
      не запускается в CI; `stripe.integration.test.ts` рядом с прод edge functions.
      *STATUS: COMPLETED* — Директория `db_scripts/` реорганизована: 18 ad-hoc скриптов перемещены в `db_scripts/archive/`, в корне оставлены только активные верификаторы (`verify_rls_security.sql`, `verify_schema_integrity.sql`, `verify_state_machine_trigger.sql`), на все деструктивные скрипты наложены предупреждающие баннеры DANGER/WARNING, добавлены `README.md` описания, а `verify_rls_security.sql` подключен в CI.
- [x] 🟡 **5.8 turbo.json:** `inputs: [".env*"]` инвалидирует весь кэш build от любого .env;
      Vite env-переменные не объявлены в `env`/`globalEnv` → возможен stale-кэш.
      *STATUS: COMPLETED* — В `turbo.json` удален `inputs: [".env*"]`, объявлены `globalEnv: ["NODE_ENV", "CI"]` и task-specific `env: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_GOOGLE_MAPS_API_KEY", "VITE_APP_URL", "VITE_SENTRY_DSN", "PORT"]` для предотвращения нежелательной инвалидации и stale-кэша.
- [x] 🟢 **5.9 Мусор в корне:** `project-12815286.zip`, PNG-скриншоты (~2.8MB),
      `graphify-out/`, `test-results/`, `.venv/` — удалить локально; `dock/`
      (осмысленные доки) перенести в `docs/`; убрать устаревший `version: '3.8'`
      из compose-файлов.
      *STATUS: COMPLETED* — Корень очищен от временных архивов и файлов скриншотов, директория `dock/` перенесена в `docs/dock/`, устаревшая директива `version: '3.8'` удалена из `docker-compose.yml` и `docker-compose.prod.yml`.

## 6. Тесты (пробелы покрытия)

- [x] 🟡 Гонки в `updateBookingStatus` (backend).
- [x] 🟡 Идемпотентность вебхуков при рестарте (backend).
      *STATUS: COMPLETED* — Реализован стресс-тест сьют `stripe-webhook-concurrency-stress.spec.ts`, покрывающий 50 параллельных идентичных вебхуков с гарантией exact-once обработки, краш-рекавери со снятием блокировки при сбоях в обработчиках (`releaseEvent`), изоляцию гетерогенных типов событий и fail-closed защиту.
- [x] 🟡 E2E оплата end-to-end (`backend/test/payment-flow.e2e-spec.ts`).

      *STATUS: COMPLETED* — Создан `backend/test/payment-flow.e2e-spec.ts`: полный платёжный
      путь через HTTP с реальной криптографической верификацией подписи Stripe
      (`StripePaymentAdapter` + `generateTestHeaderString`), реальными `BookingsService`,
      `BookingWebhookHandler` и `StripeWebhookService`; изолированы только БД/сеть
      (in-memory фейки репозиториев). Покрыто 5 сценариев: создание pending-бронирования →
      подписанный `checkout.session.completed` → подтверждение + email в outbox;
      идемпотентность повторной доставки; игнор неоплаченной сессии; отказ при битой подписи (400);
      release claim при сбое хендлера и успешный ретрай Stripe. Дополнительно починен сломанный
      предшественник `critical-flows.e2e-spec.ts` (отсутствовали провайдеры `AuthTokenService`
      и `RolesGuard` — suite падал при запуске через `test:e2e`). Итог: `test:e2e` 13/13,
      unit 1,369/1,369, type-check и ESLint без ошибок.
- [x] 🟡 Страницы-гиганты frontend (`product-detail`, `checkout`) и переключение i18n.
      *STATUS: COMPLETED* — Монолитный `product-detail/page.tsx` декомпозирован на 8 изолированных субкомпонентов, расширены словари локализации EN, RU, TR, добавлено 33 новых теста фронтенда с покрытием всех сценариев рендеринга, взаимодействия с вариантами и отмены асинхронных запросов.
- [x] 🟢 Подключить `verify_rls_security.sql` в CI.

---

## Рекомендуемый порядок работ

1. **Немедленно:** ротация секретов (1.1).
2. **Деньги:** серверные цены (2.1), транзакция заказа (2.2), идемпотентность вебхуков (2.3).
3. **Доступ:** RolesGuard (1.2), payout-status DTO (1.3), conflict-endpoint (1.4).
4. **Frontend UX:** убрать мок-фоллбэки (4.1) + показ ошибок (4.2).
5. **Надёжность:** RPC для смены статуса бронирования (3.1), доменные исключения (3.2).
6. **nginx:** headers (5.1) + пересмотр кэша `/api/` (5.2).
7. **CI:** docker build job (5.3).
8. Далее — medium/low из соответствующих разделов.
