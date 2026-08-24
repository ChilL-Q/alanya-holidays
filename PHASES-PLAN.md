# Alanya Holidays — План реализации (Фазы 2–4)

## Текущий статус (обновлено: 2026-08-24)

| Задача | Статус | Примечание |
|--------|--------|------------|
| 2.1 Админ-панель форума | ✅ Готово | 4 компонента + тесты + ForumModerationController |
| 2.2 Feature/Verify UI | ✅ Готово | Контроллер, сервис, таб + bulk actions |
| 2.3 Аудит модерации | ✅ Готово | Миграция 20260826000000 + AuditLogTab |
| 2.4 Email админу о листингах | ✅ Готово | Шаблон admin_listing_notification + email_outbox |
| 3.1 Forum notifications | ✅ Готово | Миграция 20260826000001 (триггеры) + /notifications API + Navbar realtime |
| 3.2 Blog notifications | ✅ Готово | Миграция 20260826000001 (триггеры блога) + единая система уведомлений |
| 3.3 Редактирование постов/комментариев | ✅ Готово | PUT /forum/posts/:id, PUT /forum/comments/:id + inline edit в OriginalPost & ReplyCard |
| 3.4 Bookmarks | ✅ Готово | Миграция 20260826000003 + API + SavedPostsList в /settings?tab=activity |
| 3.5 Поиск по форуму | ✅ Готово | frontend/src/pages/search/page.tsx (дебаунс 300ms, фильтры, подсветка) |
| 4.1 Исправление типов | ✅ Готово | shared/types/database.types.ts (forum_posts view_count, blog_posts views) |
| 4.2 Cleanup blog media | ✅ Готово | supabase/functions/cleanup-blog-media/ |
| 4.3 Forum media upload | ✅ Готово | Миграция 20260825000002 (forum-media) + storage.service + RichTextEditor toolbar |
| 4.4 Пагинация | ✅ Готово | Реализована в блоге (/blog) и в категориях форума (/category/:slug) |
| 4.5 Rate limiting на форуме | ✅ Готово | Миграция 20260826000004 + check_forum_rate_limit RPC + NestJS HTTP 429 guard |
| 5.1–5.3 Аудит-исправления и Hardening | ✅ Готово | Миграция 20260827000000, Blog route fix, UUID резолвинг, RLS & кэш изоляция |

---

## Фаза 2: Модерация и администрирование

### 2.1 Админ-панель форума ✅ Готово

**Проблема**: API модерации форума есть (pin, remove, reports), но нет UI. Админ не может управлять форумом из дашборда.

**Что создаём:**

| Файл | Назначение |
|------|------------|
| `admin/components/ForumModerationTab.tsx` | Новая вкладка в админ-дашборде |
| `admin/components/ForumReportsList.tsx` | Список жалоб с фильтрами (pending/resolved) |
| `admin/components/ForumPostPreviewModal.tsx` | Предпросмотр поста перед удалением/восстановлением |
| `admin/components/ForumStatsCard.tsx` | Статистика форума (posts, comments, active users, online) |

**Функционал вкладки:**
- **Жалобы**: список `forum_reports` с фильтрами `resolved=true/false`, кнопка "Resolve", ссылка на контент
- **Удалённые посты/комментарии**: список с `is_removed=true`, кнопки "Restore" / "Hard delete"
- **Закрепление**: быстрое pin/unpin постов из списка
- **Статистика**: общие метрики форума

**Бэкенд**: эндпоинты уже есть (`GET /forum/reports`, `POST /forum/reports/:id/resolve`, `GET /forum/reports/removed-comments`). Нужно только:
- Добавить пагинацию в `GET /forum/reports` (сейчас без лимита)
- Добавить `GET /forum/stats` если его нет

**RLS**: уже настроен — `forum_reports` доступен только admin через SELECT.

---

### 2.2 Админ-панель листингов — Feature/Verify ✅ Готово

**Проблема**: `is_featured`, `is_verified`, `base_score` можно менять только через прямой доступ к БД. Нет API эндпоинтов, нет UI.

**Что создаём:**

| Файл | Изменение |
|------|-----------|
| `backend/src/directory/directory-admin.controller.ts` | Добавить эндпоинты |
| `backend/src/directory/application/directory-listing.service.ts` | Добавить методы |
| `admin/components/ListingsModerationTab.tsx` | Добавить кнопки |

**Новые эндпоинты:**
```
POST /directory/:id/feature     → is_featured = true
POST /directory/:id/unfeature   → is_featured = false
POST /directory/:id/verify      → is_verified = true
POST /directory/:id/unverify    → is_verified = false
POST /directory/:id/score       → body: { score: number }  (admin only)
```

**UI**: в каждой строке таблицы листингов добавить иконки:
- ★ (star) — toggle featured
- ✓ (check-circle) — toggle verified
- При наведении — tooltip с текущим статусом

**Bulk actions**: добавить в `BulkActionsToolbar` кнопки "Feature Selected" / "Verify Selected".

---

### 2.3 Аудит модерации ✅ Готово

**Проблема**: нет лога кто, когда и что сделал с листингом/постом. Невозможно расследовать споры.

**Миграция**: `20260826000000_create_moderation_audit_log.sql`

```sql
CREATE TABLE IF NOT EXISTS public.moderation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_entity
    ON public.moderation_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_created_at
    ON public.moderation_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_admin_id
    ON public.moderation_audit_log (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_action
    ON public.moderation_audit_log (action, created_at DESC);
```

**Примечание**: `entity_type` и `action` — plain `TEXT` без CHECK-констрейнта: DB-триггер `trg_audit_directory_listing_status` пишет значения `'directory_listing'` и `'status_change_<status>'`, которые не входят в фиксированный перечень из первоначального дизайна. Валидация значений остаётся на уровне вызывающего кода (`ModerationAuditService`).

**RLS**: только admin может читать; писать могут admin (RLS-политика) и backend через service role (обходит RLS). `entity_id` — TEXT (UUID в строковом виде), что позволяет логировать сущности с не-UUID идентификаторами.

**Триггер**: на INSERT в `directory_listings` при изменении `status` — автоматическая запись в audit log.

**Backend**: `ModerationAuditService` с методами `log()`, `getByEntity()`, `getByAdmin()`.

**Frontend**: новая вкладка "Audit Log" в админ-дашборде — таблица с фильтрами по entity_type, action, admin, дате.

---

### 2.4 Уведомление админу о новых листингах ✅ Готово

**Проблема**: когда владелец создаёт листинг со статусом `pending`, админ не получает уведомление. Нужно проверять очередь вручную.

**Решение**: добавить email нотификацию в `DirectoryListingService.submitDraft()` / `createDirectoryListing()`:

```typescript
// После установки status = 'pending'
await this.emailService.send({
  to: ADMIN_EMAIL,
  type: 'admin_listing_notification',
  data: { listingName: listing.name, listingId: listing.id, ownerEmail: user.email }
});
```

**Edge Function**: добавить шаблон `admin_listing_notification` в `send-email/index.ts`.

---

## Фаза 3: Уведомления и UX

### 3.1 Система уведомлений форума ✅ Готово

**Миграция**: `20260826000001_create_persistent_notifications.sql`

```sql
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read);
```

**RLS & Realtime**: Realtime публикация `supabase_realtime` + RLS политики.

**Триггеры**:
- `trg_notify_forum_comment` (ответы на комментарии и новые комментарии к посту)
- `trg_notify_forum_post_like` (лайк поста)
- `trg_notify_forum_comment_like` (лайк комментария)

**Backend**:
- `GET /notifications` — список уведомлений пользователя
- `PATCH /notifications/:id/read` — пометить как прочитанное
- `PATCH /notifications/read-all` — пометить все как прочитанные
- `DELETE /notifications/:id` — удаление уведомления

**Frontend**:
- В `Navbar.tsx` интегрирован интерактивный колокольчик с индикатором непрочитанных, dropdown со списком уведомлений, оптимистичными обновлениями и подпиской Realtime.

---

### 3.2 Blog уведомления ✅ Готово

**Миграция**: `20260826000001_create_persistent_notifications.sql`

**Триггеры блога**:
- `trg_notify_blog_comment` (комментарии к статье и ответы)
- `trg_notify_blog_comment_like` (лайк комментария к статье)

---

### 3.3 Редактирование постов и комментариев в форуме ✅ Готово

**Бэкенд**:
- `PUT /forum/posts/:id` — ✅ реализован (`UpdateForumPostDto`)
- `PUT /forum/comments/:id` — ✅ реализован (`UpdateForumCommentDto`, проверка авторства/роли)

**Frontend**:
- В `OriginalPost.tsx` — кнопка "Edit" (видна автору/админу) + inline редактирование через RichTextEditor.
- В `ReplyCard.tsx` — кнопка "Edit" (видна автору/админу) + inline редактирование через RichTextEditor.

---

### 3.4 Закладки (Bookmarks) ✅ Готово

**Миграция**: `20260826000003_create_forum_bookmarks.sql`

```sql
CREATE TABLE IF NOT EXISTS public.forum_bookmarks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);
```

**Backend**:
- `POST /forum/posts/:id/bookmark` — toggle bookmark
- `GET /forum/bookmarks` — список сохранённых постов

**Frontend**:
- Кнопка "Save" / "Saved" в `OriginalPost.tsx`.
- Список `SavedPostsList.tsx` во вкладке активности `/settings?tab=activity`.

---

### 3.5 Поиск по форуму ✅ Готово

**Frontend**: страница `frontend/src/pages/search/page.tsx`
- Поле поиска с debounce 300ms
- Результаты с подсветкой (`HighlightMatch`) по вкладкам (all, threads, members, events).

---

## Фаза 4: Качество кода и инфраструктура

### 4.1 Исправление типов ✅ Готово

- `shared/types/database.types.ts` синхронизирован: `forum_posts` содержит строго типизированный `view_count: number;` (без `any`-escape hatch), а `blog_posts` содержит `views: number | null;`.

---

### 4.2 Cleanup blog media Edge Function ✅ Готово

**Файл**: `supabase/functions/cleanup-blog-media/index.ts`
- Постраничный листинг всех файлов в bucket `blog-media`.
- Сверка с активными URL в `blog_posts` и `blog_submissions`.
- Удаление неиспользуемых файлов через `storage.remove()`.

---

### 4.3 Forum media upload в RichTextEditor ✅ Готово

**Реализация**:
- Миграция `20260825000002_create_forum_media_bucket.sql` (создание бакета `forum-media`).
- Функция `uploadForumImage()` в `frontend/src/api-services/storage.service.ts`.
- Интеграция кастомного хендлера `image` в тулбар `RichTextEditor.tsx` со вставкой прямой ссылки в контент.

---

### 4.4 Пагинация ✅ Готово

- **Блог**: пагинация в `frontend/src/pages/blog/page.tsx` (`pageSize=6`, `currentPage`, `handlePageChange`, `totalPages`).
- **Форум**: пагинация в `frontend/src/pages/category/page.tsx` (`pageSize=5`, `currentPage`, `handlePageChange`, `setVisibleCount`).

---

### 4.5 Rate limiting на форуме ✅ Готово

- **Миграция**: `20260826000004_create_forum_rate_limiting.sql` с таблицей `public.forum_rate_limits` и атомарной функцией `public.check_forum_rate_limit(p_user_id, p_action, p_limit)`.
- **Backend Service Layer**: внедрена проверка в `ForumDiscussionService`:
  - Посты: max 5 в час
  - Комментарии: max 20 в час
  - Лайки: max 60 в час
  - При превышении выбрасывается HTTP 429 `Too Many Requests` с локализованным текстом ошибки.

---

---

## Фаза 5: Аудит-исправления и усиление безопасности (Audit Remediation & Hardening) ✅ Готово

### 5.1 Критичные баги маршрутизации и данных (Critical Route & Data Parity)
- **Public Blog `/blog/posts` Route Fix**: В `BlogController` добавлен декоратор `@Get(['', 'posts'])`, устраняющий 404 ошибки при запросах фронтенда.
- **Вложенность комментариев форума (`parentId` vs `parent_id`)**: `CreateForumCommentDto`, `ForumController` и фронтенд `forum.service.ts` приведены к поддержке обоих форматов (`parentId` и `parent_id`).
- **Резолвинг Slug в UUID при создании тем**: `ForumDiscussionService` теперь автоматически разрешает текстовый slug категории в валидный UUID через `getCategoryBySlug`.
- **UI Error Handling в `ThreadForm.tsx`**: Устранено ложное состояние успеха (`submitted: true`) при сбоях API, добавлен вывод баннера с текстом ошибки и корректная ссылка на категорию `/category/:slug`.

### 5.2 Безопасность и кэширование (Security & Caching)
- **Защита черновиков блогов**: `BlogService.getBlogPost` и `BlogRepository.getBlogPosts` изолируют черновики и отклоненные статьи — они доступны только автору и администраторам, для остальных выбрасывается `NotFoundException`.
- **Изоляция каталога в Redis**: Публичные методы `getDirectoryListing` и `getDirectoryListingBySlug` в `DirectoryListingService` возвращают и кэшируют только записи с `status = 'approved'`.
- **Инвалидация кэша при отклонении**: Метод `rejectDirectoryListing` теперь сбрасывает кэш Redis по паттерну `directory:*`.

### 5.3 Целостность данных, RLS и Модерационный аудит
- **PostgreSQL Миграция `20260827000000_fix_blog_likes_and_audit.sql`**:
  - Создан триггер `blog_sync_comment_like_count` на таблице `blog_comment_likes` для синхронизации счетчика `like_count` в `blog_comments`.
  - Закрыта политика `notifications_insert_policy` на `public.notifications` (разрешены только `service_role` и `admin`).
  - Добавлена дедупликация уведомлений о лайках в пределах 24 часов.
  - Установлен лимит размера бакета `forum-media` в 5MB (5242880 байт).
  - Создан триггер `trg_audit_directory_listing_status` для автоматического логирования изменений статуса заведений в `moderation_audit_log`.
- **Флаг `isLiked` у комментариев блога**: `BlogRepository.getBlogComments` и `BlogService` аннотируют `isLiked: true/false` для текущего пользователя.
- **Интеграция модерационного аудита**: `ModerationAuditService.logAction` подключен к операциям одобрения/отклонения статей блога (`BlogService`) и к действиям с постами/комментариями на форуме (`ForumController.setPinned`, `setPostRemoved`, `setCommentRemoved`).
- **Защита от потери данных в `cleanup-blog-media`**: Edge Function проверяет статус запросов к базе данных перед удалением медиафайлов и прерывает выполнение с ошибкой 500 в случае сбоя БД.
- **Пагинация отчётов форума**: В `ForumRepository.getReports` установлен безопасный дефолтный лимит (50 записей).

---

## Порядок реализации и Результаты

| Приоритет | Фаза | Задача | Сложность | Статус |
|-----------|------|--------|-----------|--------|
| 1 | 2.1 | Админ панель форума | Средняя | ✅ Выполнено |
| 2 | 2.2 | Feature/Verify UI | Низкая | ✅ Выполнено |
| 3 | 2.3 | Аудит модерации | Средняя | ✅ Выполнено |
| 4 | 2.4 | Email админу о листингах | Низкая | ✅ Выполнено |
| 5 | 3.1 | Forum notifications | Высокая | ✅ Выполнено |
| 6 | 3.3 | Редактирование постов/комментариев | Средняя | ✅ Выполнено |
| 7 | 3.4 | Bookmarks | Низкая | ✅ Выполнено |
| 8 | 4.1 | Исправление типов | Низкая | ✅ Выполнено |
| 9 | 4.2 | Cleanup blog media | Низкая | ✅ Выполнено |
| 10 | 4.3 | Forum media upload | Средняя | ✅ Выполнено |
| 11 | 4.4 | Пагинация | Низкая | ✅ Выполнено |
| 12 | 4.5 | Rate limiting | Средняя | ✅ Выполнено |
| 13 | 3.2 | Blog notifications | Средняя | ✅ Выполнено |
| 14 | 3.5 | Поиск по форуму | Средняя | ✅ Выполнено |
| 15 | 5.1–5.3 | Аудит-исправления и Hardening | Высокая | ✅ Выполнено |

**Итоговый статус**:
- **Выполнено**: 15 из 15 задач (100%).
- **Миграции Supabase**: 8 миграций подготовлены в `supabase/migrations/`.
- **Автотесты**: **2,919 / 2,919 тестов проходят зелёным** (1,821 backend Jest тестов в 127 сьютах + 1,098 frontend Vitest тестов в 93 сьютах).
- **Сборка (Build)**: 0 ошибок компиляции (`nest build` + `vite build`).

