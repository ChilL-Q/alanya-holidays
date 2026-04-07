-- ============================================================================
-- [41] Duplicate index — drop bookings_stripe_session_id_idx
-- [40] Unindexed FK — add index on chat_conversations(host_id)
-- [39] Unused indexes — drop redundant single-column indexes covered by compounds
-- ============================================================================

-- [41] Drop exact duplicate
DROP INDEX IF EXISTS bookings_stripe_session_id_idx;

-- [40] Add missing FK index
CREATE INDEX IF NOT EXISTS idx_chat_conversations_host_id ON chat_conversations (host_id);

-- [39] Drop redundant single-column indexes covered by compound indexes
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_user_status_date;
DROP INDEX IF EXISTS idx_bookings_status_start_date;
DROP INDEX IF EXISTS idx_properties_host_id;
DROP INDEX IF EXISTS idx_properties_status;
DROP INDEX IF EXISTS idx_properties_status_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_user_read_created;
DROP INDEX IF EXISTS idx_services_provider_id;
DROP INDEX IF EXISTS idx_services_provider_status;
DROP INDEX IF EXISTS idx_service_edits_service_id;
DROP INDEX IF EXISTS idx_service_edits_service_status;
DROP INDEX IF EXISTS idx_reviews_property_id;
DROP INDEX IF EXISTS idx_reviews_property_date;
DROP INDEX IF EXISTS idx_reviews_created_at;
DROP INDEX IF EXISTS idx_chat_reports_status;
DROP INDEX IF EXISTS idx_chat_reports_reporter_id;
DROP INDEX IF EXISTS idx_chat_reports_reported_id;
DROP INDEX IF EXISTS idx_chat_reports_conversation_id;
DROP INDEX IF EXISTS idx_tickets_user_id;
DROP INDEX IF EXISTS idx_tickets_status;
DROP INDEX IF EXISTS idx_tickets_user_status;
DROP INDEX IF EXISTS idx_chat_messages_is_read;
DROP INDEX IF EXISTS idx_messages_is_read;
DROP INDEX IF EXISTS idx_property_availability_status;
DROP INDEX IF EXISTS idx_directory_listings_is_featured;
DROP INDEX IF EXISTS idx_directory_listings_is_verified;
DROP INDEX IF EXISTS idx_products_artisan_id;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;
DROP INDEX IF EXISTS idx_chat_conversations_property_id;
