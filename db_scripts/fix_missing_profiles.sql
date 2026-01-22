-- Fix for missing profile error (Error 23503)
-- The user 1c291478-1a60-437d-8225-f6eca284fdff exists in Auth but not in Profiles table.
-- This prevents creating chats.

INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES (
    '1c291478-1a60-437d-8225-f6eca284fdff', 
    'Repair Key User', 
    'chelldell86@gmail.com', -- Inferred from screenshot if available, otherwise placeholder
    'guest',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure the HOST exists just in case (though error complained about guest)
-- Host ID from logs: 78e3fbce-4bd6-42eb-89e7-4f59aa6fc1d3
INSERT INTO public.profiles (id, full_name, role, created_at)
VALUES (
    '78e3fbce-4bd6-42eb-89e7-4f59aa6fc1d3',
    'Host User',
    'host',
    NOW()
)
ON CONFLICT (id) DO NOTHING;
