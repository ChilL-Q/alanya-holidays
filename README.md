# Alanya Holidays 🌴

Alanya Holidays is a frontend-led travel and community platform for Alanya, Turkey. The current
release focuses on discovery, community, commerce, trip planning, curated luxury catalogues, and
concierge enquiries. Backend modules for future booking and payment updates remain scaffolded.

## Current architecture

This repository is a **pnpm monorepo** with three main parts:

- `frontend/` — React 19 + Vite + TypeScript
- `backend/` — NestJS + TypeScript
- `shared/` — shared types and cross-package utilities

Supporting infrastructure:

- `supabase/` — database migrations, policies, functions, local Supabase config
- `nginx/` — reverse proxy configuration
- `docker-compose.yml` — local/dev containers
- `docker-compose.prod.yml` — production container stack
- `docs/` — infrastructure and engineering docs

## Current release features

- Curated stays and luxury catalogues with enquiry confirmation
- Community forum, members, blog, and events
- Merchant / business listing management
- Admin moderation and analytics hub
- AI local guide and itinerary generation
- Gift-shop cart and checkout

Direct guest accommodation booking and its Stripe payment flow are intentionally dormant and must
not be presented as launched functionality. The backend keeps the relevant building blocks for a
future release.

## Tech stack

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS
- Vitest + Playwright

### Backend
- NestJS
- TypeScript
- Supabase JS client
- Stripe
- Redis
- Jest

### Infrastructure
- Supabase / PostgreSQL
- Docker Compose
- Nginx
- GitHub Actions CI/CD

## Prerequisites

Recommended local toolchain:

- Node.js 22+
- `pnpm` (repo uses `pnpm@11`)
- Docker + Docker Compose
- Supabase CLI (for local database / edge-function workflows)

## Install

From the repository root:

```bash
pnpm install
```

## Workspace scripts

Run from the repository root:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm type-check
pnpm test
```

These commands are orchestrated through Turborepo.

## Local development

### Option 1 — app packages directly

Run frontend and backend in parallel:

```bash
pnpm dev
```

Typical package-level commands:

```bash
pnpm --filter @alanya-holidays/frontend dev
pnpm --filter @alanya-holidays/backend dev
```

### Option 2 — Docker Compose

Start the local stack:

```bash
docker compose up --build
```

Use this when you want the reverse proxy / Redis / multi-container flow.

## Environment configuration

Environment files are **not committed**.
Use the provided examples as templates:

- `.env.example`
- `.env.test.example`

At minimum, the app commonly expects configuration for:

- Supabase URL / keys
- Stripe keys / webhook secret
- Redis connection settings
- App/base URLs
- Sentry DSN (optional)
- CORS allowed origins

## Tests and validation

### Monorepo

```bash
pnpm type-check
pnpm lint
pnpm test
```

### Backend only

```bash
pnpm --filter @alanya-holidays/backend test
pnpm --filter @alanya-holidays/backend type-check
pnpm --filter @alanya-holidays/backend lint
```

### Frontend only

```bash
pnpm --filter @alanya-holidays/frontend test
pnpm --filter @alanya-holidays/frontend test:e2e
pnpm --filter @alanya-holidays/frontend type-check
pnpm --filter @alanya-holidays/frontend lint
```

## Supabase workflows

Examples:

```bash
pnpm --filter @alanya-holidays/frontend supabase:start
pnpm --filter @alanya-holidays/frontend supabase:reset
pnpm --filter @alanya-holidays/frontend types:generate
```

Database changes live in:

- `supabase/migrations/`

## Health and runtime

Backend health endpoint:

```text
GET /api/health
```

It checks both:

- database connectivity
- Redis connectivity

## Project docs

Useful docs in this repo:

- `PROJECT.md` — feature/milestone snapshot
- `CONTEXT.md` — domain model / ubiquitous language
- `TEST_INFRA.md` — testing strategy and coverage model
- `docs/INFRASTRUCTURE.md` — VPS / Docker / operational notes
- `docs/MAINTENANCE_STRATEGY.md` — engineering and maintenance strategy
- `docs/adr/` — architecture decision records
- `CONTEXT.md` "Known Gaps" section — tracked, prioritized gaps

## CI/CD

GitHub Actions currently handle:

- lint
- type-check
- backend/frontend tests
- build
- smoke E2E
- production deployment workflow

## Notes

- Booking creation is now authenticated on the backend; clients should rely on the active auth session rather than passing a user id manually.
- Stripe webhook handling depends on raw request body support and valid Stripe env configuration.
- Production deployment uses `docker-compose.prod.yml` and Nginx as the public entrypoint.
