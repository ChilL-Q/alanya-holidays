# Alanya Holidays — Спринт недовершённых задач

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Завершить 17 незаконченных задач из dock/AlanyaHolidays_Tasks.md и dock/PLATFORM_EDITS.md, приоритизируя монетизацию и критичные баги.

**Architecture:** Спринт разбит на два цикла:
- **Sprint 1 (недели 1-2):** Критичные баги + монетизация (Задача 3, 17, BUG-004, -010, -011)
- **Sprint 2 (недели 3-4):** Сообщество (COM-001, COM-002, AI-001) + текстовые правки

**Tech Stack:** React 19, TypeScript, Supabase, Stripe, Resend, Deno Edge Functions

## Global Constraints

- Все коммиты без `Co-Authored-By` (feedback_no_coauthorship.md)
- Все правки TypeScript — через Serena MCP (`replace_symbol_body`, `rename_symbol`)
- БД: миграции идемпотентны, RLS проверены
- Тесты: все существующие должны пройти перед merge

---

# 📋 SPRINT 1 — Критичные баги + Монетизация (2 недели)

## Task 1.1: BUG-011 — Admin Directory Sort by base_score

**Files:**
- Modify: `api-services/api/directory.ts:24-25`

**Interfaces:**
- Consumes: `getDirectoryListings(params)` — текущая сигнатура
- Produces: Результат отсортирован по `base_score DESC` вместо `created_at DESC`

- [ ] **Step 1:** Открыть `api-services/api/directory.ts`, найти `getDirectoryListings()` функцию
- [ ] **Step 2:** Заменить сортировку: `order('created_at', { ascending: false })` → `order('base_score', { ascending: false })`
- [ ] **Step 3:** Запустить `npm run test -- api/directory` — проверить, что тесты не сломались
- [ ] **Step 4:** Локально протестировать админ-панель: `/admin/directory` должна показывать Signature листинги выше Explorer
- [ ] **Step 5:** Commit
```bash
git add api-services/api/directory.ts
git commit -m "fix: admin directory sorts by base_score instead of created_at"
```

---

## Task 1.2: BUG-004 — Explorer Photo Limit API Validation

**Files:**
- Modify: `api-services/api/directory.ts` (updateDirectoryListing function)

**Interfaces:**
- Consumes: `updateDirectoryListing({ gallery, tier, ... })`
- Produces: Throws `PhotoLimitError` if `gallery.length > TIER_LIMITS[tier]`

- [ ] **Step 1:** Открыть `api-services/api/directory.ts`, найти функцию `updateDirectoryListing`
- [ ] **Step 2:** Добавить валидацию перед `supabase.from('directory_listings').update()`:
```typescript
const TIER_LIMITS = { explorer: 5, voyager: 50, signature: 100, partner: 100 };
const limit = TIER_LIMITS[tier];
if (gallery && gallery.length > limit) {
  throw new Error(`Photo limit exceeded for ${tier} tier: max ${limit}, got ${gallery.length}`);
}
```
- [ ] **Step 3:** Запустить тесты: `npm run test -- api/directory`
- [ ] **Step 4:** Протестировать в админке: попробовать загрузить 10 фото для Explorer листинга — должна быть ошибка
- [ ] **Step 5:** Commit
```bash
git add api-services/api/directory.ts
git commit -m "fix: validate photo limit on API for all tiers (explorer 5, voyager 50, signature 100)"
```

---

## Task 1.3: BUG-010 — Email on Subscription Updated

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts` (customer.subscription.updated handler)
- Modify: `supabase/functions/send-email/templates/subscription-cancelled.ts` (if needed, or reuse existing)

**Interfaces:**
- Consumes: Stripe webhook `customer.subscription.updated` event
- Produces: Email sent when `cancel_at_period_end = true` or `past_due → active` recovery

- [ ] **Step 1:** Открыть `supabase/functions/stripe-webhook/index.ts`, найти handler для `customer.subscription.updated` (~line 168)
- [ ] **Step 2:** Найти условие `if (subscription.cancel_at_period_end)` — добавить после него email-вызов
- [ ] **Step 3:** Для `past_due → active` recovery добавить похожее
- [ ] **Step 4:** Запустить локально: `supabase functions serve stripe-webhook`
- [ ] **Step 5:** Commit
```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "fix: send email on subscription.updated (cancellation scheduled, recovery)"
```

---

## Task 1.4: BUG-008 — PhotoUploader MIME Validation

**Files:**
- Modify: `api-services/api/storage.ts:24-26`

**Interfaces:**
- Consumes: `file.type` (может быть пустой string)
- Produces: Reject если `!file.type` OR type not in ALLOWED_MIME_TYPES

- [ ] **Step 1:** Открыть `api-services/api/storage.ts`, найти MIME-check
- [ ] **Step 2:** Заменить проверку с `&&` на `||` (reject если empty)
- [ ] **Step 3:** Написать тест в `api-services/api/storage.test.ts`
- [ ] **Step 4:** `npm run test -- storage`
- [ ] **Step 5:** Commit
```bash
git add api-services/api/storage.ts api-services/api/storage.test.ts
git commit -m "fix: reject files with empty MIME type (security)"
```

---

## Task 1.5: Задача 3 — Tier Selection Modal перед листингом

**Files:**
- Create: `components/directory/TierSelectionModal.tsx` (уже существует, но нужно улучшить)
- Modify: `pages/AddListingPage.tsx:51, 71-83` (race condition fix, уже сделано в commit aee7a32, но дополнить)
- Modify: `pages/AddListingPage.tsx` (интеграция выбора тарифа перед формой)

**Interfaces:**
- Consumes: `getPremiumStatus()` результат
- Produces: `showTierModal` state, редирект на `/subscribe?tier=X` для платных

**Note:** Part of commit aee7a32 уже сделал базовый фикс race condition. Нужно расширить функционал

- [ ] **Step 1:** Откройте `pages/AddListingPage.tsx`, строка ~51 — проверьте текущее состояние `showTierModal`
- [ ] **Step 2:** Убедитесь race condition фиксирована (useEffect вызывает setShowTierModal после getPremiumStatus, не синхронно на mount)
- [ ] **Step 3:** После закрытия модали (выбора тарифа) — сохранить выбранный tier в state/query param
- [ ] **Step 4:** В форме листинга: скрывать/показывать поля на основе `selectedTier`
- [ ] **Step 5:** Протестировать: зайти на `/add-listing`, модаль должна появиться, выбор Explorer закрывает модаль, Voyager/Signature редиректят
- [ ] **Step 6:** Commit
```bash
git add pages/AddListingPage.tsx components/directory/TierSelectionModal.tsx
git commit -m "feat: tier selection modal on add-listing flow (phase 2 continuation)"
```

---

## Task 1.6: Задача 17 — Bank Details Popup для платных тарифов

**Files:**
- Modify: `pages/AddListingPage.tsx:141-163` (success screen)
- Create: `supabase/functions/send-email/templates/bank-details.ts` (if needed)

**Interfaces:**
- Consumes: `tier` state (explorer/voyager/signature)
- Produces: Different success text + bank details email for paid tiers

- [ ] **Step 1:** Откройте `pages/AddListingPage.tsx`, найдите success-экран (~141)
- [ ] **Step 2:** Обновите текст для всех тарифов + дополнительный для платных
- [ ] **Step 3:** Для платных тарифов — после submit вызвать send-email с банковскими реквизитами
- [ ] **Step 4:** Протестировать: создать listng с paid tier, проверить success экран
- [ ] **Step 5:** Commit
```bash
git add pages/AddListingPage.tsx supabase/functions/send-email/index.ts
git commit -m "feat: add bank details popup for paid listing tiers + success email"
```

---

## Progress Ledger

(Will be updated as tasks complete)
