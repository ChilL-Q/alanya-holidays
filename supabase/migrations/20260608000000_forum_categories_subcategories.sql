-- Migration: 20260608000000_forum_categories_subcategories
-- Purpose: Turn the flat forum taxonomy into a two-level structure
--          (category → subcategory), add visual metadata for the redesigned
--          forum landing, a post view counter, and re-seed the 10 reference
--          categories with their subcategories.

-- ============================================================
-- 1. Schema: forum_categories visual + nesting columns
-- ============================================================
ALTER TABLE public.forum_categories
    ADD COLUMN IF NOT EXISTS parent_id UUID,
    ADD COLUMN IF NOT EXISTS icon TEXT,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS accent TEXT;

-- Self-referential FK (named explicitly so PostgREST can embed parent/children)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forum_categories_parent_id_fkey'
    ) THEN
        ALTER TABLE public.forum_categories
            ADD CONSTRAINT forum_categories_parent_id_fkey
            FOREIGN KEY (parent_id) REFERENCES public.forum_categories(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_forum_categories_parent ON public.forum_categories (parent_id);

-- ============================================================
-- 2. Schema: forum_posts view counter
-- ============================================================
ALTER TABLE public.forum_posts
    ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- ============================================================
-- 3. Drop the obsolete default seed categories
--    (no real posts reference them yet; category_id is ON DELETE SET NULL)
--    'real-estate' is kept and repurposed via the upsert below.
-- ============================================================
DELETE FROM public.forum_categories
WHERE parent_id IS NULL AND slug IN ('general', 'living', 'events', 'recommendations');

-- ============================================================
-- 4. Seed top-level categories (idempotent upsert by slug)
-- ============================================================
INSERT INTO public.forum_categories (name, slug, description, icon, image_url, accent, sort_order, parent_id)
VALUES
    ('Travel & Vacation Planning', 'travel-vacation', 'Plan the perfect Alanya trip — flights, hotels, itineraries and budgets.', 'Plane',            NULL,                                  'sky',     0, NULL),
    ('Beaches & Nature',           'beaches-nature',  'Cleopatra Beach, hidden coves, waterfalls and the great outdoors.',        'Waves',            '/images/home/cleopatra_beach.png',    'cyan',    1, NULL),
    ('Food & Nightlife',           'food-nightlife',  'Turkish breakfast, restaurants, bars and where to go after dark.',         'UtensilsCrossed',  '/images/home/turkish_cuisine.png',    'orange',  2, NULL),
    ('Things to Do',               'things-to-do',    'Boat tours, the castle, water sports and unforgettable day trips.',        'Compass',          NULL,                                  'emerald', 3, NULL),
    ('Expats & Digital Nomads',    'expats-nomads',   'Residence permits, cost of living, coworking and settling in.',           'Laptop',           '/images/home/alanya_castle.png',      'violet',  4, NULL),
    ('Real Estate & Investment',   'real-estate',     'Buying, renting, investment returns and the legal paperwork.',            'Building2',        NULL,                                    'blue',  5, NULL),
    ('Local Life & Culture',       'local-culture',   'Language, traditions, bazaars and everyday life in Alanya.',              'Landmark',         NULL,                                  'amber',   6, NULL),
    ('Events & Meetups',           'events-meetups',  'Socials, festivals, sports and language exchange nights.',                'CalendarDays',     '/images/experiences/water_sports_hero.png', 'rose', 7, NULL),
    ('Marketplace',                'marketplace',     'Buy and sell, housing, jobs and community classifieds.',                  'ShoppingBag',      '/images/alanya-bazaar-hero.png',      'teal',    8, NULL),
    ('Support & Help',             'support-help',    'New here? Ask anything — safety, emergencies and forum help.',            'LifeBuoy',         NULL,                                  'indigo',  9, NULL)
ON CONFLICT (slug) DO UPDATE SET
    name       = EXCLUDED.name,
    description= EXCLUDED.description,
    icon       = EXCLUDED.icon,
    image_url  = EXCLUDED.image_url,
    accent     = EXCLUDED.accent,
    sort_order = EXCLUDED.sort_order,
    parent_id  = NULL;

-- ============================================================
-- 5. Seed subcategories (idempotent upsert; parent resolved by slug)
-- ============================================================
INSERT INTO public.forum_categories (name, slug, parent_id, sort_order)
SELECT v.name, v.slug, p.id, v.sort_order
FROM (VALUES
    -- Travel & Vacation Planning
    ('Flights & Airport Transfers', 'travel-flights',      'travel-vacation', 0),
    ('Hotels & Where to Stay',      'travel-hotels',       'travel-vacation', 1),
    ('Trip Itineraries',            'travel-itineraries',  'travel-vacation', 2),
    ('Best Time to Visit',          'travel-best-time',    'travel-vacation', 3),
    ('First-Time Visitors',         'travel-first-time',   'travel-vacation', 4),
    ('Budgeting & Costs',           'travel-budget',       'travel-vacation', 5),
    -- Beaches & Nature
    ('Cleopatra Beach',             'beaches-cleopatra',   'beaches-nature',  0),
    ('Hidden Coves & Quiet Beaches','beaches-hidden',      'beaches-nature',  1),
    ('Dim River & Nature',          'beaches-dim-river',   'beaches-nature',  2),
    ('Waterfalls & Hiking',         'beaches-hiking',      'beaches-nature',  3),
    ('Beach Clubs',                 'beaches-clubs',       'beaches-nature',  4),
    -- Food & Nightlife
    ('Turkish Breakfast',           'food-breakfast',      'food-nightlife',  0),
    ('Restaurants & Local Eats',    'food-restaurants',    'food-nightlife',  1),
    ('Bars & Nightlife',            'food-bars',           'food-nightlife',  2),
    ('Cafés & Desserts',            'food-cafes',          'food-nightlife',  3),
    ('Street Food',                 'food-street',         'food-nightlife',  4),
    -- Things to Do
    ('Boat Tours',                  'things-boat-tours',   'things-to-do',    0),
    ('Alanya Castle & History',     'things-castle',       'things-to-do',    1),
    ('Water Sports',                'things-water-sports', 'things-to-do',    2),
    ('Day Trips & Excursions',      'things-day-trips',    'things-to-do',    3),
    ('Family Activities',           'things-family',       'things-to-do',    4),
    -- Expats & Digital Nomads
    ('Residence Permits',           'expats-permits',      'expats-nomads',   0),
    ('Cost of Living',              'expats-cost-of-living','expats-nomads',   1),
    ('Coworking & Internet',        'expats-coworking',    'expats-nomads',   2),
    ('Banking & Taxes',             'expats-banking',      'expats-nomads',   3),
    ('Meeting People',              'expats-community',    'expats-nomads',   4),
    ('Healthcare',                  'expats-healthcare',   'expats-nomads',   5),
    -- Real Estate & Investment
    ('Buying Property',             'realestate-buying',   'real-estate',     0),
    ('Renting',                     'realestate-renting',  'real-estate',     1),
    ('Investment & ROI',            'realestate-investment','real-estate',    2),
    ('Legal & Paperwork',           'realestate-legal',    'real-estate',     3),
    ('Neighborhood Guides',         'realestate-areas',    'real-estate',     4),
    -- Local Life & Culture
    ('Turkish Language',            'culture-language',    'local-culture',   0),
    ('Traditions & Etiquette',      'culture-traditions',  'local-culture',   1),
    ('Shopping & Bazaars',          'culture-bazaars',     'local-culture',   2),
    ('Local News',                  'culture-news',        'local-culture',   3),
    -- Events & Meetups
    ('Meetups & Socials',           'events-social',       'events-meetups',  0),
    ('Festivals',                   'events-festivals',    'events-meetups',  1),
    ('Sports & Fitness',            'events-sports',       'events-meetups',  2),
    ('Language Exchange',           'events-language',     'events-meetups',  3),
    -- Marketplace
    ('Buy & Sell',                  'market-buy-sell',     'marketplace',     0),
    ('Housing & Rentals',           'market-housing',      'marketplace',     1),
    ('Jobs & Services',             'market-jobs',         'marketplace',     2),
    ('Free Stuff',                  'market-free',         'marketplace',     3),
    -- Support & Help
    ('New Member Questions',        'support-newbie',      'support-help',    0),
    ('Emergencies & Safety',        'support-safety',      'support-help',    1),
    ('Forum Help',                  'support-forum',       'support-help',    2)
) AS v(name, slug, parent_slug, sort_order)
JOIN public.forum_categories p ON p.slug = v.parent_slug AND p.parent_id IS NULL
ON CONFLICT (slug) DO UPDATE SET
    name       = EXCLUDED.name,
    parent_id  = EXCLUDED.parent_id,
    sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 6. RPC: increment a post's view counter (callable by anon)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_forum_post_view(p_post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.forum_posts
    SET view_count = view_count + 1
    WHERE id = p_post_id AND is_removed = false;
$$;

GRANT EXECUTE ON FUNCTION public.increment_forum_post_view(UUID) TO anon, authenticated;
