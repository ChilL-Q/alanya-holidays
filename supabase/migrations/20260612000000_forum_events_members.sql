-- Migration: 20260612000000_forum_events_members
-- Purpose: Community events with RSVP, and lightweight member presence
--          (last_seen_at) for the Members "who's online" view.

-- ============================================================
-- 1. forum_events (admin-managed; may be hosted "on behalf" of a member)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.forum_categories(id) ON DELETE SET NULL,
    attendee_count INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_events_slug ON public.forum_events (slug);
CREATE INDEX IF NOT EXISTS idx_forum_events_date ON public.forum_events (event_date) WHERE is_published = true;

DROP TRIGGER IF EXISTS trg_forum_events_updated_at ON public.forum_events;
CREATE TRIGGER trg_forum_events_updated_at
    BEFORE UPDATE ON public.forum_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. forum_event_rsvps (one row per user per event)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_event_rsvps (
    event_id UUID NOT NULL REFERENCES public.forum_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_event_rsvps_event ON public.forum_event_rsvps (event_id);

-- attendee_count sync
CREATE OR REPLACE FUNCTION public.forum_sync_event_attendee_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.forum_events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.forum_events SET attendee_count = GREATEST(attendee_count - 1, 0) WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_event_attendee_count ON public.forum_event_rsvps;
CREATE TRIGGER trg_forum_event_attendee_count
    AFTER INSERT OR DELETE ON public.forum_event_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION public.forum_sync_event_attendee_count();

-- ============================================================
-- 3. Member presence — last_seen_at + heartbeat RPC
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles (last_seen_at DESC);

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles SET last_seen_at = now() WHERE id = (SELECT auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.touch_last_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;

-- ============================================================
-- 4. RLS — forum_events
-- ============================================================
ALTER TABLE public.forum_events ENABLE ROW LEVEL SECURITY;

-- Public reads published events
CREATE POLICY "forum_events_select_public" ON public.forum_events
    FOR SELECT USING (is_published = true);

-- Admins read all (incl. unpublished)
CREATE POLICY "forum_events_select_admin" ON public.forum_events
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- Only admins create/update/delete (host may be any member — "on behalf")
CREATE POLICY "forum_events_insert_admin" ON public.forum_events
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "forum_events_update_admin" ON public.forum_events
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "forum_events_delete_admin" ON public.forum_events
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- 5. RLS — forum_event_rsvps
-- ============================================================
ALTER TABLE public.forum_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_event_rsvps_select" ON public.forum_event_rsvps
    FOR SELECT USING (true);

CREATE POLICY "forum_event_rsvps_insert" ON public.forum_event_rsvps
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "forum_event_rsvps_delete" ON public.forum_event_rsvps
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 6. Seed a few upcoming events (idempotent on slug)
-- ============================================================
INSERT INTO public.forum_events (title, slug, description, location, event_date, image_url, is_published)
VALUES
    ('Digital Nomad Beach Meetup', 'digital-nomad-beach-meetup',
     'Coworking, coffee, and sunset by the sea. Bring your laptop or just come to mingle with fellow remote workers.',
     'Cleopatra Beach', '2026-06-20 17:00:00+03', '/images/home/cleopatra_beach.png', true),
    ('Sunset Boat Tour & BBQ', 'sunset-boat-tour-bbq',
     'A relaxed evening cruise around Alanya castle with a barbecue dinner on board. Limited spots.',
     'Alanya Harbor', '2026-06-25 18:30:00+03', '/images/experiences/water_sports_hero.png', true),
    ('Language Exchange Night', 'language-exchange-night',
     'Practice Turkish, English, Russian and German over drinks. All levels welcome — locals and newcomers alike.',
     'The Local Pub, Alanya', '2026-06-28 20:00:00+03', '/images/home/turkish_cuisine.png', true)
ON CONFLICT (slug) DO NOTHING;
