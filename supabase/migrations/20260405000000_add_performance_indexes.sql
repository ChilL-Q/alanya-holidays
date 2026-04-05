-- Add missing indexes for query performance
-- Migration date: 2026-04-05
-- Safe to run multiple times — idempotent (CREATE INDEX IF NOT EXISTS)
-- Note: Use `CREATE INDEX CONCURRENTLY` for live production databases to avoid table locks.

-----------------------------------------------------------------------
-- Foreign key indexes
-----------------------------------------------------------------------

-- bookings.user_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_bookings_user_id
    ON public.bookings(user_id);

-- properties.host_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_properties_host_id
    ON public.properties(host_id);

-- services.provider_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_services_provider_id
    ON public.services(provider_id);

-- reviews.user_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_reviews_user_id
    ON public.reviews(user_id);

-- reviews.property_id -> properties.id
CREATE INDEX IF NOT EXISTS idx_reviews_property_id
    ON public.reviews(property_id);

-- products.seller_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_products_seller_id
    ON public.products(seller_id);

-- products.artisan_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_products_artisan_id
    ON public.products(artisan_id);

-- audit_logs.user_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON public.audit_logs(user_id);

-- notifications.user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON public.notifications(user_id);

-- tickets.user_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_tickets_user_id
    ON public.tickets(user_id);

-- chat_reports.reporter_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_chat_reports_reporter_id
    ON public.chat_reports(reporter_id);

-- chat_reports.reported_id -> profiles.id
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported_id
    ON public.chat_reports(reported_id);

-- chat_reports.conversation_id -> chat_conversations.id
CREATE INDEX IF NOT EXISTS idx_chat_reports_conversation_id
    ON public.chat_reports(conversation_id);

-- chat_messages.sender_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id
    ON public.chat_messages(sender_id);

-- service_edits.service_id -> services.id
CREATE INDEX IF NOT EXISTS idx_service_edits_service_id
    ON public.service_edits(service_id);

-- chat_conversations.property_id -> properties.id
CREATE INDEX IF NOT EXISTS idx_chat_conversations_property_id
    ON public.chat_conversations(property_id);

-----------------------------------------------------------------------
-- Status and boolean column indexes
-----------------------------------------------------------------------

-- bookings.status
CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON public.bookings(status);

-- properties.status (used by RLS policy for approved properties)
CREATE INDEX IF NOT EXISTS idx_properties_status
    ON public.properties(status);

-- service_edits.status
CREATE INDEX IF NOT EXISTS idx_service_edits_status
    ON public.service_edits(status);

-- chat_reports.status
CREATE INDEX IF NOT EXISTS idx_chat_reports_status
    ON public.chat_reports(status);

-- tickets.status
CREATE INDEX IF NOT EXISTS idx_tickets_status
    ON public.tickets(status);

-- notifications.read (frequently queried for unread count/fetch)
CREATE INDEX IF NOT EXISTS idx_notifications_read
    ON public.notifications(read);

-- messages.is_read
CREATE INDEX IF NOT EXISTS idx_messages_is_read
    ON public.messages(is_read);

-- chat_messages.is_read
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read
    ON public.chat_messages(is_read);

-- property_availability.status
CREATE INDEX IF NOT EXISTS idx_property_availability_status
    ON public.property_availability(status);

-- directory_listings.is_featured
CREATE INDEX IF NOT EXISTS idx_directory_listings_is_featured
    ON public.directory_listings(is_featured) WHERE is_featured = true;

-- directory_listings.is_verified
CREATE INDEX IF NOT EXISTS idx_directory_listings_is_verified
    ON public.directory_listings(is_verified) WHERE is_verified = true;

-----------------------------------------------------------------------
-- Date column indexes
-----------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_bookings_created_at
    ON public.bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at
    ON public.reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_created_at
    ON public.properties(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_services_created_at
    ON public.services(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_created_at
    ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_created_at
    ON public.favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
    ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_created_at
    ON public.tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_start_date
    ON public.bookings(start_date);

CREATE INDEX IF NOT EXISTS idx_directory_listings_created_at
    ON public.directory_listings(created_at DESC);

-----------------------------------------------------------------------
-- Composite indexes for common query patterns
-----------------------------------------------------------------------

-- User's bookings filtered by status (e.g., "my upcoming confirmed bookings")
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_date
    ON public.bookings(user_id, status, start_date DESC);

-- Active/recent bookings for admin dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_status_start_date
    ON public.bookings(status, start_date DESC);

-- Host's properties with status filter
CREATE INDEX IF NOT EXISTS idx_properties_host_status
    ON public.properties(host_id, status);

-- Approved properties listing (used in RLS policy + public listing query)
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at
    ON public.properties(status, created_at DESC);

-- Reviews for a property, ordered by date
CREATE INDEX IF NOT EXISTS idx_reviews_property_date
    ON public.reviews(property_id, created_at DESC);

-- User's notification feed
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
    ON public.notifications(user_id, created_at DESC);

-- Unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
    ON public.notifications(user_id, read, created_at DESC) WHERE read = false;

-- Provider's services with status
CREATE INDEX IF NOT EXISTS idx_services_provider_status
    ON public.services(provider_id, status);

-- Service edits lookup with status
CREATE INDEX IF NOT EXISTS idx_service_edits_service_status
    ON public.service_edits(service_id, status);

-- Booking lookup by item type and item (for host checking bookings of their properties/services)
CREATE INDEX IF NOT EXISTS idx_bookings_item_type_id
    ON public.bookings(item_type, item_id);

-- User's favorites list
CREATE INDEX IF NOT EXISTS idx_favorites_user_date
    ON public.favorites(user_id, created_at DESC);

-- Audit log lookup by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_event
    ON public.audit_logs(user_id, event_type);

-- User tickets with status
CREATE INDEX IF NOT EXISTS idx_tickets_user_status
    ON public.tickets(user_id, status);

-- Directory listings by category
CREATE INDEX IF NOT EXISTS idx_directory_listings_category
    ON public.directory_listings(category_id);

-- Directory listings by category with featured first
CREATE INDEX IF NOT EXISTS idx_directory_listings_category_featured
    ON public.directory_listings(category_id, is_featured DESC);

-- Property availability by property and status (for availability checks)
CREATE INDEX IF NOT EXISTS idx_property_availability_property_date_status
    ON public.property_availability(property_id, date, status);
