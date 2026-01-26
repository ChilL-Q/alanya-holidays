-- RPC function to get available properties
-- Returns properties that DO NOT have any 'booked' or 'blocked' status in the given range
CREATE OR REPLACE FUNCTION get_available_properties(
  check_in_date date,
  check_out_date date
)
RETURNS SETOF properties
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM properties p
  WHERE status = 'approved' -- Ensure we only show approved properties
  AND NOT EXISTS (
    SELECT 1 FROM property_availability pa
    WHERE pa.property_id = p.id
    AND pa.date >= check_in_date
    AND pa.date < check_out_date -- Checkout date is usually free for next guest
    AND pa.status IN ('booked', 'blocked')
  );
END;
$$;
