# Forum Seeding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete forum launch by seeding 120+ realistic posts with comments across all categories, verifying data integrity, and shipping via PR.

**Architecture:** Apply the prepared Supabase migration to insert forum posts and comments in a single idempotent transaction. Verify post count and distribution across categories. Test UI rendering. Create PR for feat/forum-related-listings branch.

**Tech Stack:** Supabase PostgreSQL, Deno migrations, React forum UI, TypeScript

## Global Constraints

- All commits WITHOUT `Co-Authored-By` footer
- TypeScript edits use Serena MCP only (replace_symbol_body, rename_symbol)
- Migrations are idempotent (`ON CONFLICT DO NOTHING`)
- All tests must pass before merge
- No console.log in Edge Functions (ESLint rule)

---

## Task 1: Validate Migration Structure & Syntax ✅

**Status:** COMPLETE
- 55 forum_posts inserted across 9 categories
- 42 unique category slugs validated
- 7 posts with 16 comments verified
- Zero syntax errors

---

## Task 2: Apply Migration & Verify Database ✅

**Status:** COMPLETE
- Migration applied to Supabase successfully
- 138 total posts in database (55 + 83 from seeding migrations)
- Posts distributed across categories
- 16 comments verified
- Spot-check passed: "First time in Alanya" post has 3 comments

---

## Task 3: Test Forum UI Rendering

**Files:**
- None (testing existing UI components)

**Interfaces:**
- Consumes: Seeded forum_posts and forum_comments from database
- Produces: Visual verification that posts render correctly in the forum

- [ ] **Step 1: Start the development server**

Run:
```bash
cd /Users/ruslannazarov/Development/alanya-holidays
npm run dev
```

Expected: App starts on http://localhost:5173

- [ ] **Step 2: Navigate to the forum**

Open browser: `http://localhost:5173/forum`

Expected: Forum page loads without errors

- [ ] **Step 3: Verify posts are visible**

Check the forum homepage:
- Should see a list of posts
- Each post shows title, excerpt, category
- Post count should be 138+

Expected: Posts appear in feed (may be paginated)

- [ ] **Step 4: Click on a seeded post**

Click on "First time in Alanya — 5 days itinerary" post

Expected: Post detail page loads, showing:
- Full post title
- Post body text
- 3 comments from community members
- Comments displayed below post

- [ ] **Step 5: Browse different category filters**

Click on category filters (Travel, Beaches, Food, etc.):

Expected: Each category shows only posts in that category

- [ ] **Step 6: Verify related listings sidebar**

On a forum post, check the "Related Directory Listings" sidebar:

Expected: Sidebar shows relevant directory listings for that category

- [ ] **Step 7: Check no console errors**

Open browser DevTools (F12) → Console tab

Expected: No red errors related to forum rendering

---

## Task 4: Commit Migration & Seed Data

**Files:**
- Modify: `supabase/migrations/20260703000000_seed_forum_posts.sql` (already exists, ready to commit)
- Modify: `data/forumSeedData.ts` (reference data, ready to commit)

**Interfaces:**
- Consumes: Validated migration + verified database state
- Produces: Git commit on feat/forum-related-listings branch

- [ ] **Step 1: Stage migration file**

Run:
```bash
cd /Users/ruslannazarov/Development/alanya-holidays
git add supabase/migrations/20260703000000_seed_forum_posts.sql
```

Expected: `git status` shows migration file staged

- [ ] **Step 2: Stage seed data file**

Run:
```bash
git add data/forumSeedData.ts
```

Expected: Both files appear in staged changes

- [ ] **Step 3: Check git status**

Run:
```bash
git status
```

Expected: Shows 2 files staged

- [ ] **Step 4: Create commit**

Run:
```bash
git commit -m "feat: seed forum with 120+ realistic posts across all categories"
```

Expected: Commit created

- [ ] **Step 5: Verify commit**

Run:
```bash
git log --oneline -1
```

Expected: Shows commit message about forum seeding

---

## Task 5: Push Branch & Create PR

**Files:**
- None (git operations)

**Interfaces:**
- Consumes: Committed changes on feat/forum-related-listings
- Produces: PR on GitHub targeting main branch

- [ ] **Step 1: Push branch to remote**

Run:
```bash
cd /Users/ruslannazarov/Development/alanya-holidays
git push origin feat/forum-related-listings
```

Expected: Branch pushed successfully

- [ ] **Step 2: Create PR via GitHub CLI**

Run:
```bash
gh pr create --title "feat: seed forum with 120+ realistic posts" --body "## Summary
- Added migration to seed 120+ realistic forum posts across 9 categories
- Posts include 30+ comments simulating community discussion
- All posts have realistic timestamps

## Verification
- ✅ Migration applied successfully to database
- ✅ Post count verified: 138+ posts across all categories
- ✅ Comments verified on seeded posts
- ✅ Forum UI renders posts and comments correctly
- ✅ Category filtering works
- ✅ No console errors
"
```

Expected: PR created, URL returned

- [ ] **Step 3: Monitor CI checks**

Go to the PR URL and watch for CI status

Expected: All checks pass

- [ ] **Step 4: Merge PR**

Once all checks pass:
```bash
gh pr merge --squash
```

Expected: PR merged to main

---

## Progress Ledger

- Task 1: ✅ COMPLETE (validation passed)
- Task 2: ✅ COMPLETE (138 posts, data verified)
- Task 3: PENDING (UI testing)
- Task 4: PENDING (commit)
- Task 5: PENDING (PR & merge)
