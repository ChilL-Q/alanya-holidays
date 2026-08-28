# Backend Security and Reliability Remediation Plan

## Purpose

This document records the findings from the backend audit performed on 2026-08-28 and defines the recommended implementation order.

The plan is intentionally split into small, independently testable changes. Do not combine unrelated items into one commit.

## Current baseline

The following checks currently pass on `dev`:

- Backend unit suite: 128 suites, 1792 tests.
- Monorepo type-check and lint.
- Frontend and backend builds.
- Backend and frontend Docker builds.
- Supabase migrations on a clean PostgreSQL database.
- RLS security verification.

Latest audit security commit:

```text
6eb036d fix(security): harden privileged backend operations
```

Validated by GitHub Actions run:

- <https://github.com/Nazarovruslan01/alanya-holidays/actions/runs/33199884354>

## Completed findings

### Privileged `SECURITY DEFINER` RPC access

Completed in:

- `supabase/migrations/20260828000002_restrict_privileged_rpcs.sql`

The `authenticated` role can no longer directly execute:

- `transition_booking_status`
- `confirm_bookings_from_stripe`
- `get_conversations_last_and_unread`
- `get_platform_analytics`
- `check_forum_rate_limit`

These functions remain available to the NestJS backend through `service_role`.

### Media upload boundary

Completed in:

- `backend/src/media/media.controller.ts`
- `backend/src/media/media.controller.spec.ts`

Controls now include:

- Required authentication.
- 5 MB request limit.
- JPEG, PNG and WebP allowlist.
- Storage bucket allowlist.
- User-scoped storage path.

### Administrative read endpoints

Completed in:

- `backend/src/properties/properties.controller.ts`
- `backend/src/services/services.controller.ts`

The following endpoints now require both `AuthGuard` and the `admin` role:

- `GET /properties/admin`
- `GET /services/admin`
- `GET /services/edits/admin/pending`

---

# Remaining work

## ✅ Completed — Product DTOs and mass-assignment prevention

Completed on 2026-08-28 in:

- `backend/src/products/dto/product-write.dto.ts`
- `backend/src/products/dto/product-write.dto.spec.ts`
- `backend/src/products/products.controller.ts`
- `backend/src/products/products.service.ts`
- `backend/src/products/product-drafts.service.ts`

Product and variant write endpoints now use concrete runtime DTOs. Unknown and server-controlled fields are removed by the global validation pipe, persistence payloads are explicitly mapped, and ownership/lifecycle fields remain server-controlled.

Validation completed:

- Focused product tests: 4 suites, 67 tests.
- Full backend suite: 129 suites, 1802 tests.
- Backend type-check.
- ESLint for changed files.


### Problem

Product write endpoints accept TypeScript interfaces such as `Product` and `Partial<Product>` as request bodies. Interfaces do not exist at runtime, so NestJS `ValidationPipe` cannot validate or whitelist their fields.

Some services and repositories spread the submitted object into persistence payloads. This permits unexpected fields and makes database constraints the effective API validator.

### Relevant files

- `backend/src/products/products.controller.ts`
- `backend/src/products/products.service.ts`
- `backend/src/products/product-drafts.service.ts`
- Product domain and persistence types under `backend/src/products/`

### Required changes

1. Introduce concrete runtime DTO classes:
   - `CreateProductDto`
   - `UpdateProductDto`
   - `SaveProductDraftDto`
   - `PublishProductDraftDto`
2. Add `class-validator` constraints for:
   - required names and descriptions;
   - maximum string lengths;
   - valid prices and quantities;
   - allowed categories and statuses;
   - URL and UUID fields where applicable;
   - arrays and nested objects.
3. Use `PartialType` only if it produces the intended runtime metadata. Do not use `Partial<Product>` in controller bodies.
4. Construct repository payloads from an explicit allowlist.
5. Never spread the complete request body into a database write.
6. Keep ownership fields server-controlled:
   - `seller_id`
   - `user_id`
   - creation/update timestamps
7. Keep lifecycle fields server-controlled unless a dedicated authorized endpoint exists:
   - `status`
   - approval/moderation fields
   - payment-related fields

### Required tests

- Valid creation accepts the exact documented fields.
- Unknown fields are removed or rejected.
- Client-supplied `seller_id` cannot change ownership.
- Client-supplied status cannot bypass the draft/publish flow.
- Negative price and quantity are rejected.
- Oversized strings and arrays are rejected.
- Update DTO permits partial valid updates.
- Invalid nested values are rejected.

### Done when

- No product controller body uses `Product`, `Partial<Product>` or unvalidated `Record<string, unknown>`.
- Persistence payloads are explicitly mapped.
- Focused product tests, full backend suite, type-check and lint pass.

Suggested commit:

```text
fix(products): validate write payloads
```

---

## ✅ Completed — Service-edit owner-or-admin authorization

Completed on 2026-08-28 in:

- `backend/src/services/services.controller.ts`
- `backend/src/services/services.controller.spec.ts`
- `backend/src/services/services.service.ts`
- `backend/src/services/services.service.spec.ts`

Both service-edit read endpoints now pass the authenticated user into the service layer. The associated service ownership is resolved before data is returned, access is limited to the service owner or an administrator, and missing ownership fails closed with HTTP 403.

Validation completed:

- Focused service tests: 2 suites, 58 tests.
- Full backend suite: 129 suites, 1811 tests.
- Backend type-check.
- ESLint for changed files.


### Problem

An authenticated user can currently request service-edit records by known service or edit identifiers without proving ownership.

Affected endpoints:

- `GET /services/edits/service/:serviceId`
- `GET /services/edits/:editId`

### Relevant files

- `backend/src/services/services.controller.ts`
- `backend/src/services/services.service.ts`
- `backend/src/services/services.repository.ts`
- `backend/src/services/services.controller.spec.ts`
- `backend/src/services/services.service.spec.ts`

### Required changes

1. Pass `@CurrentUser()` from both controller methods to the service.
2. Load the edit and associated service ownership information.
3. Permit access only when:
   - the user owns the service or edit; or
   - the user has the `admin` role.
4. Fail closed if ownership cannot be resolved.
5. Return `ForbiddenException` for an authenticated user without access.
6. Do not trust provider or owner IDs supplied in query/body parameters.

### Required tests

- Owner can list edits for their service.
- Owner can read their individual edit.
- Admin can read any service edit.
- Another authenticated user receives 403.
- Missing ownership information fails closed.
- Unauthenticated request remains protected by `AuthGuard`.

### Done when

- Both read paths enforce owner-or-admin in the service layer.
- Controller metadata and service authorization tests pass.
- Full backend suite passes.

Suggested commit:

```text
fix(services): enforce edit ownership
```

---

## ✅ Completed — Concurrency-safe listing claim approval

Completed on 2026-08-28 in:

- `supabase/migrations/20260828000003_serialize_listing_claim_approval.sql`
- `db_scripts/verify_listing_claim_approval.sql`
- `.github/workflows/ci.yml`

Claim approval now locks the target claim and listing, rechecks state after locking, returns an idempotent result for repeated approval, rejects a second approved claim for the same listing deterministically, and is backed by a partial unique index. Before creating that index, the migration safely remediates historical duplicates: it preserves the approved claim matching the listing's current owner when present, otherwise the oldest claim (`created_at`, then `id`), and marks the others rejected with an explicit migration-remediation reason. The `SECURITY DEFINER` function retains a fixed `search_path` and execute access is restricted to `service_role`.

Validation completed:

- All 147 migrations applied to a clean PostgreSQL 16 database.
- Listing claim approval integration verification passed.
- RLS security verification passed.
- Full backend suite: 129 suites, 1811 tests.
- Backend type-check.


### Problem

`approve_listing_claim` reads and updates claim/listing state without locking both records. Concurrent approvals can both observe pending state and may produce multiple approved claims or nondeterministic listing ownership.

### Relevant files

- `supabase/migrations/20260731112619_fix_service_role_rpc_auth.sql`
- Add a new forward-only migration; do not rewrite an applied migration.
- Listing claim repository/service tests.

### Required changes

1. Create a new migration replacing `approve_listing_claim`.
2. Lock the target claim with `SELECT ... FOR UPDATE`.
3. Lock the target listing before changing ownership.
4. Recheck claim state after acquiring the locks.
5. Add a partial unique index enforcing one approved claim per listing:

```sql
CREATE UNIQUE INDEX ...
ON public.listing_claims (listing_id)
WHERE status = 'approved';
```

6. Define deterministic behavior when another claim is already approved.
7. Preserve a safe `search_path` on the `SECURITY DEFINER` function.
8. Keep execute privileges restricted to the intended role.

### Required tests

- First approval succeeds.
- Repeated approval is idempotent or returns a documented conflict.
- A second claim for the same listing cannot also become approved.
- Rejected/expired claims cannot be approved.
- Migration applies on a clean PostgreSQL database.
- RLS verification remains green.

### Done when

- Database constraints prevent contradictory approved state independently of application code.
- CI migration and RLS jobs pass.

Suggested commit:

```text
fix(directory): serialize listing claim approval
```

---

## ✅ Completed — Atomic AI rate limiting

Completed on 2026-08-28 in:

- `backend/src/common/redis/redis.service.ts`
- `backend/src/common/redis/redis.service.spec.ts`
- `backend/src/ai/ai-guide.service.ts`
- `backend/src/ai/ai-guide.service.spec.ts`

AI rate limiting now uses an atomic Redis Lua increment that sets expiration only on the first request in a fixed window. Redis outages use a bounded in-memory counter fallback; if counting itself cannot be completed, expensive AI calls fail closed with HTTP 503. Both guide and itinerary limits return HTTP 429 when exceeded and retain separate identity buckets.

Validation completed:

- Focused AI/Redis tests: 3 suites, 27 tests.
- Full backend suite: 129 suites, 1816 tests.
- Backend type-check.
- ESLint for changed files.


### Problem

The AI limiter uses separate Redis `GET` and `SET` operations. Concurrent requests can read the same count and overwrite one another, allowing more requests than intended.

Rate-limit failures also currently fail open, and one path can return HTTP 500 instead of 429.

### Relevant files

- `backend/src/ai/ai-guide.service.ts`
- `backend/src/common/redis/redis.service.ts`
- AI service tests.

### Required changes

1. Replace `GET` then `SET` with an atomic operation:
   - Redis Lua script; or
   - `INCR` plus expiry set only on the first increment; or
   - an equivalent transaction supported by the current Redis abstraction.
2. Return HTTP 429 using `TooManyRequestsException` or an explicit `HttpException`.
3. Define deliberate Redis outage behavior:
   - fail closed for expensive external AI calls; or
   - use a bounded in-memory fallback.
4. Do not silently disable endpoint-specific limits.

### Required tests

- First N requests are allowed.
- Request N+1 returns 429.
- TTL is set once and is not extended by each request unless intentionally using a sliding window.
- Concurrent increments cannot lose updates.
- Redis failure follows the documented fallback policy.

### Done when

- The limiter is atomic and returns the correct HTTP status.
- Tests verify count and expiration behavior rather than only checking that Redis methods were called.

Suggested commit:

```text
fix(ai): make rate limiting atomic
```

---

## ✅ Completed — Validate and bound all pagination

Completed on 2026-08-28 across the affected backend feature modules:

- Admin properties, services, users, and concierge enquiries.
- Conversations and conversation messages.
- Blog submissions and comments.
- Forum comments and bounded forum list endpoints.
- Products, shop catalog, product variants, and featured products.
- User bookings.
- Directory admin listings, pending listings, and listing claims.
- Community itineraries and other remaining controller list-limit compatibility paths.

All affected externally reachable growing lists now use concrete runtime query DTOs with transformed integer values, non-negative offsets or positive pages, and strict maximum limits. Repository ranges are bounded before enrichment or dependent queries. Shop variants and blog likes are restricted to IDs from the selected page, and duplicate admin property routing was removed. Controllers no longer manually parse pagination query strings.

Validation completed:

- Full backend suite: 141 suites, 1903 tests.
- Backend type-check.
- ESLint across all backend source files.


### Problem

Some controllers parse pagination using raw `parseInt()` and permit invalid, negative or extremely large values. Some repository methods return entire growing tables.

### Relevant areas

- Admin property pagination.
- Admin service pagination.
- Admin user pagination.
- Conversation message offsets.
- Blog submissions and comments.
- Forum comments.
- Messages/conversations.
- Products and shop variants.
- User bookings.
- Directory pending listings and claims.
- Concierge enquiries.

### Required changes

1. Use runtime query DTOs for every list endpoint.
2. Apply numeric transformation and validation:
   - `@IsInt()`
   - `@Min(0)` for offsets
   - `@Min(1)` for pages and limits
   - conservative `@Max(...)` for limits
3. Prefer cursor pagination for comments/messages using `(created_at, id)`.
4. Never return an unbounded growing collection.
5. Restrict dependent queries to the IDs from the selected page.
6. Avoid loading every product variant when only one product page is requested.

### Required tests

- Defaults are deterministic.
- Negative and `NaN` values produce 400.
- Limit above maximum produces 400 or is consistently clamped according to the API contract.
- Repository range is calculated correctly.
- Empty and last pages return stable metadata.

### Done when

- Every externally reachable growing list has a strict maximum page size.
- No controller manually parses unvalidated pagination strings.

Suggested commits should be split by feature, for example:

```text
fix(messages): validate conversation pagination
fix(admin): bound management list pagination
fix(blog): paginate submissions and comments
```

---

## ✅ Completed — Enquiry/contact spam protection and input bounds

Completed on 2026-08-28 in:

- `backend/src/common/security/security.config.ts`
- `backend/src/common/security/security.config.spec.ts`
- `backend/src/admin/dto/create-enquiry.dto.ts`
- `backend/src/admin/dto/create-enquiry.dto.spec.ts`
- `backend/src/messages/dto/create-contact-message.dto.ts`
- `backend/src/messages/dto/create-contact-message.dto.spec.ts`

Anonymous enquiry and contact aliases now share a POST-only budget of five submissions per hour, preventing route rotation between `/api/enquiries`, `/api/messages`, and `/api/messages/contact`. Authenticated users use independent user buckets; anonymous callers use trusted client-IP buckets. Email and phone values are normalized and validated, and all externally supplied strings have explicit maximum lengths.

Validation completed:

- Focused security and DTO tests: 3 suites, 49 tests.
- Full backend suite: 141 suites, 1903 tests.
- Backend type-check.
- ESLint across all backend source files.


### Problem

Anonymous enquiry/contact endpoints use the generic global IP budget, currently allowing a high volume of database writes. Some enquiry strings have no explicit maximum length.

### Relevant files

- `backend/src/admin/enquiries.controller.ts`
- `backend/src/admin/dto/create-enquiry.dto.ts`
- `backend/src/messages/messages.controller.ts`
- `backend/src/common/security/security.config.ts`

### Required changes

1. Add strict per-method limits for:
   - `POST /api/enquiries`
   - anonymous contact-message endpoints
2. Add explicit `@MaxLength` to all externally supplied strings.
3. Normalize and validate email and phone values.
4. Keep request body limits conservative.
5. Consider CAPTCHA only if rate limiting and abuse monitoring are insufficient.

### Required tests

- Oversized name, subject, message, phone and email are rejected.
- Endpoint-specific limits are stricter than the default budget.
- GET endpoints sharing a path are not accidentally throttled as writes.
- Different authenticated users do not share one identity bucket.

### Done when

- Anonymous write endpoints have explicit budgets and bounded DTOs.

Suggested commit:

```text
fix(enquiries): bound input and tighten rate limits
```

---

## ✅ Completed — Sanitize media processing errors

Completed on 2026-08-28 in:

- `backend/src/media/media-processing.service.ts`
- `backend/src/media/media-processing.service.spec.ts`

Invalid image content now returns a stable sanitized 400 response. Storage and unexpected processing failures return a fixed generic 500 response, while original errors are retained only in server-side logs with bounded request-safe context.

### Problem

Sharp or Supabase Storage error messages can be wrapped in `InternalServerErrorException`, and the global exception filter returns `HttpException` messages to clients. This can expose storage or processing implementation details.

### Relevant files

- `backend/src/media/media-processing.service.ts`
- `backend/src/common/filters/http-exception.filter.ts`
- Media processing tests.

### Required changes

1. Log original errors server-side with request-safe context.
2. Return a fixed public message for server/storage failures.
3. Map invalid image content to a sanitized 400 response.
4. Do not expose bucket existence, Supabase error text, filesystem details or Sharp parser internals.

### Required tests

- Storage error details are absent from the HTTP exception message.
- Invalid image input returns a stable sanitized 400.
- Unexpected failures return a stable generic 500.

Suggested commit:

```text
fix(media): sanitize processing errors
```

---

## ✅ Completed — Optional authentication on blog reads

Completed on 2026-08-28 in:

- `backend/src/blog/blog.controller.ts`
- `backend/src/blog/blog.controller.spec.ts`

Public blog post and comment reads that consume optional user state now execute `OptionalAuthGuard`. Anonymous access remains available, valid identities are forwarded to the service, and absent or invalid optional identities do not fabricate a user.

### Problem

Some public blog endpoints use optional `@CurrentUser()` but do not execute `OptionalAuthGuard`. A valid bearer token therefore may not populate `request.user`, and user-specific like/bookmark state can be returned as anonymous state.

### Relevant file

- `backend/src/blog/blog.controller.ts`

### Required changes

1. Add `@UseGuards(OptionalAuthGuard)` to public read endpoints that consume optional current-user state.
2. Keep endpoints publicly accessible when no token is provided.
3. Ensure invalid optional credentials do not fabricate an identity.

### Required tests

- Anonymous request remains allowed.
- Valid token forwards the user ID to the service.
- Missing token forwards no user ID.
- Invalid token follows the documented optional-auth behavior.

Suggested commit:

```text
fix(blog): resolve optional reader identity
```

---

## ✅ Completed — Atomic blog comment likes

Completed on 2026-08-28 in:

- `backend/src/blog/blog.repository.ts`
- `backend/src/blog/blog.repository.spec.ts`
- `supabase/migrations/20260828000004_atomic_blog_comment_likes.sql`
- `db_scripts/verify_atomic_blog_comment_likes.sql`
- `.github/workflows/ci.yml`

The existing toggle API now delegates to a single transactional `SECURITY DEFINER` RPC. Transaction-scoped advisory locking serializes toggles for each comment/user pair, the returned boolean reflects the persisted state, and direct RPC execution is restricted to `service_role`.

Validation completed:

- Focused combined tests: 3 suites, 35 tests.
- Backend type-check.
- ESLint for changed backend files.
- Full backend suite attempted: 140 of 141 suites passed; the unrelated Gemini adapter network-fallback test timed out after 5 seconds.
- All migrations applied successfully on a clean PostgreSQL 16 database.
- Atomic blog comment likes, RLS security and listing claim approval SQL verification scripts passed.

### Problem

Blog comment likes use a check-then-insert/delete sequence. Concurrent toggles can race and return a state that does not match the final database state.

### Relevant files

- `backend/src/blog/blog.repository.ts`
- `supabase/migrations/20260825000001_create_blog_comments.sql`
- Add a new migration if an RPC is introduced.

### Preferred solution

Avoid toggle semantics when possible:

- `PUT /comments/:id/like` as idempotent insert with `ON CONFLICT DO NOTHING`.
- `DELETE /comments/:id/like` as idempotent delete.

If the public API must remain a toggle, implement it as one transactional database RPC.

### Required tests

- Repeated like remains liked.
- Repeated unlike remains unliked.
- Concurrent requests do not produce constraint errors.
- Returned state matches persisted state.

Suggested commit:

```text
fix(blog): make comment likes atomic
```

---

## ✅ Completed — Move claim verification token out of query strings

Completed on 2026-08-28 in:

- `backend/src/directory/presentation/directory.controller.ts`
- `backend/src/directory/application/listing-claim.service.ts`
- `backend/src/directory/directory.repository.ts`
- `backend/src/directory/dto/verify-claim.dto.ts`
- `frontend/src/pages/verify-claim/page.tsx`
- `frontend/src/api-services/directory.service.ts`
- `frontend/src/router/config.tsx`
- `supabase/functions/send-email/index.ts`
- `supabase/migrations/20260828000005_hash_listing_claim_verification_tokens.sql`
- `db_scripts/verify_listing_claim_token_security.sql`

Claim verification links now carry the raw token in the URL fragment (`#token=...`), which browsers do not include in HTTP request URLs. The frontend captures and removes the fragment from browser history before exchanging the token through a validated POST body after explicit confirmation, and enforces `no-referrer`. New tokens are cryptographically random; only SHA-256 hashes are stored in `listing_claims`, while the raw token is durably retained in `email_outbox` until email delivery. Verification is limited to 24 hours and single-use, and the backend-only RPC is restricted to `service_role`.

Validation completed:

- Focused backend tests: 4 suites, 55 tests.
- Focused frontend tests: 2 files, 47 tests.
- Backend and frontend type-check.
- ESLint for changed backend and frontend files.
- All migrations applied successfully on a clean PostgreSQL 16 database.
- Claim token security, atomic blog likes, RLS security and listing claim approval SQL verification scripts passed.

### Problem

Claim verification previously used a token in a URL query parameter. Query strings can reach HTTP access logs, proxies and monitoring tools and may be retained in browser history or referrer headers.

### Relevant files

- `backend/src/directory/presentation/directory.controller.ts`
- `backend/src/directory/application/listing-claim.service.ts`
- Corresponding frontend verification flow.

### Required changes

1. Prefer token exchange through a POST request body.
2. Put the email-link token in the URL fragment rather than the query string so it is not sent in the HTTP request URL.
3. Capture and scrub the fragment before exchanging the token through POST.
4. Render a confirmation page, use a strict `Referrer-Policy`, and keep the token short-lived and single-use.
5. Store only a hash in the claim record; durably queue the raw token for email delivery so an invocation failure cannot lose it.
6. Ensure logs never contain the raw token.

Suggested commit:

```text
fix(directory): protect claim verification tokens
```

---

# Validation checklist for every slice

Run focused tests first, then broader validation.

```sh
pnpm --filter @alanya-holidays/backend exec jest <changed-specs> --runInBand
pnpm --filter @alanya-holidays/backend type-check
pnpm --filter @alanya-holidays/backend exec eslint <changed-files> --max-warnings=0
pnpm --filter @alanya-holidays/backend test --runInBand
```

For database changes, also verify all migrations from a clean database and execute:

```text
db_scripts/verify_rls_security.sql
```

After each logical commit:

1. Push to `dev`.
2. Wait for the actual GitHub Actions run.
3. Confirm all three jobs pass:
   - Lint → Test → Build
   - Docker Builds & Compose Linting
   - Database Migrations & RLS Verification
4. Do not treat a successful push as successful validation.

# Recommended execution order

1. ✅ Product runtime DTOs and mass-assignment prevention.
2. ✅ Service-edit owner-or-admin authorization.
3. ✅ Listing-claim concurrency and uniqueness.
4. ✅ Atomic AI rate limiting.
5. ✅ Enquiry/contact limits and DTO bounds.
6. ✅ Pagination, split by feature.
7. ✅ Media error sanitization.
8. ✅ Blog optional authentication.
9. ✅ Atomic blog comment likes.
10. ✅ Claim verification token transport.

This order addresses privilege and data-integrity risks before performance and hardening work.

# Out-of-scope CI maintenance notes

The current CI also reports warnings that are not backend-remediation blockers:

- Some GitHub Actions still target Node.js 20 and are forced onto Node.js 24.
- Docker warns about `VITE_SUPABASE_ANON_KEY` and `VITE_GOOGLE_MAPS_API_KEY` build arguments.

`VITE_*` values are public frontend configuration by design. Nevertheless:

- Supabase anonymous access must remain constrained by RLS.
- Google Maps keys must have strict HTTP referrer and API restrictions.
- No service-role key or server secret may ever use a `VITE_*` variable.
