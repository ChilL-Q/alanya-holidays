-- Migration: 20260822160000_sprint2_n1_performance_rpcs
-- Purpose: Eliminate N+1 and in-memory aggregation bottlenecks (audit Task 3.4)
-- Provides high-performance database-side aggregations and atomic booking confirmations.

-- 1. Platform Analytics Aggregation RPC (O(1) RTT for Admin Dashboard)
CREATE OR REPLACE FUNCTION public.get_platform_analytics(
    p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_days integer := COALESCE(NULLIF(p_days, 0), 30);
    v_cutoff_date date;
    v_kpi jsonb;
    v_views_trend jsonb;
    v_channel_breakdown jsonb;
    v_tier_dist jsonb;
    v_status_dist jsonb;
    v_top_listings jsonb;
    v_total_views bigint := 0;
    v_total_whatsapp bigint := 0;
    v_total_website bigint := 0;
    v_total_map bigint := 0;
    v_total_clicks bigint := 0;
    v_active_listings bigint := 0;
    v_pending_listings bigint := 0;
    v_pending_claims bigint := 0;
    v_total_claims bigint := 0;
    v_approved_claims bigint := 0;
    v_claim_conversion numeric := 0;
BEGIN
    IF v_days <= 0 THEN
        v_days := 30;
    END IF;
    v_cutoff_date := CURRENT_DATE - (v_days || ' days')::interval;

    -- 1. Status and Tier Distribution from directory_listings
    SELECT 
        jsonb_build_object(
            'approved', COUNT(*) FILTER (WHERE LOWER(status) = 'approved'),
            'pending', COUNT(*) FILTER (WHERE LOWER(status) = 'pending'),
            'rejected', COUNT(*) FILTER (WHERE LOWER(status) = 'rejected'),
            'draft', COUNT(*) FILTER (WHERE LOWER(status) = 'draft')
        ),
        jsonb_build_object(
            'explorer', COUNT(*) FILTER (WHERE LOWER(tier) = 'explorer'),
            'voyager', COUNT(*) FILTER (WHERE LOWER(tier) = 'voyager'),
            'signature', COUNT(*) FILTER (WHERE LOWER(tier) = 'signature'),
            'partner', COUNT(*) FILTER (WHERE LOWER(tier) = 'partner')
        ),
        COUNT(*) FILTER (WHERE LOWER(status) = 'approved'),
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending')
    INTO v_status_dist, v_tier_dist, v_active_listings, v_pending_listings
    FROM directory_listings;

    v_status_dist := COALESCE(v_status_dist, '{"approved":0,"pending":0,"rejected":0,"draft":0}'::jsonb);
    v_tier_dist := COALESCE(v_tier_dist, '{"explorer":0,"voyager":0,"signature":0,"partner":0}'::jsonb);

    -- 2. Claims Aggregation from listing_claims
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending'),
        COUNT(*) FILTER (WHERE LOWER(status) = 'approved')
    INTO v_total_claims, v_pending_claims, v_approved_claims
    FROM listing_claims;

    IF v_total_claims > 0 THEN
        v_claim_conversion := ROUND((v_approved_claims::numeric / v_total_claims::numeric) * 100, 2);
    ELSE
        v_claim_conversion := 0;
    END IF;

    -- 3. Analytics Aggregation from listing_analytics
    SELECT
        COALESCE(SUM(views), 0),
        COALESCE(SUM(whatsapp_clicks), 0),
        COALESCE(SUM(website_clicks), 0),
        COALESCE(SUM(map_clicks), 0)
    INTO v_total_views, v_total_whatsapp, v_total_website, v_total_map
    FROM listing_analytics
    WHERE date >= v_cutoff_date;

    v_total_clicks := v_total_whatsapp + v_total_website + v_total_map;

    -- 4. Daily Views Trend
    SELECT COALESCE(jsonb_agg(d_point ORDER BY d_point->>'date' ASC), '[]'::jsonb)
    INTO v_views_trend
    FROM (
        SELECT jsonb_build_object(
            'date', to_char(date, 'YYYY-MM-DD'),
            'views', COALESCE(SUM(views), 0),
            'whatsappClicks', COALESCE(SUM(whatsapp_clicks), 0),
            'websiteClicks', COALESCE(SUM(website_clicks), 0),
            'mapClicks', COALESCE(SUM(map_clicks), 0),
            'totalClicks', COALESCE(SUM(whatsapp_clicks + website_clicks + map_clicks), 0)
        ) AS d_point
        FROM listing_analytics
        WHERE date >= v_cutoff_date
        GROUP BY date
    ) sub_daily;

    -- 5. Channel Breakdown
    v_channel_breakdown := jsonb_build_array(
        jsonb_build_object(
            'channel', 'whatsapp',
            'label', 'WhatsApp',
            'clicks', v_total_whatsapp,
            'percentage', CASE WHEN v_total_clicks > 0 THEN ROUND((v_total_whatsapp::numeric / v_total_clicks::numeric) * 100, 2) ELSE 0 END
        ),
        jsonb_build_object(
            'channel', 'website',
            'label', 'Website',
            'clicks', v_total_website,
            'percentage', CASE WHEN v_total_clicks > 0 THEN ROUND((v_total_website::numeric / v_total_clicks::numeric) * 100, 2) ELSE 0 END
        ),
        jsonb_build_object(
            'channel', 'map',
            'label', 'Directions',
            'clicks', v_total_map,
            'percentage', CASE WHEN v_total_clicks > 0 THEN ROUND((v_total_map::numeric / v_total_clicks::numeric) * 100, 2) ELSE 0 END
        )
    );

    -- 6. Top Listings (Top 10 by views + clicks)
    SELECT COALESCE(jsonb_agg(top_row), '[]'::jsonb)
    INTO v_top_listings
    FROM (
        SELECT jsonb_build_object(
            'id', dl.id,
            'name', COALESCE(dl.name, 'Unnamed Business'),
            'category', dl.category_id,
            'tier', COALESCE(dl.tier, 'explorer'),
            'views', COALESCE(SUM(la.views), 0),
            'clicks', COALESCE(SUM(la.whatsapp_clicks + la.website_clicks + la.map_clicks), 0)
        ) AS top_row
        FROM listing_analytics la
        JOIN directory_listings dl ON dl.id = la.listing_id
        WHERE la.date >= v_cutoff_date
        GROUP BY dl.id, dl.name, dl.category_id, dl.tier
        ORDER BY (COALESCE(SUM(la.views), 0) + COALESCE(SUM(la.whatsapp_clicks + la.website_clicks + la.map_clicks), 0)) DESC
        LIMIT 10
    ) sub_top;

    IF v_top_listings IS NULL OR jsonb_array_length(v_top_listings) = 0 THEN
        SELECT COALESCE(jsonb_agg(top_fallback), '[]'::jsonb)
        INTO v_top_listings
        FROM (
            SELECT jsonb_build_object(
                'id', dl.id,
                'name', COALESCE(dl.name, 'Unnamed Business'),
                'category', dl.category_id,
                'tier', COALESCE(dl.tier, 'explorer'),
                'views', 0,
                'clicks', 0
            ) AS top_fallback
            FROM directory_listings dl
            LIMIT 5
        ) sub_fallback;
    END IF;

    v_kpi := jsonb_build_object(
        'totalViews', v_total_views,
        'totalClicks', v_total_clicks,
        'totalWhatsAppClicks', v_total_whatsapp,
        'totalWebsiteClicks', v_total_website,
        'totalMapClicks', v_total_map,
        'activeListingsCount', v_active_listings,
        'pendingListingsCount', v_pending_listings,
        'pendingClaimsCount', v_pending_claims,
        'totalClaimsCount', v_total_claims,
        'approvedClaimsCount', v_approved_claims,
        'claimConversionRate', v_claim_conversion
    );

    RETURN jsonb_build_object(
        'kpiSummary', v_kpi,
        'viewsTrend', COALESCE(v_views_trend, '[]'::jsonb),
        'channelBreakdown', v_channel_breakdown,
        'tierDistribution', v_tier_dist,
        'statusDistribution', v_status_dist,
        'topListings', COALESCE(v_top_listings, '[]'::jsonb)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_analytics(integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics(integer) TO authenticated, service_role;


-- 2. Chat Batch Metadata RPC (O(1) RTT for Conversation List)
CREATE OR REPLACE FUNCTION public.get_conversations_last_and_unread(
    p_conversation_ids UUID[],
    p_user_id UUID
)
RETURNS TABLE (
    conversation_id UUID,
    last_message_id UUID,
    last_message_sender_id UUID,
    last_message_content TEXT,
    last_message_is_read BOOLEAN,
    last_message_created_at TIMESTAMPTZ,
    unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH target_convs AS (
        SELECT unnest(p_conversation_ids) AS conv_id
    ),
    last_msgs AS (
        SELECT DISTINCT ON (m.conversation_id)
            m.id,
            m.conversation_id,
            m.sender_id,
            m.content,
            m.is_read,
            m.created_at
        FROM chat_messages m
        JOIN target_convs tc ON tc.conv_id = m.conversation_id
        ORDER BY m.conversation_id, m.created_at DESC
    ),
    unreads AS (
        SELECT
            m.conversation_id,
            COUNT(*)::BIGINT AS unread_count
        FROM chat_messages m
        JOIN target_convs tc ON tc.conv_id = m.conversation_id
        WHERE m.sender_id != p_user_id
          AND m.is_read = FALSE
        GROUP BY m.conversation_id
    )
    SELECT
        tc.conv_id AS conversation_id,
        lm.id AS last_message_id,
        lm.sender_id AS last_message_sender_id,
        lm.content AS last_message_content,
        lm.is_read AS last_message_is_read,
        lm.created_at AS last_message_created_at,
        COALESCE(u.unread_count, 0)::BIGINT AS unread_count
    FROM target_convs tc
    LEFT JOIN last_msgs lm ON lm.conversation_id = tc.conv_id
    LEFT JOIN unreads u ON u.conversation_id = tc.conv_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_conversations_last_and_unread(UUID[], UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_conversations_last_and_unread(UUID[], UUID) TO authenticated, service_role;


-- 3. Atomic Stripe Booking Confirmation RPC (1 RTT)
CREATE OR REPLACE FUNCTION public.confirm_bookings_from_stripe(
    p_booking_ids UUID[],
    p_user_id UUID,
    p_session_id TEXT,
    p_payment_intent_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    status TEXT,
    payment_status TEXT,
    check_in DATE,
    check_out DATE,
    guests INTEGER,
    property_title TEXT,
    service_title TEXT,
    guest_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_unauthorized_count INTEGER;
BEGIN
    -- 1. Ownership check: verify all requested booking IDs belong to p_user_id
    SELECT COUNT(*)
    INTO v_unauthorized_count
    FROM unnest(p_booking_ids) AS bid
    WHERE NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = bid AND b.user_id = p_user_id
    );

    IF v_unauthorized_count > 0 THEN
        RAISE EXCEPTION 'Unauthorized booking IDs in Stripe session for user %', p_user_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Atomic update and joined details return
    RETURN QUERY
    WITH updated AS (
        UPDATE bookings b
        SET
            status = 'confirmed',
            payment_status = 'paid',
            payment_intent_id = COALESCE(p_payment_intent_id, b.payment_intent_id),
            updated_at = NOW()
        WHERE b.id = ANY(p_booking_ids)
          AND b.status = 'pending'
          AND (b.stripe_session_id = p_session_id OR b.stripe_session_id IS NULL)
        RETURNING
            b.id,
            b.status,
            b.payment_status,
            b.check_in,
            b.check_out,
            b.guests,
            b.item_id,
            b.item_type,
            b.user_id
    )
    SELECT
        u.id,
        u.status,
        u.payment_status,
        u.check_in,
        u.check_out,
        u.guests,
        p.title AS property_title,
        s.title AS service_title,
        prof.email AS guest_email
    FROM updated u
    LEFT JOIN properties p ON p.id = u.item_id AND (u.item_type = 'property' OR u.item_type IS NULL)
    LEFT JOIN services s ON s.id = u.item_id AND u.item_type = 'service'
    LEFT JOIN profiles prof ON prof.id = u.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_bookings_from_stripe(UUID[], UUID, TEXT, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.confirm_bookings_from_stripe(UUID[], UUID, TEXT, TEXT) TO authenticated, service_role;
