-- Restrict privileged SECURITY DEFINER functions to trusted backend callers.
-- The NestJS repositories invoke these functions with the service-role client.

REVOKE EXECUTE ON FUNCTION public.transition_booking_status(UUID, TEXT, UUID, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_bookings_from_stripe(UUID[], UUID, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_conversations_last_and_unread(UUID[], UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_platform_analytics(INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_forum_rate_limit(UUID, TEXT, INTEGER) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.transition_booking_status(UUID, TEXT, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_bookings_from_stripe(UUID[], UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_conversations_last_and_unread(UUID[], UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_forum_rate_limit(UUID, TEXT, INTEGER) TO service_role;
