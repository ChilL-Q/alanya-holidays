# TODO: план работ по итогам аудита (2026-08-22)

Список задач по итогам полного анализа проекта (backend, frontend, инфраструктура).
Общая оценка на момент аудита: **5.7/10**. Полные отчёты см. в истории чата с агентом.

Приоритеты: 🔴 критично · 🟠 важно · 🟡 желательно

---

## 🔴 Критично (security / сломанный функционал)

- [x] **`POST /api/bookings` не защищён `AuthGuard`** — исправлено: эндпоинт теперь требует auth,
      `backend/src/bookings/bookings.controller.ts:38-43`. `user_id` и `total_price`
      принимаются напрямую из тела запроса (`CreateBookingDto`) — любой может создать
      бронирование от чужого имени и подставить произвольную цену.
      → Добавить `@UseGuards(AuthGuard)`, брать `user_id` из `@CurrentUser()`,
      пересчитывать `total_price` на сервере от реальной цены объекта/услуги.

- [x] **CD-скрипт модифцировал firewall прод-сервера на каждом деплое**
      (`.github/workflows/cd.yml`) — `sed` меняет `DEFAULT_FORWARD_POLICY` с `DROP`
      на `ACCEPT`, `iptables -I` добавляет правила без проверки дублей.
      → Вынести конфигурацию firewall в одноразовый provisioning-скрипт
      (уже частично есть в `scripts/deploy-vps-wizard.sh`), убрать из CD.

- [x] **Нет rollback и post-deploy health-check в CD** — исправлено: добавлен health-check
      `docker compose up --build` без версионирования образов. Если рантайм падает
      после деплоя — отката нет.
      → Тегировать образы (например по SHA), добавить проверку `/api/health` после
      старта и автоматический откат на предыдущий тег при неудаче.

- [x] **E2E-smoke тесты не гейтят продакшен-деплой** — исправлено: `cd.yml` теперь слушает
      `cd.yml`) — критичные сценарии (auth/booking/checkout) могут падать уже после
      выкладки в прод.
      → Сделать `cd.yml` зависимым от успешного прохождения `e2e-smoke.yml`, либо
      встроить smoke-тесты как job перед деплоем.

---

## 🟠 Важно

### Backend
- [ ] Supabase-клиент всегда создаётся с **service role key** (обходит RLS) —
      вся авторизация держится только на ручных проверках в коде. Рассмотреть
      RLS как второй уровень защиты (defense-in-depth) хотя бы для read-путей.
- [x] Нет `Helmet` и rate limiting (`@nestjs/throttler`) — закрыто без новых зависимостей:
      добавлены security headers middleware + in-memory rate limiter в `backend/src/main.ts`.
- [x] `app.enableCors()` без параметров и `cors: { origin: '*' }` в
      `notifications.gateway.ts` — исправлено: введён env-driven allowlist origins для HTTP и WS.
- [x] `backend/tsconfig.json` переведён на `"strict": true` — перед включением
      были устранены DTO definite-assignment issues и nullability gaps в
      `common/security/security.config.ts`, `bookings.controller.spec.ts`,
      `media.controller.ts`, `notifications.gateway.ts` и связанных DTO.
- [ ] ESLint: `@typescript-eslint/no-explicit-any` выключен, `no-unsafe-*`
      понижены до `warn` — вернуть в `error`, т.к. код и так соответствует
      (регрессии в будущем предотвратить заранее).
- [x] Небезопасный фолбэк `STRIPE_SECRET_KEY || 'sk_test_mock'`
      (`stripe-payment.adapter.ts`) — исправлено: adapter теперь fail-fast при отсутствии env.
- [x] Добавлена дедупликация Stripe `event.id` на backend — закрыто через
      in-memory TTL guard в `backend/src/webhooks/stripe-webhook.service.ts`
      против повторной обработки webhook retry.
- [x] Backend E2E больше не ограничен одним тривиальным smoke-тестом — добавлены
      минимально полезные сквозные сценарии для `auth + bookings + stripe webhooks`
      в `backend/test/critical-flows.e2e-spec.ts`, а legacy `app.e2e-spec.ts`
      переведён в минимальный smoke без тяжёлого `AppModule` bootstrap.
- [ ] God-сервисы: `directory.service.ts` (872 строки), `forum.service.ts`
      (741 строка), `properties.service.ts` (474 строки) — разбить по SRP.
- [ ] Несогласованное логирование: часть кода использует `Logger`, часть —
      голый `console.error/warn` (`blog.repository.ts`, `forum.repository.ts`,
      `bookings.repository.ts`) — унифицировать на `Logger`.
- [ ] Query-параметры почти нигде не валидируются через DTO (ручной
      `parseInt()` вместо `@Query() dto: PaginationDto`) — унифицировать.
- [ ] Удалить случайно закоммиченный `backend/backend_source_20260722.zip`.

### Frontend
- [x] Клиентский booking-контракт синхронизирован с backend: `POST /bookings`
      больше не отправляет `user_id` / `total_price`, а fake-success fallback
      отключён для `4xx` / auth-ошибок в booking service layer.
- [ ] **Разрыв между `package.json` и реальным использованием**: `zustand`,
      `zod`, `@tanstack/react-query`, весь `@radix-ui/*`, `@stripe/*`,
      `@headlessui/react`, `react-datepicker`, `react-helmet-async`, `cmdk`,
      `dompurify`, `marked` и др. — не используются нигде в `src` (подтверждено
      grep + build). Решить по каждому пакету: либо реально внедрить фичу
      (особенно Stripe-оплата!), либо убрать зависимость.
- [x] Misleading booking UX на concierge-only страницах (`villa-stays`,
      `yacht-charters`, `luxury-experience`) исправлен: CTA и success-flow
      теперь честно ведут себя как enquiry/request, а после отправки
      используется route-based confirmation `/booking-confirmation`.
- [ ] **Stripe-оплата фактически отсутствует в коде фронтенда** — несмотря на
      наличие SDK в зависимостях и e2e-теста `stripe-checkout.spec.ts`,
      реальный `pages/checkout/page.tsx` — это форма подарочного заказа без
      интеграции с Stripe/`create-checkout-session`. Синхронизировать
      документацию/тесты с реальностью или доделать фичу.
- [ ] **Мультиязычность EN/RU/TR не реализована** — нет файлов переводов в
      `i18n/local/`, `useTranslation` используется в одном месте. Либо
      реализовать переводы, либо убрать заявление о мультиязычности из
      документации.
- [ ] `api-services/` не соответствует Clean Architecture (нет репозиторных
      интерфейсов/DI/DTO-слоя) — либо привести к паттерну из скилла
      `clean-architecture-repository`, либо честно переименовать/задокументировать
      как "Service Layer".
- [x] `frontend/e2e/localization.spec.ts` больше не содержит "тихий проход" —
      fake-green убран, сценарий переведён в явный `test.fixme(...)` до
      появления реального language switcher UI и EN/RU/TR translation resources.
- [x] Захардкоженный `recipientPhone: "+905550000000"` удалён из checkout flow:
      `frontend/src/pages/checkout/page.tsx` теперь собирает реальный
      `Recipient Phone` из формы и передаёт его в `orders.service` без фейкового fallback.
- [x] `frontend/tsconfig.json` переведён на `"strict": true` — перед включением
      был прогнан и расширен scoped strict-check, после чего исправлены
      nullability/type-contract issues в `messages/page.tsx`,
      `shop/components/RecentEnquiriesSidebar.tsx` и
      `pages/concierge-enquiry-flows.test.tsx`.
- [ ] Разбить god-компоненты: `product-detail/page.tsx` (1644 строк),
      `compare/page.tsx` (1030), `business/page.tsx` (900), `contact/page.tsx`
      (894), `yacht-charters/page.tsx` (889), `messages/page.tsx` (811).
- [ ] Удалить дублирующий алиас `components/cart/CartDrawer.tsx` (просто
      ре-экспорт из `components/feature/CartDrawer`).
- [ ] `mocks/` используется напрямую в проде (`pages/compare/page.tsx`,
      `FavoritesList.tsx`) — заменить на реальные данные из `api-services`.
- [ ] Нет клиентской схемной валидации форм (Zod установлен, но не
      используется) — хотя бы для checkout/auth форм.

### Инфраструктура
- [ ] `backend/Dockerfile` — псевдо-multi-stage (фактически один stage),
      dev-зависимости и build-тулчейн попадают в прод-образ. Сделать настоящий
      multi-stage build с `pnpm prune --prod` в финальном слое.
- [ ] Ни один прод-сервис (backend/frontend/nginx) не запускается от non-root
      пользователя, хотя эталон уже есть (`docker/backup/Dockerfile`, non-root
      UID 10001). Применить тот же паттерн.
- [ ] Миграции БД не применяются автоматически в CI/CD (`supabase db push`
      только вручную) — добавить в `cd.yml` или отдельный контролируемый шаг.
- [ ] Dependabot настроен только на `github-actions`, не отслеживает
      npm/pnpm-зависимости — добавить экосистемы `npm` для `frontend/`,
      `backend/`, `shared/`.
- [ ] Нет GitHub Environments с protection rules (required reviewers) перед
      продакшен-деплоем.
- [ ] Turborepo-кеш не используется в CI (`.turbo` не кэшируется через
      `actions/cache`) — каждый прогон пересобирает всё с нуля.
- [ ] Уточнить статус `docker/backup/Dockerfile` — не подключён ни в один
      `docker-compose*.yml`, неясно, используется ли реально.

---

## 🟡 Желательно

- [x] **Полностью переписать корневой `README.md`** — обновлён под реальный
      pnpm-монорепозиторий, NestJS, React/Vite, Docker Compose, Supabase и
      текущие команды разработки/тестирования.
- [ ] Привести в соответствие документацию (`docs/MAINTENANCE_STRATEGY.md`,
      `docs/INFRASTRUCTURE.md`) и реальность: упоминаемые Uptime Kuma и
      сквозной `x-request-id` трейсинг не найдены в коде/compose — либо
      реализовать, либо убрать из документов как "future work".
- [ ] Вынести хардкод Supabase project ref из `nginx/nginx.prod.conf` через
      шаблонизацию/env at build.
- [ ] Убрать смешение icon-систем (`lucide-react` + `remixicon` классы) —
      выбрать одну.
- [ ] Закрепить GitHub Actions по commit SHA вместо тегов
      (`appleboy/ssh-action@v1.0.3` → конкретный SHA) для supply-chain security.
- [ ] Добавить `supabase/tests/` с pgTAP-тестами для RLS-политик — сейчас
      проверка только ручная (`RLS_DEPLOYMENT_CHECKLIST.md`).
- [ ] Общий `retry()`/`enrichWithRelations()` helper вместо дублирующихся
      ручных "join" паттернов в `bookings.repository.ts`,
      `blog.repository.ts`, `forum.repository.ts`.

---

## Сводные оценки на момент аудита

| Область | Оценка |
|---|---|
| Backend | 5.5/10 |
| Frontend | 5.5/10 |
| Инфраструктура/DevOps | 6/10 |
| **Итого** | **5.7/10** |
