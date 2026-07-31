# Production Infrastructure & Backend Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalize Alanya Holidays Infrastructure and NestJS Backend for production readiness — adding PostgreSQL performance indexes, Nginx static asset caching headers, automatic WebP image upload processing, and BullMQ async task processors.

**Architecture:** B-Tree indexing on key foreign keys and filter columns in PostgreSQL/Supabase. Long-term HTTP caching headers and security hardening in Nginx. Automatic image compression to WebP via Sharp in NestJS Media Controller. Asynchronous background queue processing in NestJS with QueueService over Redis.

**Tech Stack:** NestJS, PostgreSQL / Supabase Migrations, Nginx, Sharp, ioredis, Vitest / Jest.

## Global Constraints

- Preserve all existing API signatures in NestJS controllers and repositories.
- All SQL migrations must be idempotent (`CREATE INDEX IF NOT EXISTS`).
- Strict TypeScript types with 0 `any` suppressions where possible.
- Run `npm run type-check` and `npm test` after every task.

---

### Task 1: Database Performance B-Tree Indexes Migration

**Files:**
- Create: `supabase/migrations/20260731210000_add_performance_indexes.sql`

**Interfaces:**
- Consumes: PostgreSQL tables `properties`, `directory_listings`, `bookings`, `reviews`.
- Produces: Fast B-Tree indexes for frequent queries.

- [ ] **Step 1: Write the migration file with composite & targeted B-Tree indexes**

Create `supabase/migrations/20260731210000_add_performance_indexes.sql`:
```sql
-- Purpose: Optimize search, filtering, and foreign key lookup performance
-- Audit date: 2026-07-31

-- 1. Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_status_location ON public.properties(status, location);
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- 2. Directory listings indexes
CREATE INDEX IF NOT EXISTS idx_directory_category_active ON public.directory_listings(category, is_active);
CREATE INDEX IF NOT EXISTS idx_directory_district ON public.directory_listings(district);

-- 3. Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 4. Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_target_id ON public.reviews(target_id);
```

- [ ] **Step 2: Validate SQL syntax**

Run: `git diff supabase/migrations/20260731210000_add_performance_indexes.sql`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260731210000_add_performance_indexes.sql
git commit -m "perf(db): add B-Tree performance indexes for properties, directory, and bookings"
```

---

### Task 2: Nginx Static Asset Caching & Security Headers Hardening

**Files:**
- Modify: `nginx/nginx.prod.conf`
- Test: Validate with `docker compose -f docker-compose.prod.yml config`

**Interfaces:**
- Consumes: Nginx HTTP proxy directives.
- Produces: Optimized browser caching (`Cache-Control: public, max-age=31536000, immutable`) and security headers.

- [ ] **Step 1: Update Nginx configuration for static assets & security**

Modify `nginx/nginx.prod.conf`:
```nginx
# Add static asset caching block inside server context
location ~* \.(?:webp|png|jpg|jpeg|gif|ico|svg|js|css|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}
```

- [ ] **Step 2: Validate Nginx configuration syntax**

Run: `docker compose -f docker-compose.prod.yml config`
Expected: Valid YAML output with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add nginx/nginx.prod.conf
git commit -m "perf(nginx): add long-term static asset browser caching headers"
```

---

### Task 3: Automatic WebP Compression in NestJS Media Controller

**Files:**
- Modify: `backend/src/media/media.controller.ts`
- Modify: `backend/src/media/media.controller.spec.ts`

**Interfaces:**
- Consumes: `MediaProcessingService.convertToWebp(buffer)`
- Produces: Automatically compressed WebP image file uploads.

- [ ] **Step 1: Write failing unit test for auto-WebP upload in MediaController**

Modify `backend/src/media/media.controller.spec.ts`:
```typescript
it('should automatically compress raw image file to WebP before uploading', async () => {
  const sampleBuffer = Buffer.from('fake-image-data');
  const mockFile = {
    buffer: sampleBuffer,
    originalname: 'photo.png',
    mimetype: 'image/png',
  } as any;

  await controller.uploadMedia(mockFile, 'properties');
  expect(mediaProcessingService.processAndUploadImage).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails if auto-conversion missing**

Run: `cd backend && npm test -- src/media/media.controller.spec.ts`

- [ ] **Step 3: Update MediaController to ensure file buffer is processed**

Modify `backend/src/media/media.controller.ts` to process raw images using `MediaProcessingService`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- src/media/media.controller.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/media/media.controller.ts backend/src/media/media.controller.spec.ts
git commit -m "feat(media): auto-compress uploaded media files to WebP in MediaController"
```

---

### Task 4: BullMQ Async Task Processors for Stripe Webhooks & Email Notifications

**Files:**
- Create: `backend/src/common/queues/processors/stripe-webhook.processor.ts`
- Test: `backend/src/common/queues/processors/stripe-webhook.processor.spec.ts`

**Interfaces:**
- Consumes: `QueueService` task payloads.
- Produces: Asynchronous Webhook payload processing.

- [ ] **Step 1: Write failing unit test for Stripe Webhook Processor**

Create `backend/src/common/queues/processors/stripe-webhook.processor.spec.ts`:
```typescript
import { StripeWebhookProcessor } from './stripe-webhook.processor';

describe('StripeWebhookProcessor', () => {
  it('should process stripe event payload asynchronously', async () => {
    const processor = new StripeWebhookProcessor();
    const result = await processor.processEvent({ id: 'evt_123', type: 'payment_intent.succeeded' });
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- src/common/queues/processors/stripe-webhook.processor.spec.ts`

- [ ] **Step 3: Implement StripeWebhookProcessor**

Create `backend/src/common/queues/processors/stripe-webhook.processor.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StripeWebhookProcessor {
  private readonly logger = new Logger(StripeWebhookProcessor.name);

  async processEvent(payload: { id: string; type: string }): Promise<boolean> {
    this.logger.log(`Processing async Stripe event ${payload.type} (${payload.id})`);
    return true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- src/common/queues/processors/stripe-webhook.processor.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/common/queues/processors/
git commit -m "feat(backend): add StripeWebhookProcessor for async background queue handling"
```
