-- Purpose: Repoint listing_reviews.user_id FK from auth.users → public.profiles
-- PostgREST embedded joins (user:profiles) require a FK within the public schema.
-- profiles.id = auth.users.id (1:1), so cascade behaviour is identical.

ALTER TABLE public.listing_reviews
    DROP CONSTRAINT listing_reviews_user_id_fkey,
    ADD CONSTRAINT listing_reviews_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
