-- Drop unused indexes (idx_scan = 0 in production)
-- These indexes consume space and slow writes without providing read acceleration.
-- Validated via: SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0

-- ===== bookings =====
DROP INDEX IF EXISTS public.idx_bookings_payment_status;
DROP INDEX IF EXISTS public.idx_bookings_payment_method;
DROP INDEX IF EXISTS public.idx_bookings_payment_intent_id;
DROP INDEX IF EXISTS public.idx_bookings_payout_status;
DROP INDEX IF EXISTS public.idx_bookings_payout_due_date;
DROP INDEX IF EXISTS public.idx_bookings_start_date;

-- ===== blog =====
DROP INDEX IF EXISTS public.idx_blog_posts_author_id;
DROP INDEX IF EXISTS public.idx_blog_posts_category_status;
DROP INDEX IF EXISTS public.idx_blog_post_tags_tag_id;
DROP INDEX IF EXISTS public.idx_blog_submissions_user_id;
DROP INDEX IF EXISTS public.idx_blog_tags_name;
DROP INDEX IF EXISTS public.idx_blog_tags_slug;

-- ===== chat =====
DROP INDEX IF EXISTS public.idx_chat_conversations_property_id;
DROP INDEX IF EXISTS public.idx_chat_conversations_host_id;
DROP INDEX IF EXISTS public.idx_chat_messages_sender_id;
DROP INDEX IF EXISTS public.idx_chat_reports_conversation_id;
DROP INDEX IF EXISTS public.idx_chat_reports_reported_id;
DROP INDEX IF EXISTS public.idx_chat_reports_reporter_id;

-- ===== directory_listings =====
DROP INDEX IF EXISTS public.idx_directory_listings_subscription_id;
DROP INDEX IF EXISTS public.idx_directory_listings_net_votes;

-- ===== products =====
DROP INDEX IF EXISTS public.idx_products_seller_id;
DROP INDEX IF EXISTS public.idx_products_created_at;
DROP INDEX IF EXISTS public.idx_products_artisan_id;

-- ===== locations =====
DROP INDEX IF EXISTS public.idx_locations_parent_region;
DROP INDEX IF EXISTS public.idx_locations_active;

-- ===== reviews =====
DROP INDEX IF EXISTS public.idx_reviews_property_id;
DROP INDEX IF EXISTS public.idx_reviews_user_id;

-- ===== notifications =====
DROP INDEX IF EXISTS public.idx_notifications_created_at;

-- ===== audit_logs =====
DROP INDEX IF EXISTS public.idx_audit_logs_user_event;
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;

-- ===== listing_votes =====
DROP INDEX IF EXISTS public.idx_listing_votes_user;

-- ===== forum =====
DROP INDEX IF EXISTS public.idx_forum_posts_slug;
DROP INDEX IF EXISTS public.idx_forum_posts_author;
DROP INDEX IF EXISTS public.idx_forum_posts_created;
DROP INDEX IF EXISTS public.idx_forum_post_likes_user_id;
DROP INDEX IF EXISTS public.idx_forum_comments_author_id;
DROP INDEX IF EXISTS public.idx_forum_comments_post;
DROP INDEX IF EXISTS public.idx_forum_comment_likes_user_id;
DROP INDEX IF EXISTS public.idx_forum_reports_reporter_id;

-- ===== listings & variants =====
DROP INDEX IF EXISTS public.idx_listing_locations_location_id;
DROP INDEX IF EXISTS public.idx_listing_reviews_user_id;
DROP INDEX IF EXISTS public.idx_product_variants_sku;

-- ===== saved_itineraries =====
DROP INDEX IF EXISTS public.idx_saved_itineraries_user_id;

-- ===== tickets =====
DROP INDEX IF EXISTS public.idx_tickets_user_id;
DROP INDEX IF EXISTS public.idx_tickets_created_at;

-- ===== service_edits =====
DROP INDEX IF EXISTS public.idx_service_edits_service_id;
DROP INDEX IF EXISTS public.idx_service_edits_status;

-- ===== premium_subscriptions =====
DROP INDEX IF EXISTS public.idx_premium_subscriptions_status_period;

-- ===== listing_analytics =====
-- Note: listing_analytics_pkey is unused but is PRIMARY KEY — must keep for data integrity
-- DROP INDEX IF EXISTS public.listing_analytics_pkey;  -- KEEP: PK constraint
