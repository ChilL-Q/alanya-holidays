# План этапов 3–4: Рефакторинг 3.5 + Единый Admin CRUD

> Создан: 2026-08-22.
> Контекст: этапы 1–2 завершены (drafts для всех типов листингов, вкладка Upgrades).
> Этот документ детализирует оставшиеся этапы перед мержем в продакшен.

---

## Принципы (зафиксированы на grilling-сессии)

| # | Принцип | Смысл |
|---|---|---|
| 1 | **Инвариант объявляется один раз** | Protected-fields, tier photo limits, permission model существуют ровно в одном месте; доказывается тестом |
| 2 | **Агрегат = сервис, роль = контроллер** | Модерация — роль (`@RequireRole('admin')`), не домен. См. `docs/adr/0001-moderation-is-a-role-not-a-service.md` |
| 3 | **HTTP заморожен байт-в-байт** | Роуты/payload'ы/коды ответов не меняются; тесты контроллеров проходят без правок |
| 4 | **Тесты до кода** | Инвариантные тесты пишутся против старого кода и остаются зелёными после |
| 5 | **Surgical changes** | Никаких попутных улучшений вне скоупа (karpathy-guidelines) |

Скоуп сквозных вырезаний: нормализатор входа directory, toggle-хелпер forum,
SELECT-строки → репозиторий, admin-guard унификация.
**Вне скоупа** (отдельные follow-up): NotificationService для email-glue,
Redis read-through кэш-декоратор, моковые e2e, `escapeValue` в i18n.

---

## ЭТАП 3 — Рефакторинг 3.5 (4 PR)

### PR-1: Фундамент (инвариантные тесты + дедуп getUserRole + VO diff)

**Цель:** подготовить safety net и убрать авторизационный шум до сплитов.

#### 1.1 Инвариантные тесты против старого кода
Пишутся ДО любых движений кода. После рефакторинга должны остаться зелёными без правок.

Файлы:
- [ ] `backend/src/directory/directory.invariants.spec.ts`:
  - protected-fields firewall: попытка записать `is_verified`, `is_featured`,
    `base_score`, `subscription_id`, `owner_user_id`, `rejection_reason`
    через `saveDraft` / `publishDraft` / `createDirectoryListing` / `updateDirectoryListing`
    → поля отброшены;
  - tier photo limits: explorer=5, voyager=50, signature/partner=100 — во всех трёх путях
    (draft/publish/create) лимит один и тот же;
  - state machine: `publishDraft` переводит только в `pending`; прямой
    `draft → approved` через пользовательские методы невозможен;
  - ownership: foreign draft save/publish → `UnauthorizedException`.
- [ ] `backend/src/forum/forum.invariants.spec.ts`:
  - permission model: categories/events/pin/remove/resolve-report = admin-only;
    posts/comments update/delete = author-or-admin; likes/RSVP/report = any authed;
  - race-safe toggle: повторная вставка лайка при concurrency (PG 23505) не бросает;
  - slug uniqueness: коллизия слага порождает уникальный суффикс;
  - soft removal: `removedOnly`/`includeRemoved` взаимоисключающи.

Критерий: тесты падают на старом коде только если найден реальный баг (тогда фикс отдельно),
после PR-2/PR-3 проходят без изменений.

#### 1.2 Дедуп `getUserRole()` → `UserRolesRepository`
Аудит зафиксировал дубликат в ~9 репозиториях. Это нарушение решения 3.6.

- [ ] Найти все копии: `rg -n "getUserRole" backend/src --glob '!*.spec.ts'`
- [ ] В каждом репозитории удалить собственную реализацию; внедрить
      `UserRolesRepository` (`backend/src/common/auth/user-roles.repository.ts`)
- [ ] Обновить провайдеры модулей
- [ ] ВНИМАНИЕ: методы, где роль используется для owner-or-admin проверки внутри сервиса,
      НЕ трогаем в этом PR (их устранение — часть PR-2/3). Меняем только источник роли.

Критерий: `rg "async getUserRole" backend/src --glob '!*.spec.ts'` → 0 результатов
(кроме `user-roles.repository.ts`).

#### 1.3 Diff и дедуп VO (Money, StayPeriod, и т.п.)
- [ ] `rg -ln "class Money" backend/src shared frontend/src` — найти копии
- [ ] Для каждой пары копий: сравнить реализации. Если идентичны → удалить локальную,
      импорт из `common/domain/value-objects`. Если разошлись → разрешить расхождение явно
      (создать задачу на баг), а не молча заменить
- [ ] Аналогично StayPeriod и прочим VO

Критерий: каждая VO определена ровно один раз; type-check зелёный.

**Ворота PR-1:** `npm test` (backend) 100% · `test:e2e` 13/13 · type-check/lint 0 · новые инвариантные тесты зелёные.

---

### PR-2: Directory split

**Исходное:** `directory.service.ts` (872 LOC), `directory.controller.ts`.

#### 2.1 Нормализатор входа (сквозной #1 — ядро задачи)
- [ ] `backend/src/directory/domain/listing-input.schema.ts` — единое место:
  - Zod-схема (или class-transformer трансформер — по стилю проекта) входа листинга:
    coercion типов, truncation длин полей (как текущие ~70 строк defensive-копипасты);
  - константа `PROTECTED_FIELDS` (единый список вместо двух расходящихся `delete`-блоков);
  - константы `TIER_PHOTO_LIMITS`;
  - функция `stripProtectedFields(input)`.

#### 2.2 Сплит сервисов
- [ ] `backend/src/directory/directory-listing.service.ts` — агрегат DirectoryListing:
  - чтение/кэш листингов (getDirectoryListings, byId/bySlug/byCategory/search, curated);
  - votes cluster;
  - CRUD владельца: saveDraft, publishDraft, create/update/delete;
  - **approve/reject** (переходы state machine листинга; админская роль — на контроллере);
  - addons/checkout glue (оставить здесь, NotificationService — follow-up).
- [ ] `backend/src/directory/listing-claim.service.ts` — агрегат ListingClaim:
  - submitListingClaim, verifyClaimEmail, getListingClaims, getMyListingClaims,
    approveListingClaim, rejectListingClaim (+ общая приватная база для близнецов approve/reject).
- [ ] Старый `DirectoryService` удалить; `DirectoryModule` обновить провайдеры.

#### 2.3 Сплит контроллеров (роуты 1-в-1!)
- [ ] `directory.controller.ts` — публичные + owner эндпоинты (без изменений путей)
- [ ] `directory-admin.controller.ts` — перенос существующих админских эндпоинтов
      (admin listings list, approve/reject, claims approve/reject) под
      `AuthGuard + RolesGuard + @RequireRole('admin')`; пути те же, что были
- [ ] Удалить все вызовы `getUserRole()` из сервисов — роль решают гарды

Критерий: тесты контроллеров directory проходят БЕЗ правок; инвариантные тесты из PR-1 зелёные;
`directory-listing.service.ts` ≤ ~400 LOC; ноль дублей PROTECTED_FIELDS/TIER_LIMITS в кодовой базе
(`rg -c "is_verified" src/directory` — только схема).

---

### PR-3: Forum split

**Исходное:** `forum.service.ts` (747 LOC).

#### 3.1 Перенос SQL-проекций в репозиторий (сквозной #3)
- [ ] `POST_SELECT`, `EVENT_SELECT` и аннотации `annotateLikes/annotateRsvp/attachCategoryParents/_postCountsByCategory`
      → в `forum.repository.ts` (дерево категорий и rollup — обязанность репозитория категорий)

#### 3.2 Toggle-хелпер (сквозной #2)
- [ ] Приватный generic `toggleRow(table, column, id, userId)` в форумном репозитории
      или общий helper; использовать в togglePostLike / toggleCommentLike / toggleEventRsvp
      (~80 LOC → ~25). Race-safe поведение (tolerance PG 23505) сохранить и протестировать.

#### 3.3 Сплит сервисов
- [ ] `forum-discussion.service.ts`: посты, комменты, лайки, категории (CRUD + дерево через репозиторий)
- [ ] `forum-event.service.ts`: события, RSVP, attendees
- [ ] `forum-report.service.ts`: reportContent, getForumReports, resolveForumReport
- [ ] `setPinned/setRemoved/getRemovedComments` → в DiscussionService (это состояния постов/комментов)
- [ ] Старый `ForumService` удалить; `forum-moderation.controller.ts` остаётся (роуты те же),
      инъекция меняется на новые сервисы

#### 3.4 Хелпер author-or-admin
- [ ] Один приватный метод/функция вместо 3 копий (роль — через `UserRolesRepository`)

Критерий: тесты forum контроллеров без правок; инвариантные тесты зелёные;
SELECT-строки отсутствуют в сервисах (`rg "POST_SELECT" src/forum` → только repository);
toggle-логика определена один раз.

---

### PR-4: Admin-guard унификация (сквозной #4)

- [ ] Проверить остаточные ручные admin-проверки в контроллерах обоих доменов:
      `rg -n "requireAdmin|role !== 'admin'|role === 'admin'" backend/src/{directory,forum}`
- [ ] Всё перевести на `RolesGuard + @RequireRole('admin')`
- [ ] Убедиться, что ни один сервис не знает о ролях (`rg getUserRole src/{directory,forum}` → 0)
- [ ] Финальный прогон полного CI

Критерий: в services/controller слоя directory+forum нет ни одного упоминания ролей.

---

## ЭТАП 4 — Задача #12: Единый Admin CRUD + аналитика

Делается ПОСЛЕ этапа 3 — на чистых сервисах.

### 4.1 Аудит существующего admin-слоя
- [x] Enquiries CRUD + platform analytics (`admin.controller.ts`)
- [x] Per-domain модерация: directory (approve/reject), properties (flagged reviews),
      service edits, blog submissions, forum reports
- [ ] Задокументировать матрицу «сущность × CRUD × где живёт» → `docs/admin-coverage.md`

### 4.2 Недостающий CRUD
Для каждой сущности без админских операций добавить эндпоинты в соответствующий
`*-admin.controller.ts` (НЕ в единый god-controller):
properties, services, events, products, users (ban/unban), bookings (refund trigger).

Шаблон на сущность:
```
GET    /<domain>/admin?status=&page=&limit=   (list + фильтры)
GET    /<domain>/admin/:id                    (detail)
PATCH  /<domain>/admin/:id/status             (переход статуса, DTO-whitelist)
DELETE /<domain>/admin/:id                    (soft-delete где применимо)
```

### 4.3 Аналитика для admin panel
- [ ] Расширить RPC `get_platform_analytics` (миграция Sprint 2) до per-entity метрик:
      totals по statuses, growth WoW/MoM, top categories, conversion funnel listing→booking
- [ ] `AdminRepository.getPlatformAnalytics` fast-path уже есть — расширить типы

### 4.4 Frontend admin
- [ ] Страницы admin-панели для новых CRUD (паттерн существующих admin-страниц)
- [ ] Графики на `vendor-charts` бандле

Критерии этапа 4: каждый admin-эндпоинт под `@RequireRole('admin')` (тест: anonymous → 401,
user → 403, admin → 200); интеграционный тест на каждый CRUD; e2e smoke по критическому пути.

---

## Финальные ворота перед мержем

- [ ] backend: `npm test` 100%, `npm run test:e2e` 100%
- [ ] frontend: `npm test --run` 100%
- [ ] `turbo type-check` / lint — 0 ошибок и 0 предупреждений
- [ ] `turbo build` + docker build джобы CI зелёные
- [ ] HTTP-контракт не изменён: диф файлов контроллеров содержит только переносы, не изменения роутов
- [ ] AUDIT_TASKS.md: закрыть 3.5 с STATUS-отчётом
- [ ] MEMORY.md: новая веха (Milestone 46)
