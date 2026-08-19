-- Purpose: Optimize search, filtering, and foreign key lookup performance
-- Audit date: 2026-07-31

-- 1. Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_status_location ON public.properties(status, location);
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- 2. Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

