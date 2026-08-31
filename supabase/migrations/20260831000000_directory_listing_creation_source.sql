-- Record who originated a directory listing so ownership claims are enforced
-- from durable server data instead of client-side ownership guesses.
ALTER TABLE public.directory_listings
  ADD COLUMN IF NOT EXISTS creation_source text;

UPDATE public.directory_listings
SET creation_source = CASE
  -- A completed historical claim is durable evidence that the listing entered
  -- the claim workflow as admin-curated. Missing ownership is not evidence.
  WHEN claimed_at IS NOT NULL THEN 'admin'
  WHEN owner_user_id IS NOT NULL THEN 'merchant'
  ELSE 'import'
END
WHERE creation_source IS NULL;

DO $$
DECLARE
  ambiguous_owner_rows bigint;
  unproven_import_rows bigint;
BEGIN
  SELECT count(*) INTO ambiguous_owner_rows
  FROM public.directory_listings
  WHERE owner_user_id IS NOT NULL
    AND claimed_at IS NULL
    AND creation_source = 'merchant';

  SELECT count(*) INTO unproven_import_rows
  FROM public.directory_listings
  WHERE owner_user_id IS NULL
    AND claimed_at IS NULL
    AND creation_source = 'import';

  RAISE WARNING
    'directory_listings creation_source backfill classified % owner-assigned, unclaimed rows as merchant; review known imports and explicitly set creation_source=import where applicable',
    ambiguous_owner_rows;

  RAISE WARNING
    'directory_listings creation_source backfill kept % ownerless, unclaimed legacy rows fail-closed as import; an admin must explicitly reclassify a verified row before it can be claimed',
    unproven_import_rows;
END;
$$;

ALTER TABLE public.directory_listings
  ALTER COLUMN creation_source SET DEFAULT 'import',
  ALTER COLUMN creation_source SET NOT NULL;

ALTER TABLE public.directory_listings
  DROP CONSTRAINT IF EXISTS directory_listings_creation_source_check;

ALTER TABLE public.directory_listings
  ADD CONSTRAINT directory_listings_creation_source_check
  CHECK (creation_source IN ('admin', 'merchant', 'import'));

ALTER TABLE public.directory_listings
  ADD COLUMN IF NOT EXISTS can_claim boolean
  GENERATED ALWAYS AS (
    creation_source = 'admin' AND claimed_at IS NULL
  ) STORED;

CREATE OR REPLACE FUNCTION public.enforce_listing_claim_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  source_value text;
  claimed_value timestamptz;
BEGIN
  SELECT creation_source, claimed_at
    INTO source_value, claimed_value
  FROM public.directory_listings
  WHERE id = NEW.listing_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = '23503';
  END IF;

  IF source_value <> 'admin' OR claimed_value IS NOT NULL THEN
    RAISE EXCEPTION 'This listing is not eligible for ownership claims'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listing_claims_enforce_eligibility
  ON public.listing_claims;

CREATE TRIGGER listing_claims_enforce_eligibility
BEFORE INSERT ON public.listing_claims
FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_claim_eligibility();

-- Blog articles and travel guides remain in the existing blog_posts model;
-- this discriminator enables explicit admin/public filtering without a second
-- content table or a destructive migration.
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'blog';

ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_content_type_check;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_content_type_check
  CHECK (content_type IN ('blog', 'guide'));

-- This SECURITY DEFINER function is directly callable by public API roles, so
-- both its category-first branch and recent-post fill must enforce the same
-- blog-only boundary as the REST queries.
CREATE OR REPLACE FUNCTION public.get_related_posts(
    p_post_id UUID,
    p_category TEXT,
    p_limit INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    excerpt TEXT,
    cover_image_url TEXT,
    category TEXT,
    published_at TIMESTAMPTZ,
    author JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH category_posts AS (
        SELECT
            bp.id,
            bp.title,
            bp.slug,
            bp.excerpt,
            bp.cover_image_url,
            bp.category,
            bp.published_at,
            jsonb_build_object(
                'full_name', pr.full_name,
                'avatar_url', pr.avatar_url
            ) AS author
        FROM public.blog_posts bp
        LEFT JOIN public.profiles pr ON bp.author_id = pr.id
        WHERE bp.status = 'published'
          AND bp.content_type = 'blog'
          AND p_category IS NOT NULL
          AND p_category <> ''
          AND bp.category = p_category
          AND bp.id <> p_post_id
        ORDER BY bp.published_at DESC
        LIMIT p_limit
    ),
    recent_posts AS (
        SELECT
            bp.id,
            bp.title,
            bp.slug,
            bp.excerpt,
            bp.cover_image_url,
            bp.category,
            bp.published_at,
            jsonb_build_object(
                'full_name', pr.full_name,
                'avatar_url', pr.avatar_url
            ) AS author
        FROM public.blog_posts bp
        LEFT JOIN public.profiles pr ON bp.author_id = pr.id
        WHERE bp.status = 'published'
          AND bp.content_type = 'blog'
          AND bp.id <> p_post_id
          AND bp.id NOT IN (SELECT cp.id FROM category_posts cp)
        ORDER BY bp.published_at DESC
        LIMIT p_limit
    )
    SELECT * FROM category_posts
    UNION ALL
    SELECT * FROM recent_posts
    LIMIT p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_related_posts(UUID, TEXT, INT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_related_posts(UUID, TEXT, INT)
  TO anon;
GRANT EXECUTE ON FUNCTION public.get_related_posts(UUID, TEXT, INT)
  TO authenticated;
