# Sprint 2 Wave 1 — Community & AI Features

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build community-driven features (Forum enhancements + internal linking) and expand AI capabilities for itinerary generation.

**Architecture:** 
- COM-001: Extend forum with "Ask Alanya" Q&A section (new post type)
- COM-002: Cross-link forum discussions, blog posts, directory listings
- AI-001: Build AI-powered itinerary planner (Claude + Gemini integration)

**Tech Stack:** React 19, TypeScript, Supabase RLS, Deno Edge Functions, Claude API, Gemini API

## Global Constraints

- All commits WITHOUT `Co-Authored-By` footer
- TypeScript edits use Serena MCP only (replace_symbol_body, rename_symbol)
- Migrations are idempotent
- All tests must pass before merge
- Forum seeding (120+ posts) is live baseline for COM-001 & COM-002

---

## Task 1: COM-001 — Forum "Ask Alanya" (Q&A Section)

**Files:**
- Modify: `supabase/migrations/` (new migration for Q&A post type)
- Modify: `api-services/api/forum.ts` (add Q&A post creation/filtering)
- Create: `components/forum/AskAlanyaSection.tsx` (Q&A sidebar)
- Modify: `pages/ForumPage.tsx` (add Q&A tab/filter)

**Interfaces:**
- Consumes: Forum infrastructure (120+ seeded posts from forum seeding)
- Produces: New Q&A post type visible in forum, filterable by category, integrated sidebar

**Requirements:**
- [ ] Step 1: Create migration adding `post_type` column to `forum_posts` ('discussion' | 'question')
- [ ] Step 2: Create RPC `create_question_post(title, body, category_id)` for Q&A submissions
- [ ] Step 3: Add Q&A filtering to `getForumPosts(category, postType)` in api-services
- [ ] Step 4: Create `AskAlanyaSection.tsx` — sidebar widget showing recent unanswered questions
- [ ] Step 5: Add "Ask Alanya" tab to forum page, filters posts by `post_type = 'question'`
- [ ] Step 6: Test — add question, verify it appears in Q&A section + regular forum
- [ ] Step 7: Commit

---

## Task 2: COM-002 — Community Internal Linking

**Files:**
- Create: `utils/communityLinks.ts` (helper to detect and link forum/blog/directory terms)
- Modify: `pages/ForumPage.tsx`, `pages/BlogPage.tsx` (add related links section)
- Create: `components/community/RelatedDiscussions.tsx` (show related forum posts when viewing blog/listing)

**Interfaces:**
- Consumes: Forum posts, blog posts, directory listings (all live)
- Produces: Cross-linked content with "Related Discussions" / "Related Listings" sections

**Requirements:**
- [ ] Step 1: Build `communityLinks.ts` utility — detect category/keyword matches between forum posts, blog posts, listings
- [ ] Step 2: Add "Related Discussions" section to blog post page (shows forum posts from same category)
- [ ] Step 3: Add "Related Blog Posts" section to forum post page (inverse)
- [ ] Step 4: Integrate "Related Listings" into forum post detail (already done in seeding phase, verify still works)
- [ ] Step 5: Test cross-links on sample posts
- [ ] Step 6: Commit

---

## Task 3: AI-001 — AI Itinerary Builder (Claude Focus)

**Files:**
- Modify: `pages/PlanTripPage.tsx` (AI itinerary form)
- Create: `supabase/functions/generate-itinerary-claude/index.ts` (Claude-based generation)
- Modify: `api-services/api/ai.ts` (add itinerary service)
- Create: `components/itinerary/ItineraryResults.tsx` (display AI-generated itinerary)

**Interfaces:**
- Consumes: User preferences (days, interests, budget), forum/blog/directory data for context
- Produces: AI-generated itinerary with activities, timing, budget breakdown

**Requirements:**
- [ ] Step 1: Create Edge Function `generate-itinerary-claude` using Claude API
- [ ] Step 2: Build prompt that uses forum discussions + directory listings as context
- [ ] Step 3: Add form to `PlanTripPage.tsx` — days, interests (beach, food, culture, etc.), budget
- [ ] Step 4: Call Claude function, display streaming results in `ItineraryResults.tsx`
- [ ] Step 5: Add option to save itinerary to user's profile (localStorage or DB)
- [ ] Step 6: Test with sample inputs
- [ ] Step 7: Commit

---

## Progress Ledger

(Will be updated as tasks complete)

- Task 1: PENDING (COM-001)
- Task 2: PENDING (COM-002)
- Task 3: PENDING (AI-001)
