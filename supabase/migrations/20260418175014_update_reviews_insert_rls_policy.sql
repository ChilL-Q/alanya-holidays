-- Update RLS policy for reviews_insert to include booking verification
-- Migration date: 2026-04-18

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;

-- Create new policy with booking verification
CREATE POLICY "reviews_insert_with_booking_check" ON public.reviews
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE user_id = (SELECT auth.uid())
      AND item_id = reviews.property_id
      AND item_type = 'property'
      AND status IN ('confirmed', 'completed')
      -- Optionally, also check if check_out date is in the past to ensure review for completed stays
      -- AND check_out < NOW()
    )
  );

-- Also, re-enable RLS on the table, just in case
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
