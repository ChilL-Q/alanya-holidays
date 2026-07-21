# Backlog — Alanya Holidays

Проект в рабочем состоянии. Здесь собраны все оставшиеся задачи по приоритету.

---

## КРИТИЧНО — сделать до следующего релиза

### 1. Применить DB-скрипты к production

Без этого audit logs и property overrides не работают в production.

```bash
# Подключиться к Supabase SQL Editor и выполнить:
# supabase/db_scripts/setup_audit_logs.sql
# supabase/db_scripts/setup_property_overrides.sql
```

После применения — заполнить таблицу `property_overrides` через Supabase Dashboard:
- добавить slug → UUID маппинги для featured-объектов (ранее были захардкожены в `properties.ts`)

### 2. Сменить email домен в `send-email`

Файл: `supabase/functions/send-email/index.ts:153`

```ts
// Сейчас:
from: 'Alanya Holidays <onboarding@resend.dev>'

// Заменить на верифицированный домен в Resend:
from: 'Alanya Holidays <noreply@alanya-holidays.com>'
```

Для этого нужно верифицировать домен в [resend.com/domains](https://resend.com/domains).

---

## ВЫСОКИЙ ПРИОРИТЕТ — типизация

### 3. `bookings.ts` — убрать `any` из `createBooking`

Файл: `api-services/api/bookings.ts:11`

`createBooking(data: any)` принимает что угодно. Уже есть `bookingSchema` — нужно вывести тип из него.

```ts
// Добавить в schemas.ts или bookings.ts:
import { z } from 'zod';
import { bookingSchema } from './schemas';

export type BookingCreateData = z.infer<typeof bookingSchema>;

// Заменить сигнатуру:
async createBooking(data: BookingCreateData) {
```

Заодно убрать `as any` в строках 77, 122–127, 145–146 — там маппинг данных из Supabase, можно типизировать через `Booking` из `types/models.ts`.

### 4. `properties.ts` — убрать `as any[]` в availability-методах

Файл: `api-services/api/properties.ts:519, 590`

Тип `PropertyAvailability` уже есть в `types/models.ts`. Просто импортировать и использовать:

```ts
import { PropertyAvailability } from '../../types/models';

// Заменить:
return data as any[];
// На:
return data as PropertyAvailability[];
```

### 5. `types/models.ts` — почистить `any` в интерфейсах

Файл: `types/models.ts`

```ts
// Строка 288 — заменить:
amenities: (string | any)[];
// На:
amenities: string[];

// Строка 299 — заменить:
type: any;
// На:
type: ServiceDB['type'];
```

---

## СРЕДНИЙ ПРИОРИТЕТ — качество кода

### 6. `usePropertyFilters.ts` — убрать 4x `@ts-ignore`

Файл: `hooks/usePropertyFilters.ts:186–193`

Проблема в `activeFilterCount` — перебор ключей объекта `filters` без типа. Решение:

```ts
// Заменить блок с @ts-ignore на:
const activeFilterCount = (Object.keys(filters) as Array<keyof typeof filters>).reduce((acc, key) => {
    if (key === 'priceRange') return acc;
    const val = filters[key];
    if (Array.isArray(val)) return acc + val.length;
    if (typeof val === 'boolean') return acc + (val ? 1 : 0);
    if (typeof val === 'number' && key.startsWith('min')) return acc + (val > (key === 'minGuests' ? 1 : 0) ? 1 : 0);
    return acc;
}, 0);
```

### 7. `aiService.ts` — кастомный класс ошибки вместо `@ts-ignore`

Файл: `api-services/aiService.ts:83–84`

```ts
// Убрать @ts-ignore, создать типизированную ошибку:
class RateLimitError extends Error {
    readonly isRateLimit = true;
    constructor() {
        super('RATE_LIMIT');
        this.name = 'RateLimitError';
    }
}

// Использовать:
throw new RateLimitError();

// Проверять:
if (error instanceof RateLimitError || ...) {
```

---

## НИЗКИЙ ПРИОРИТЕТ — nice to have

### 8. Удалить `test-booking.cjs`

Файл: `test-booking.cjs` — это ручной скрипт для отладки, не нужен в репо. Удалить.

### 9. `conductor/` и `docs/` — не коммитить в репо

Эти директории содержат артефакты сессий разработки. Добавить в `.gitignore`:

```
conductor/
```

---

## Статус фаз (из исходного плана)

| Фаза | Задача | Статус |
|------|--------|--------|
| 1 | DB Setup (audit_logs, property_overrides) | ✅ Скрипты написаны, ❌ не применены в prod |
| 2 | Core Utilities (retry, appUrl) | ✅ Готово |
| 3 | Bookings & Auditing | ✅ Готово |
| 4 | Properties & Performance | ✅ Готово |
| 5 | AI Fallback & Final Audit | ✅ Готово |
| — | Типизация (`any` cleanup) | ⏳ Пункты 3–7 выше |
| — | Ops (email домен, DB prod) | ⏳ Пункты 1–2 выше |
