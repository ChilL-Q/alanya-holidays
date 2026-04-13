-- ============================================================
-- Migration: Directory Listing Votes (👍/👎)
-- Date: 2026-04-11
-- ============================================================

-- 1. Add net_votes column to directory_listings
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS net_votes INT DEFAULT 0;

-- 2. Index for sorting by net_votes
CREATE INDEX IF NOT EXISTS idx_directory_listings_net_votes ON directory_listings (category_id, net_votes DESC) WHERE net_votes != 0;

-- 3. Create listing_votes table
CREATE TABLE IF NOT EXISTS listing_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
    listing_type TEXT NOT NULL DEFAULT 'directory',
    vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_listing_vote UNIQUE (user_id, listing_id, listing_type)
);

-- 4. Indexes on listing_votes
CREATE INDEX IF NOT EXISTS idx_listing_votes_listing ON listing_votes (listing_id, listing_type);
CREATE INDEX IF NOT EXISTS idx_listing_votes_user ON listing_votes (user_id);

-- 5. Enable RLS on listing_votes
ALTER TABLE listing_votes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for listing_votes

-- Public can read votes (transparent)
CREATE POLICY "listing_votes_select" ON listing_votes
    FOR SELECT
    USING (true);

-- Authenticated users can insert their own vote
CREATE POLICY "listing_votes_insert" ON listing_votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own vote only
CREATE POLICY "listing_votes_update" ON listing_votes
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Authenticated users can delete their own vote only
CREATE POLICY "listing_votes_delete" ON listing_votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- 7. RPC Function: vote_listing
-- UPSERTs the vote and returns the new state
CREATE OR REPLACE FUNCTION vote_listing(
    p_listing_id UUID,
    p_vote SMALLINT,
    p_listing_type TEXT DEFAULT 'directory'
)
RETURNS TABLE (
    net_votes INT,
    user_vote SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_vote NOT IN (1, -1) THEN
        RAISE EXCEPTION 'Vote must be 1 (upvote) or -1 (downvote)';
    END IF;

    -- UPSERT the vote
    INSERT INTO listing_votes (user_id, listing_id, listing_type, vote)
    VALUES (v_user_id, p_listing_id, p_listing_type, p_vote)
    ON CONFLICT (user_id, listing_id, listing_type) DO UPDATE
    SET vote = EXCLUDED.vote, created_at = now();

    -- Return the current state
    RETURN QUERY
    SELECT
        COALESCE((SELECT SUM(vote)::INT FROM listing_votes WHERE listing_id = p_listing_id AND listing_type = p_listing_type), 0),
        (SELECT vote FROM listing_votes WHERE user_id = v_user_id AND listing_id = p_listing_id AND listing_type = p_listing_type);
END;
$$;

-- 8. RPC Function: get_user_vote
-- Returns the current user's vote for a listing (or null)
CREATE OR REPLACE FUNCTION get_user_vote(
    p_listing_id UUID,
    p_listing_type TEXT DEFAULT 'directory'
)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_vote SMALLINT;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT vote INTO v_vote
    FROM listing_votes
    WHERE user_id = v_user_id
      AND listing_id = p_listing_id
      AND listing_type = p_listing_type;

    RETURN v_vote;
END;
$$;

-- 9. Trigger function: recalculate net_votes
CREATE OR REPLACE FUNCTION recalculate_net_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_listing_id UUID;
    v_listing_type TEXT;
BEGIN
    -- Determine which listing was affected
    IF TG_OP = 'DELETE' THEN
        v_listing_id := OLD.listing_id;
        v_listing_type := OLD.listing_type;
    ELSE
        v_listing_id := NEW.listing_id;
        v_listing_type := NEW.listing_type;
    END IF;

    -- Recalculate net_votes for the listing
    UPDATE directory_listings
    SET net_votes = COALESCE(
        (SELECT SUM(vote)::INT FROM listing_votes WHERE listing_id = v_listing_id AND listing_type = v_listing_type),
        0
    )
    WHERE id = v_listing_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- 10. Trigger: fire on INSERT, UPDATE, DELETE of listing_votes
DROP TRIGGER IF EXISTS trg_listing_votes_net ON listing_votes;
CREATE TRIGGER trg_listing_votes_net
    AFTER INSERT OR UPDATE OR DELETE ON listing_votes
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_net_votes();

-- 11. RPC Function: remove_vote
-- Deletes the user's vote and returns updated state
CREATE OR REPLACE FUNCTION remove_listing_vote(
    p_listing_id UUID,
    p_listing_type TEXT DEFAULT 'directory'
)
RETURNS TABLE (
    net_votes INT,
    user_vote SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    DELETE FROM listing_votes
    WHERE user_id = v_user_id
      AND listing_id = p_listing_id
      AND listing_type = p_listing_type;

    RETURN QUERY
    SELECT
        COALESCE((SELECT SUM(vote)::INT FROM listing_votes WHERE listing_id = p_listing_id AND listing_type = p_listing_type), 0),
        NULL::SMALLINT;
END;
$$;

-- 12. RPC Function: get_user_votes_batch
-- Returns votes for multiple listings in a single call
CREATE OR REPLACE FUNCTION get_user_votes_batch(
    p_listing_ids UUID[],
    p_listing_type TEXT DEFAULT 'directory'
)
RETURNS TABLE (
    listing_id UUID,
    vote SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT lv.listing_id, lv.vote
    FROM listing_votes lv
    WHERE lv.user_id = v_user_id
      AND lv.listing_id = ANY(p_listing_ids)
      AND lv.listing_type = p_listing_type;
END;
$$;

-- 13. Backfill net_votes for any existing listings (should be 0, but safety net)
UPDATE directory_listings
SET net_votes = COALESCE(
    (SELECT SUM(vote)::INT FROM listing_votes WHERE listing_id = directory_listings.id AND listing_type = 'directory'),
    0
);
