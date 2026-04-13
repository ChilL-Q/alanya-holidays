-- Migration: 20260413000002_blog_system
-- Purpose: Create blog_posts, blog_tags, blog_post_tags tables with RLS
-- Task: [87] Блог — БД схема + API

-- ============================================================
-- 1. CREATE blog_posts table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    video_url TEXT,
    cover_image_url TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    views INT NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CREATE blog_tags + blog_post_tags tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

-- Enforce unique tag names and slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_tags_name ON public.blog_tags (name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags (slug);

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
-- Unique slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);

-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts (status);

-- Author-based queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts (author_id);

-- Featured published posts (small, fast partial index)
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
    ON public.blog_posts (id, title, slug, cover_image_url, published_at)
    WHERE is_featured = true AND status = 'published';

-- Category + status composite
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_status
    ON public.blog_posts (category, status, published_at DESC);

-- Published posts ordered by date (for listing pages)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
    ON public.blog_posts (published_at DESC)
    WHERE status = 'published';

-- Junction table index (tag → posts direction, FK already creates post_id index)
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON public.blog_post_tags (tag_id);

-- ============================================================
-- 4. TRIGGER: updated_at
-- ============================================================
-- Uses the existing global update_updated_at_column() function
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. ROW LEVEL SECURITY — blog_posts
-- ============================================================
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- SELECT: public can read published posts only
CREATE POLICY "blog_posts_select_published" ON public.blog_posts
    FOR SELECT
    USING (status = 'published');

-- SELECT: authors can read their own posts (any status)
CREATE POLICY "blog_posts_select_own" ON public.blog_posts
    FOR SELECT
    USING (author_id = (SELECT auth.uid()));

-- SELECT: admin can read all posts
CREATE POLICY "blog_posts_select_admin" ON public.blog_posts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- INSERT: authenticated users can create posts (author_id forced in API layer)
CREATE POLICY "blog_posts_insert" ON public.blog_posts
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- UPDATE: authors can update their own posts
CREATE POLICY "blog_posts_update" ON public.blog_posts
    FOR UPDATE
    USING (
        author_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- DELETE: admin only
CREATE POLICY "blog_posts_delete" ON public.blog_posts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- ============================================================
-- 6. ROW LEVEL SECURITY — blog_tags
-- ============================================================
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- SELECT: public read
CREATE POLICY "blog_tags_select" ON public.blog_tags
    FOR SELECT
    USING (true);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "blog_tags_insert" ON public.blog_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "blog_tags_update" ON public.blog_tags
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "blog_tags_delete" ON public.blog_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- ============================================================
-- 7. ROW LEVEL SECURITY — blog_post_tags
-- ============================================================
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- SELECT: public read
CREATE POLICY "blog_post_tags_select" ON public.blog_post_tags
    FOR SELECT
    USING (true);

-- INSERT/DELETE: post author or admin
CREATE POLICY "blog_post_tags_insert" ON public.blog_post_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.blog_posts bp
            WHERE bp.id = blog_post_tags.post_id
            AND (
                bp.author_id = (SELECT auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = (SELECT auth.uid())
                    AND role = 'admin'
                )
            )
        )
    );

CREATE POLICY "blog_post_tags_delete" ON public.blog_post_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts bp
            WHERE bp.id = blog_post_tags.post_id
            AND (
                bp.author_id = (SELECT auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = (SELECT auth.uid())
                    AND role = 'admin'
                )
            )
        )
    );
