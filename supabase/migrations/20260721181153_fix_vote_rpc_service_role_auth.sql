-- ============================================================
-- Migration: Fix vote RPCs broken by service-role backend calls
-- Date: 2026-07-21
--
-- Problem: vote_listing / get_user_votes_batch / remove_listing_vote
-- resolved the caller via auth.uid(), which only works inside a
-- Postgres session tied to the user's JWT. The NestJS backend calls
-- these RPCs through a single service-role SupabaseClient with no
-- per-request JWT, so auth.uid() was always NULL there.
--
-- Fix: accept p_user_id explicitly. The backend's AuthGuard already
-- verifies the JWT via supabase.auth.getUser(token) before calling
-- these RPCs (see backend/src/auth/auth.guard.ts), so p_user_id is
-- a trusted, server-verified value, not client input.
--
-- IMPORTANT: p_user_id is trustworthy ONLY because these functions are
-- restricted to service_role below. CREATE OR REPLACE with a different
-- parameter list creates a NEW function overload — Postgres/Supabase
-- auto-grants EXECUTE on new functions to PUBLIC and anon by default
-- (see 20260607090007_fix_revoke_anon_explicit_grants.sql for this
-- exact footgun documented elsewhere in this repo). Without the REVOKE
-- block at the bottom of this file, any anonymous caller could POST to
-- /rest/v1/rpc/vote_listing with an arbitrary p_user_id and vote as
-- someone else — auth.uid() is gone, so nothing else would stop them.
-- ============================================================

CREATE OR REPLACE FUNCTION vote_listing(
    p_listing_id UUID,
    p_vote SMALLINT,
    p_user_id UUID,
    p_listing_type TEXT DEFAULT 'directory'
)
RETURNS TABLE (
    net_votes INT,
    user_vote SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_vote NOT IN (1, -1) THEN
        RAISE EXCEPTION 'Vote must be 1 (upvote) or -1 (downvote)';
    END IF;

    INSERT INTO listing_votes (user_id, listing_id, listing_type, vote)
    VALUES (p_user_id, p_listing_id, p_listing_type, p_vote)
    ON CONFLICT (user_id, listing_id, listing_type) DO UPDATE
    SET vote = EXCLUDED.vote, created_at = now();

    RETURN QUERY
    SELECT
        COALESCE((SELECT SUM(vote)::INT FROM listing_votes WHERE listing_id = p_listing_id AND listing_type = p_listing_type), 0),
        (SELECT vote FROM listing_votes WHERE user_id = p_user_id AND listing_id = p_listing_id AND listing_type = p_listing_type);
END;
$$;

CREATE OR REPLACE FUNCTION remove_listing_vote(
    p_listing_id UUID,
    p_user_id UUID,
    p_listing_type TEXT DEFAULT 'directory'
)
RETURNS TABLE (
    net_votes INT,
    user_vote SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    DELETE FROM listing_votes
    WHERE user_id = p_user_id
      AND listing_id = p_listing_id
      AND listing_type = p_listing_type;

    RETURN QUERY
    SELECT
        COALESCE((SELECT SUM(vote)::INT FROM listing_votes WHERE listing_id = p_listing_id AND listing_type = p_listing_type), 0),
        NULL::SMALLINT;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_votes_batch(
    p_listing_ids UUID[],
    p_user_id UUID,
    p_listing_type TEXT DEFAULT 'directory'
)
RETURNS TABLE (
    listing_id UUID,
    vote SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT lv.listing_id, lv.vote
    FROM listing_votes lv
    WHERE lv.user_id = p_user_id
      AND lv.listing_id = ANY(p_listing_ids)
      AND lv.listing_type = p_listing_type;
END;
$$;

-- get_user_vote is called from the frontend directly (with the user's
-- own JWT/session), where auth.uid() is correct — left untouched.

-- Lock the new overloads to the backend only. service_role bypasses
-- EXECUTE checks entirely (see 20260607090007), so no explicit GRANT
-- is needed — only the REVOKEs below matter.
REVOKE EXECUTE ON FUNCTION public.vote_listing(UUID, SMALLINT, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vote_listing(UUID, SMALLINT, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vote_listing(UUID, SMALLINT, UUID, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_listing_vote(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_listing_vote(UUID, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_listing_vote(UUID, UUID, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_votes_batch(UUID[], UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_votes_batch(UUID[], UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_votes_batch(UUID[], UUID, TEXT) FROM authenticated;

-- Drop the old auth.uid()-based overloads — dead now that the backend
-- calls the p_user_id signature above, and leaving them reachable by
-- `authenticated` is redundant attack surface (self-scoped only, but
-- unused and unmaintained).
DROP FUNCTION IF EXISTS public.vote_listing(UUID, SMALLINT, TEXT);
DROP FUNCTION IF EXISTS public.remove_listing_vote(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_votes_batch(UUID[], TEXT);
