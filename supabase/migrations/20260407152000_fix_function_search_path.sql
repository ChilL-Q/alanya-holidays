-- [42] Set immutable search_path on all functions to prevent search_path injection
-- Without SET search_path, a malicious user could create objects in a different schema
-- that shadow public schema functions used inside SECURITY DEFINER functions.
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

ALTER FUNCTION public.is_admin()
  SET search_path = public;

ALTER FUNCTION public.update_property_rating()
  SET search_path = public;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

ALTER FUNCTION public.cancel_expired_bookings()
  SET search_path = public;

ALTER FUNCTION public.get_available_properties(date, date)
  SET search_path = public;

ALTER FUNCTION public.handle_new_chat_message()
  SET search_path = public;

ALTER FUNCTION public.get_property_by_ref_id(integer)
  SET search_path = public;

-- create_booking has two overloads
ALTER FUNCTION public.create_booking(uuid, uuid, date, date, numeric, integer, text, text)
  SET search_path = public;

ALTER FUNCTION public.create_booking(uuid, uuid, date, date, numeric, integer, text, text, text)
  SET search_path = public;
