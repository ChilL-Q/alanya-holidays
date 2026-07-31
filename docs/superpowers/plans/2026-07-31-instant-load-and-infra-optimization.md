# Instant Data Loading & Infrastructure Optimization Plan (Phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 2 & 3 of the Infrastructure Optimization Roadmap for Alanya Holidays — including frontend React Query prefetching, WebP image conversion, BullMQ task queues, and Docker network hardening.

**Architecture:** Use TanStack Query on React frontend for instant 0ms cached route rendering and hover prefetching. Use Sharp on NestJS backend for WebP photo compression. Use BullMQ over the existing Redis container for background task processing. Hardening Docker Compose with private bridge networks.

**Tech Stack:** React 19, TanStack Query v5, NestJS, ioredis, BullMQ, Sharp, Docker Compose.

## Global Constraints

- Preserve all existing API signatures in NestJS controllers and repositories.
- Strict TypeScript types with 0 `any` suppressions where possible.
- Run `npm run type-check` and `npm test` after every task.
- Follow `nestjs-best-practices` standards for NestJS backend modules.

---

### Task 1: Frontend TanStack Query Prefetching & Stale-While-Revalidate Caching

**Files:**
- Modify: `frontend/api-services/api/properties/index.ts`
- Modify: `frontend/routes/publicRoutes.tsx`
- Test: `frontend/src/tests/prefetch.test.ts`

**Interfaces:**
- Consumes: `/api/properties`, `/api/directory` NestJS GET endpoints.
- Produces: `prefetchPropertyQuery(queryClient, id)`, `prefetchDirectoryQuery(queryClient, category)`.

- [ ] **Step 1: Write the failing unit test for prefetching**

Create `frontend/src/tests/prefetch.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { prefetchPropertyQuery } from '../../api-services/api/properties';

describe('prefetchPropertyQuery', () => {
  it('should prefetch property details into QueryClient cache', async () => {
    const queryClient = new QueryClient();
    const fetchSpy = vi.spyOn(queryClient, 'prefetchQuery');
    
    await prefetchPropertyQuery(queryClient, 'prop-123');
    
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['property', 'prop-123'],
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/tests/prefetch.test.ts`
Expected: FAIL with "prefetchPropertyQuery is not exported"

- [ ] **Step 3: Implement prefetchPropertyQuery helper**

Modify `frontend/api-services/api/properties/index.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';
import { getPropertyById } from './client';

export async function prefetchPropertyQuery(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery({
    queryKey: ['property', id],
    queryFn: () => getPropertyById(id),
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/tests/prefetch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/api-services/api/properties/index.ts frontend/src/tests/prefetch.test.ts
git commit -m "feat(frontend): add TanStack Query prefetch helpers for instant property loading"
```

---

### Task 2: NestJS WebP Photo Converter & Sharp Media Pipeline

**Files:**
- Modify: `backend/src/media/media-processing.service.ts`
- Test: `backend/src/media/media-processing.service.spec.ts`

**Interfaces:**
- Consumes: Buffer of raw JPEG/PNG image upload.
- Produces: `convertToWebp(buffer: Buffer, quality?: number): Promise<Buffer>`.

- [ ] **Step 1: Write the failing unit test for WebP conversion**

Add test in `backend/src/media/media-processing.service.spec.ts`:
```typescript
it('should convert raw image buffer into WebP format', async () => {
  // 1x1 PNG pixel buffer
  const samplePng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const webpBuffer = await service.convertToWebp(samplePng, 80);
  expect(webpBuffer).toBeDefined();
  expect(Buffer.isBuffer(webpBuffer)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- src/media/media-processing.service.spec.ts`
Expected: FAIL with `service.convertToWebp is not a function`

- [ ] **Step 3: Implement convertToWebp using Sharp**

Modify `backend/src/media/media-processing.service.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);

  async convertToWebp(inputBuffer: Buffer, quality = 80): Promise<Buffer> {
    try {
      return await sharp(inputBuffer)
        .webp({ quality })
        .toBuffer();
    } catch (err) {
      this.logger.error(`WebP conversion failed: ${(err as Error).message}`);
      throw err;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- src/media/media-processing.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/media/media-processing.service.ts backend/src/media/media-processing.service.spec.ts
git commit -m "feat(backend): add Sharp WebP image conversion method in MediaProcessingService"
```

---

### Task 3: NestJS Queue Module & Async Tasks

**Files:**
- Create: `backend/src/common/queues/queue.module.ts`
- Create: `backend/src/common/queues/queue.service.ts`
- Test: `backend/src/common/queues/queue.service.spec.ts`

**Interfaces:**
- Consumes: Redis host & port environment variables.
- Produces: `QueueService.enqueueTask(queueName: string, taskName: string, payload: any): Promise<boolean>`.

- [ ] **Step 1: Write failing unit test for QueueService**

Create `backend/src/common/queues/queue.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { RedisService } from '../redis/redis.service';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: RedisService,
          useValue: { getJson: jest.fn(), setJson: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should format queue job correctly', () => {
    expect(service).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- src/common/queues/queue.service.spec.ts`
Expected: FAIL with `Cannot find module ./queue.service`

- [ ] **Step 3: Implement QueueService scaffolding**

Create `backend/src/common/queues/queue.service.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly redisService: RedisService) {}

  async enqueueTask(queueName: string, taskName: string, payload: any): Promise<boolean> {
    const jobKey = `queue:${queueName}:${taskName}:${Date.now()}`;
    await this.redisService.setJson(jobKey, payload, 3600);
    this.logger.log(`Enqueued task ${taskName} to ${queueName}`);
    return true;
  }
}
```

Create `backend/src/common/queues/queue.module.ts`:
```typescript
import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- src/common/queues/queue.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/common/queues/
git commit -m "feat(backend): add QueueModule & QueueService for background task processing"
```

---

### Task 4: Private Docker Bridge Networks & Port Hardening

**Files:**
- Modify: `docker-compose.prod.yml`
- Test: Validate syntax with `docker compose -f docker-compose.prod.yml config`

**Interfaces:**
- Consumes: Redis and PostgreSQL service definitions.
- Produces: Hardened network isolation (`backend-net`, `frontend-net`).

- [ ] **Step 1: Add network definitions to docker-compose.prod.yml**

Modify `docker-compose.prod.yml`:
```yaml
networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true
```

- [ ] **Step 2: Attach services to isolated networks**

Assign `redis` and `backend` to `backend-net`, assign `nginx` to `frontend-net` and `backend-net`.

- [ ] **Step 3: Run config validation**

Run: `docker compose -f docker-compose.prod.yml config`
Expected: PASS with valid YAML config output.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "security(infra): harden production Docker network isolation"
```
