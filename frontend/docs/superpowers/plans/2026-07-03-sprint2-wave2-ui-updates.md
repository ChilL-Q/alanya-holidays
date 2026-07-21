# Sprint 2 Wave 2 — UI & Text Updates

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh UI and text across platform — category renames, navigation changes, featured listings rebrand, visual enhancements, blog search.

**Architecture:** Localization-first (update `locales/*.ts` for all languages), UI component updates, asset additions.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, i18n (locales), directory data

## Global Constraints

- All commits WITHOUT `Co-Authored-By` footer
- TypeScript edits use Serena MCP only
- All tests must pass before merge
- Maintain backward compatibility (no breaking changes)
- Update all languages (en, tr, ru, ar)

---

## Task 1: Category Rename — "Natural Attractions" → "Beaches & Nature"

**Files:**
- Modify: `locales/en.ts:844` (`'dir.cat.nature': 'Natural Attractions'` → `'Beaches & Nature'`)
- Modify: `locales/tr.ts`, `locales/ru.ts`, `locales/ar.ts` (same key, translations)
- Modify: `data/directoryData.ts:211` (SEO title if changing)

**Requirements:**
- [ ] Step 1: Update `dir.cat.nature` in all locale files
- [ ] Step 2: Check SEO impact (title/meta on `/alanya-nature-attractions`)
- [ ] Step 3: Test category displays with new name
- [ ] Step 4: Verify no broken links/references
- [ ] Step 5: Commit

---

## Task 2: Category Rename — "Tours & Experiences" → "Things to Do"

**Files:**
- Modify: `locales/en.ts:837` (`'dir.cat.tours': 'Tours & Experiences'` → `'Things to Do'`)
- Modify: `locales/tr.ts`, `locales/ru.ts`, `locales/ar.ts`
- Consider: Use CSS `text-uppercase` vs hardcoded caps (prefer CSS for accessibility)

**Requirements:**
- [ ] Step 1: Update `dir.cat.tours` in all locales
- [ ] Step 2: Decide on capitalization (CSS or text)
- [ ] Step 3: Test category displays
- [ ] Step 4: Commit

---

## Task 3: Navigation Rename — "Forum" → "Community", "Blog" → "Guides"

**Files:**
- Modify: `locales/en.ts:7-8` (`'nav.forum'`, `'nav.blog'`)
- Modify: `locales/tr.ts`, `locales/ru.ts`, `locales/ar.ts`

**Decision needed:**
- `/community` hub already exists (CommunityPage.tsx)
- Renaming nav.forum to "Community" creates two similar items
- Action: Keep `/forum` route, just rename nav label to "Community" (verify no confusion)

**Requirements:**
- [ ] Step 1: Update nav labels in all locales
- [ ] Step 2: Verify `/community` hub still exists & works
- [ ] Step 3: Test navigation UX (no confusion)
- [ ] Step 4: Commit

---

## Task 4: Featured/Premium Listings Rebrand

**Files:**
- Modify: Component headers (PremiumListingsSection, SignatureListingsSection, FreeListingsSection)
- Modify: Locale keys for section titles & badges

**Requirements:**
- [ ] Step 1: Update section titles (from customer's provided options)
- [ ] Step 2: Update locale keys for all languages
- [ ] Step 3: Test homepage sections display correctly
- [ ] Step 4: Commit

---

## Task 5: Category Icons → Real Photos

**Files:**
- Modify: `pages/DirectoryHome.tsx:67-79` (category icons object)
- Add: Category photos to assets (or Supabase Storage)

**Requirements:**
- [ ] Step 1: Obtain category photos from customer (12 categories)
- [ ] Step 2: Add images to `/public/images/categories/` (or optimize via Supabase)
- [ ] Step 3: Replace emoji icons with `<img>` tags (loading="lazy", width/height)
- [ ] Step 4: Apply Tailwind `object-cover` for consistent sizing
- [ ] Step 5: Test responsive design (mobile/tablet/desktop)
- [ ] Step 6: Commit

---

## Task 6: Blog Search + Filter

**Files:**
- Modify: `pages/BlogPage.tsx` (add search input)
- Modify: `api-services/api/blog.ts` (add search parameter to query)

**Requirements:**
- [ ] Step 1: Add text `<input>` with debounce (300ms) next to category filters
- [ ] Step 2: Update `getBlogPosts()` to accept `search` parameter
- [ ] Step 3: Implement backend search: `ilike` on title + content (or full-text search)
- [ ] Step 4: Test search + category filter combination
- [ ] Step 5: Commit

---

## Task 7: Card Style — "Box" → "Rectangle"

**Files:**
- Modify: `components/directory/DirectoryListingCard.tsx:35` (Tailwind rounded classes)

**Decision needed:**
- One-time style change (rounded-2xl → rounded-md) or user toggle?
- Recommend: One-time change for consistency (simpler)

**Requirements:**
- [ ] Step 1: Decide: one-time or toggle
- [ ] Step 2: If one-time: replace `rounded-2xl` with `rounded-md` (or `rounded-none`)
- [ ] Step 3: If toggle: add UI control, persist in localStorage
- [ ] Step 4: Test responsive layout (cards still look good)
- [ ] Step 5: Commit

---

## Progress Ledger

(Will be updated as tasks complete)

- Task 1: PENDING (Natural Attractions → Beaches & Nature)
- Task 2: PENDING (Tours & Experiences → Things to Do)
- Task 3: PENDING (Nav: Forum→Community, Blog→Guides)
- Task 4: PENDING (Featured/Premium rebrand)
- Task 5: PENDING (Icons → photos)
- Task 6: PENDING (Blog search)
- Task 7: PENDING (Card style)
