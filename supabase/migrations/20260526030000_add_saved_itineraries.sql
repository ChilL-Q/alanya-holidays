-- Purpose: Persistent saved itineraries for AI-001 save+share+map feature

CREATE TABLE public.saved_itineraries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    params      JSONB NOT NULL DEFAULT '{}',
    itinerary   JSONB NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_itineraries ENABLE ROW LEVEL SECURITY;

-- Owner has full access
CREATE POLICY "owner_all" ON public.saved_itineraries
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Anyone can read by ID (UUID is unguessable, travel data is non-sensitive)
CREATE POLICY "public_read" ON public.saved_itineraries
    FOR SELECT USING (true);

CREATE INDEX idx_saved_itineraries_user_id ON public.saved_itineraries(user_id);
