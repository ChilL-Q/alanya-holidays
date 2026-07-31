# Stack Best-Practices Improvement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the concrete best-practice gaps found in the 2026-07-30 audit: server-side input validation, DB `search_path` hardening, service-role RPC auth, blog import cycles, god-file splits, and quality hygiene.

**Architecture:** Three independent phases, each on its own branch off `main` and shipped as a separate PR. Within a phase, cheap/low-risk tasks land before large ones. Every task is TDD where a behavior exists to test; mechanical refactors are guarded by type-check + existing suites.

**Tech Stack:** NestJS (backend), `class-validator`/`class-transformer` (new), Supabase/Postgres migrations, React 19 + Vite (frontend), Vitest + Jest, `madge` for cycle detection.

## Global Constraints

- Migrations are **append-only**; each has a purpose comment; test with `supabase db reset` before push.
- Backend: `console.warn`/`console.error` only, never `console.log`.
- CI acceptance per phase: `npm run lint`, `npm run type-check`, `npm run test -- --run`, `npm run build` all green, 0 new warnings.
- Branch naming: `fix/…`, `refactor/…`, `chore/…`; PRs target `main`; never push to `main`.
- No `Co-Authored-By` / "Generated with Claude Code" in commits or PRs.
- `SECURITY DEFINER` functions must `SET search_path = public`.
- Spec kept local (not committed): `docs/superpowers/specs/2026-07-30-stack-best-practices-improvement-design.md`.

---

## Phase 1 — Production security  (branch: `fix/backend-security-hardening`)

### File Structure (Phase 1)
- Modify `backend/src/main.ts` — add global `ValidationPipe`.
- Create `backend/src/**/dto/*.dto.ts` — validated request DTOs per controller.
- Modify controllers to type `@Body()`/`@Query()` with DTOs; remove raw `JSON.parse`.
- Create `supabase/migrations/<ts>_add_search_path_to_definer_functions.sql` (if audit finds cases).
- Create `supabase/migrations/<ts>_fix_service_role_rpc_auth.sql` (if audit finds cases).

---

### Task 1: DB `search_path` audit + migration (DB-1)

**Files:**
- Create (conditional): `supabase/migrations/<YYYYMMDDHHMMSS>_add_search_path_to_definer_functions.sql`

**Interfaces:**
- Produces: nothing consumed by later tasks (self-contained DB change).

- [ ] **Step 1: Enumerate live `SECURITY DEFINER` functions missing `search_path`.** Run:
```bash
cd /Users/ruslannazarov/Development/alanya-holidays
grep -rl 'SECURITY DEFINER' supabase/migrations | while read f; do
  awk '/CREATE (OR REPLACE )?FUNCTION/{fn=$0; sd=0; sp=0}
       /SECURITY DEFINER/{sd=1}
       /search_path/{sp=1}
       /AS \$\$|LANGUAGE/{ if(sd && !sp) print FILENAME": "fn; sd=0 }' "$f"
done
```
Expected: a precise list of function definitions (name + file) that are `SECURITY DEFINER` without `search_path`. A function redefined later WITH `search_path` supersedes the earlier one — check the **latest** definition of each name only.

- [ ] **Step 2: If zero real cases, close DB-1.** Note the finding in the PR description ("audit: all live SECURITY DEFINER functions already set search_path") and skip to Task 2. Otherwise continue.

- [ ] **Step 3: Write the migration** for the confirmed functions. For each, use `ALTER FUNCTION <name>(<args>) SET search_path = public;` (does not require rewriting the body):
```sql
-- Purpose: harden SECURITY DEFINER functions missing an explicit search_path
-- (prevents search_path injection). Audit 2026-07-30.
ALTER FUNCTION public.<fn_name>(<arg_types>) SET search_path = public;
-- …one ALTER per confirmed function…
```

- [ ] **Step 4: Test locally.** Run: `supabase db reset` and confirm it applies cleanly.
Expected: no errors; `\df+ <fn_name>` shows `search_path=public` in config.

- [ ] **Step 5: Commit.**
```bash
git add supabase/migrations/*_add_search_path_to_definer_functions.sql
git commit -m "fix(db): set search_path on SECURITY DEFINER functions"
```

---

### Task 2: Service-role RPC auth audit (BE-2)

**Files:**
- Inspect: `backend/src/directory/directory.repository.ts`, `backend/src/blog/blog.repository.ts`, `backend/src/forum/repositories/forum-posts.repository.ts`
- Create (conditional): `supabase/migrations/<ts>_fix_service_role_rpc_auth.sql`

**Interfaces:**
- Consumes: the fixed-pattern reference is migration `20260721181153_fix_vote_rpc_service_role_auth.sql`.
- Produces: self-contained DB + repository change.

- [ ] **Step 1: Identify RPCs that attribute an action to a user.** For each call below, open the RPC's latest migration definition and check whether it uses `auth.uid()` to identify the acting user:
  - `track_listing_view`, `track_listing_click` (directory.repository.ts:273,277)
  - `verify_claim_email`, `approve_listing_claim`, `reject_listing_claim` (directory.repository.ts:364,389,396)
  - `increment_forum_post_view` (forum-posts.repository.ts:122)
  - `increment_blog_views`, `get_related_posts` (blog.repository.ts:113,130)
Expected: a list split into "attributes to user via auth.uid()" vs "anonymous counter (no change needed)".

- [ ] **Step 2: If none attribute to a user via `auth.uid()`, close BE-2.** Document in PR. Otherwise continue.

- [ ] **Step 3: Write the migration** mirroring `20260721181153`: add explicit `p_user_id UUID` param, keep `SECURITY DEFINER SET search_path = public`, and append a REVOKE block:
```sql
REVOKE ALL ON FUNCTION public.<fn>(<new_args>) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.<fn>(<new_args>) TO service_role;
```

- [ ] **Step 4: Update the repository call** to pass `p_user_id` from the server-verified `userId` argument (same as `voteForListing`). Use Serena `replace_symbol_body` for the `.ts` edit.

- [ ] **Step 5: Test.** Run `supabase db reset`, then `cd backend && npm run test -- --run` for the affected repository specs.
Expected: PASS.

- [ ] **Step 6: Commit.**
```bash
git add supabase/migrations/*_fix_service_role_rpc_auth.sql backend/src
git commit -m "fix(rpc): pass server-verified p_user_id to attributing RPCs"
```

---

### Task 3: Global ValidationPipe + first DTO (BE-1, pattern-setter)

**Files:**
- Modify: `backend/src/main.ts:25-31`
- Create: `backend/src/bookings/dto/create-booking.dto.ts`
- Modify: `backend/src/bookings/bookings.controller.ts` (type the create `@Body()`)
- Test: `backend/src/bookings/bookings.controller.spec.ts`
- Modify: `backend/package.json` (add deps)

**Interfaces:**
- Produces: `ValidationPipe` config (`{ whitelist: true, transform: true }`) applied globally; the DTO pattern replicated in Task 4.

- [ ] **Step 1: Install validation deps.** Run:
```bash
cd backend && npm install class-validator class-transformer
```

- [ ] **Step 2: Write a failing test** asserting a malformed booking body is rejected with 400 (open `bookings.controller.spec.ts` and follow its existing harness style):
```ts
it('rejects a booking body with a non-UUID propertyId (400)', async () => {
  await request(app.getHttpServer())
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ propertyId: 'not-a-uuid', checkIn: 'garbage' })
    .expect(400);
});
```

- [ ] **Step 3: Run it — expect FAIL** (currently no validation → 201/500, not 400).
Run: `cd backend && npm run test -- --run bookings.controller`

- [ ] **Step 4: Add the global pipe** in `main.ts` after the exception filter:
```ts
import { ValidationPipe } from '@nestjs/common';
// …inside bootstrap(), after useGlobalFilters:
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, transform: true }),
);
```
(Start with `whitelist` only — NOT `forbidNonWhitelisted` — to strip unknown fields without breaking the current frontend. Tighten to `forbidNonWhitelisted` in a follow-up once clients are confirmed clean.)

- [ ] **Step 5: Create the DTO** mirroring the controller's real create-booking params (read `bookings.controller.ts` + `bookings.service.ts` create input for exact field names):
```ts
import { IsUUID, IsDateString, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID() propertyId!: string;
  @IsDateString() checkIn!: string;
  @IsDateString() checkOut!: string;
  @IsInt() @Min(1) guests!: number;
  @IsOptional() @IsString() note?: string;
  // …add remaining real fields with matching decorators…
}
```

- [ ] **Step 6: Type the controller body:** change `@Body() body: any`/inline type to `@Body() body: CreateBookingDto`.

- [ ] **Step 7: Run tests — expect PASS.**
Run: `cd backend && npm run test -- --run bookings.controller`

- [ ] **Step 8: Commit.**
```bash
git add backend/src/main.ts backend/src/bookings backend/package.json backend/package-lock.json
git commit -m "feat(backend): add global ValidationPipe and CreateBookingDto"
```

---

### Task 4: DTOs for remaining money/data controllers (BE-1, replication)

Apply the Task 3 pattern to each controller below. **One commit per controller** (each is an independently reviewable deliverable). For each: (a) read the controller's `@Body()`/`@Query()` params, (b) create `dto/*.dto.ts` with `class-validator` decorators mirroring them, (c) replace raw `JSON.parse(filters)` with a DTO field validated/transformed by the pipe, (d) add/adjust one controller spec asserting a 400 on bad input, (e) run `npm run test -- --run <controller>`, (f) commit.

**Decorator cheat-sheet:** `@IsUUID()` ids · `@IsString()`/`@IsOptional()` text · `@IsInt()@Min()`/`@IsNumber()` numeric · `@IsDateString()` dates · `@IsIn([...])` enums · `@IsArray()@IsString({each:true})` string lists · `@Type(() => Number)` for query-string coercion.

- [ ] **Step 1: `bookings.controller.ts`** — remaining endpoints (status update, cancel).
- [ ] **Step 2: `properties.controller.ts`** — replace `JSON.parse(filters)` (line ~247) with a `PropertyFilterDto` (`@IsOptional`-fielded), typed `@Query()`.
- [ ] **Step 3: `services.controller.ts`** — replace `JSON.parse(typesFilter)` (line ~174) with a `ServiceFilterDto`.
- [ ] **Step 4: `directory.controller.ts`** — vote/claim/create bodies.
- [ ] **Step 5: `reviews.controller.ts`**, **`blog.controller.ts`**, **`forum/*.controller.ts`**, **`messages.controller.ts`** — request bodies.

Each step ends: `cd backend && npm run test -- --run <name>` PASS, then `git commit -m "feat(backend): validate <name> inputs with DTOs"`.

- [ ] **Final step: full backend gate.** Run `cd backend && npm run lint && npm run test -- --run && npm run build`. Expected: all green. Open PR `fix/backend-security-hardening` → `main`.

---

## Phase 2 — Developer velocity  (branch: `refactor/fe-cycles-and-god-files`)

### Task 5: Break the 3 blog import cycles (FE-1)

**Files:**
- Modify: `frontend/components/home/BlogPostCard.tsx:5`
- Verify: `frontend/modules/blog/index.ts`

**Interfaces:**
- Root cause: `BlogPostCard.tsx:5` imports `BlogPostPreview` from the barrel `../../modules/blog`, which re-exports the pages that import `BlogPostCard` → cycle.

- [ ] **Step 1: Add a cycle check baseline.** Run:
```bash
cd frontend && npx madge --circular --extensions ts,tsx . | grep -i blog
```
Expected: shows the 3 blog cycles.

- [ ] **Step 2: Find where `BlogPostPreview` is actually defined.** Run:
```bash
grep -rn "BlogPostPreview" frontend/modules/blog --include='*.ts' --include='*.tsx' | grep -i 'export\|interface\|type'
```

- [ ] **Step 3: Change the import** in `BlogPostCard.tsx:5` from the barrel to the direct defining module (e.g. `../../modules/blog/types` or wherever Step 2 points), using Serena.

- [ ] **Step 4: Re-run madge — expect the 3 blog cycles gone.**
Run: `cd frontend && npx madge --circular --extensions ts,tsx . | grep -i blog` → no output.

- [ ] **Step 5: Type-check + build.** `cd frontend && npm run type-check && npm run build`. Expected: green.

- [ ] **Step 6: Commit.**
```bash
git add frontend/components/home/BlogPostCard.tsx
git commit -m "refactor(blog): import BlogPostPreview directly to break import cycle"
```

---

### Task 6: Split `types/models.ts` by domain (FE-2a)

**Files:**
- Create: `frontend/types/{property,service,product,booking,chat,directory,blog,forum,itinerary,common}.ts`
- Modify: `frontend/types/models.ts` → becomes a re-export barrel.

**Interfaces:**
- Produces: identical export surface — every symbol currently exported from `models.ts` remains importable from `models.ts`.

- [ ] **Step 1: Group the exports.** Map each interface/type to a domain file (Property*/PropertyDB → `property.ts`; Service*/ServiceModel → `service.ts`; Product/ProductVariant → `product.ts`; Booking/Message/ChatMessage/ChatConversation → `booking.ts`+`chat.ts`; DirectoryListingDB/ListingClaimDB/LocationDB/ListingAnalytics*/ListingAddon/AddonType → `directory.ts`; BlogPost*/BlogTag/BlogSubmission → `blog.ts`; Forum*/EventAttendee → `forum.ts`; ItineraryItem/ItineraryDay/TripParams/SavedItinerary → `itinerary.ts`; Amenity/SocialLinks/UserProfile/Review/Notification/CartItem/SearchFilters/ListingTier → `common.ts`).

- [ ] **Step 2: Move each group** into its file with Serena (preserve cross-references via imports between the new files). One file at a time.

- [ ] **Step 3: Turn `models.ts` into a barrel:**
```ts
export * from './common';
export * from './property';
export * from './service';
// …one line per new module…
```

- [ ] **Step 4: Type-check — expect PASS (no call site changes).**
Run: `cd frontend && npm run type-check`. Fix any import-cycle warnings between the new type files by moving shared types to `common.ts`.

- [ ] **Step 5: Build + test.** `cd frontend && npm run build && npm run test -- --run`. Expected: green.

- [ ] **Step 6: Commit.**
```bash
git add frontend/types
git commit -m "refactor(types): split models.ts into domain-scoped modules with barrel"
```

---

### Task 7: Split `routes/AppRoutes.tsx` into route groups (FE-2b)

**Files:**
- Create: `frontend/routes/{publicRoutes,accountRoutes,hostRoutes,adminRoutes,directoryRoutes}.tsx` (group by the actual domains present)
- Modify: `frontend/routes/AppRoutes.tsx` → composes the groups.

**Interfaces:**
- Produces: identical rendered route tree; `React.lazy` boundaries preserved exactly.

- [ ] **Step 1: Read `AppRoutes.tsx`** and identify natural groups (public/marketing, account/profile, host dashboard, admin, directory).

- [ ] **Step 2: Extract each group** into its own file exporting a `<Route>` fragment or array, keeping every `React.lazy(() => import(...))` call intact and colocated with its group.

- [ ] **Step 3: Recompose `AppRoutes.tsx`** to render the groups.

- [ ] **Step 4: Type-check + build.** `cd frontend && npm run type-check && npm run build`. Expected: green.

- [ ] **Step 5: Smoke the route tests.** Run the existing route/nav specs: `cd frontend && npm run test -- --run AppRoutes` (and any nav spec). Expected: PASS.

- [ ] **Step 6: Commit + open PR** `refactor/fe-cycles-and-god-files` → `main`.
```bash
git add frontend/routes
git commit -m "refactor(routes): split AppRoutes into domain route groups"
```

---

## Phase 3 — Stability / quality  (branch: `chore/quality-hygiene`)

### Task 8: Silent error-swallowing audit (Q-1)

**Files:** any hit from the scan below (frontend + backend + supabase).

- [ ] **Step 1: Scan.** Run:
```bash
cd /Users/ruslannazarov/Development/alanya-holidays
grep -rn '|| 0\b' frontend backend/src supabase/functions --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '.test.'
grep -rn 'Promise.all' backend/src supabase/functions frontend --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '.test.'
```

- [ ] **Step 2: For each `|| 0` on a query/count result:** add an `.error` check + `console.error('context:', error)` before it, and switch to `?? 0` (preserves a legitimate `0`). Use Serena.

- [ ] **Step 3: For each `Promise.all` of DB calls:** after destructuring, check each element's `.error` before reading `.data`/`.count`.

- [ ] **Step 4: Test + type-check** the touched packages. Expected: green.

- [ ] **Step 5: Commit.** `git commit -m "fix: log and guard swallowed query errors"`

---

### Task 9: Effect cleanup spot-check (Q-2)

**Files:** the 23 files matching timers/listeners/subscriptions.

- [ ] **Step 1: List them.** Run:
```bash
grep -rln 'setInterval\|setTimeout\|addEventListener\|\.subscribe(' frontend --include='*.tsx' | grep -v node_modules | grep -v '.test.'
```

- [ ] **Step 2: For each file,** open every `useEffect` containing one of these and confirm the effect returns a cleanup (`clearInterval`/`clearTimeout`/`removeEventListener`/`unsubscribe`). Add the missing cleanup with Serena. Leave correct ones untouched.

- [ ] **Step 3: Type-check + test.** Expected: green.

- [ ] **Step 4: Commit.** `git commit -m "fix(frontend): add missing effect cleanups for timers/listeners"`

---

### Task 10: Type-suppression cleanup (Q-3)

**Files:** the 17 `as any` + 4 `@ts-ignore` app-code sites.

- [ ] **Step 1: List them.** Run:
```bash
grep -rn 'as any' frontend backend --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '.test.'
grep -rn '@ts-ignore\|@ts-nocheck' frontend backend --include='*.ts' --include='*.tsx' | grep -v node_modules
```

- [ ] **Step 2: For each,** replace with the correct type; where a type is genuinely unavailable, add a documented type guard or a narrow interface instead of the suppression. Use Serena; run `get_diagnostics_for_file` after each.

- [ ] **Step 3: Full gate.** `npm run lint && npm run type-check && npm run test -- --run && npm run build`. Expected: green.

- [ ] **Step 4: Commit + open PR** `chore/quality-hygiene` → `main`.

---

## Follow-ups (out of scope, noted for later)
- `main.ts` uses `app.enableCors()` with no config → allows all origins. Consider an allowlist for the production API.
- Tighten `ValidationPipe` to `forbidNonWhitelisted: true` once frontend payloads are confirmed clean.
- Deeper god-file decomposition (`DirectoryCategoryPage.tsx`, `DirectoryMapView.tsx`) when next touched.

## Self-Review
- **Spec coverage:** BE-1→Tasks 3-4; DB-1→Task 1; BE-2→Task 2; FE-1→Task 5; FE-2→Tasks 6-7; Q-1→Task 8; Q-2→Task 9; Q-3→Task 10. All findings mapped.
- **Placeholders:** conditional tasks (1,2) have explicit "if zero cases, close + document" branches, not open-ended TODOs. Task 4 is a real replication procedure with a decorator cheat-sheet, not "add validation".
- **Type consistency:** `ValidationPipe({ whitelist, transform })` defined in Task 3 is the config referenced by Task 4; `p_user_id` pattern references the real migration `20260721181153`.
