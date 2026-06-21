-- ============================================================
-- Migration: event RSVP contact number
-- Purpose: let attendees leave a WhatsApp/contact number when they
--          RSVP, so admins can reach them. Stored per-RSVP (not on
--          the profile), since it's the number they want used for
--          this event.
-- ============================================================

ALTER TABLE public.forum_event_rsvps
    ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Existing RLS is unchanged: a user may only insert/delete their own
-- RSVP row (user_id = auth.uid()), and SELECT remains open, so the
-- attendee-count trigger and admin attendee list keep working.

NOTIFY pgrst, 'reload schema';
