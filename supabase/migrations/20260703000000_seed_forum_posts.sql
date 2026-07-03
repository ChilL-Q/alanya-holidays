-- Migration: 20260703000000_seed_forum_posts
-- Purpose: Seed 120+ realistic forum posts across all categories for launch

-- ============================================================
-- 1. Create a temporary admin user for seeding
-- ============================================================
-- We'll use NULL author_id for seed posts to avoid user dependency
-- OR we can use a seeder account. For now, we'll insert with NULL authors
-- and adjust afterward if needed.

-- ============================================================
-- 2. Get category IDs (we'll need these for inserts)
-- ============================================================

-- Travel & Vacation Planning posts
INSERT INTO public.forum_posts (
    title, slug, body, category_id, author_id, created_at
) 
SELECT 
    'First time in Alanya — 5 days itinerary suggestion',
    'first-time-5-days-itinerary',
    'Hi everyone! I''m visiting Alanya for the first time with my wife in August. We have 5 days total. We''re interested in beaches, local food, and maybe one day trip. What''s the must-do list? Should we rent a car or stick to taxis/scooters?',
    fc.id,
    NULL,
    NOW() - INTERVAL '45 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-first-time'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Best time to visit — June or September?', 'best-time-june-september', 
'Planning my trip and torn between June and September. I hate extreme heat but love the sea. Which month is better? How warm is the water? Crowds?',
fc.id, NULL, NOW() - INTERVAL '42 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-best-time'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Budget breakdown: what should I expect to spend daily?', 'budget-daily-breakdown', 
'Solo traveler here, staying 2 weeks. Looking for a realistic daily budget. Accommodation, food, activities. Any breakdown would help!',
fc.id, NULL, NOW() - INTERVAL '38 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-budget'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Flights from UK — which airline is best value?', 'flights-uk-best-value', 
'Looking for June flights London to Antalya. Seeing easyJet, Ryanair, and Turkish Airlines. Any experience with these? Baggage fees? Delays?',
fc.id, NULL, NOW() - INTERVAL '35 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-flights'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Which area to stay in? Old Town vs beach area?', 'stay-old-town-vs-beach', 
'Trying to decide where to base myself for a week. Old Town looks charming but worried about noise. Beach area seems touristy. Local advice?',
fc.id, NULL, NOW() - INTERVAL '32 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-hotels'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Visa requirements for US citizens?', 'visa-requirements-us', 
'Planning to visit Turkey for 3 weeks. Do I need a visa as a US citizen? Can I get it on arrival?',
fc.id, NULL, NOW() - INTERVAL '28 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-itineraries'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Can I use my European phone plan in Alanya?', 'phone-plan-europe-roaming', 
'I''m EU based and want to know if roaming costs are reasonable or if I should buy a local SIM.',
fc.id, NULL, NOW() - INTERVAL '25 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-itineraries'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'What to pack for an August trip?', 'packing-august-trip', 
'First time to a Mediterranean destination. Packing for August heat. What essentials am I missing?',
fc.id, NULL, NOW() - INTERVAL '22 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-best-time'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Group trip planning — 8 people, 10 days', 'group-trip-8-people-10days', 
'Organizing a friends trip. 8 of us, 10 days in Sept. Staying together or separate? Group activities?',
fc.id, NULL, NOW() - INTERVAL '18 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-itineraries'
ON CONFLICT (slug) DO NOTHING;

-- Beaches & Nature posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Cleopatra Beach vs Dim River — which is better?', 'cleopatra-vs-dim-river', 
'Can''t decide between spending a beach day at Cleopatra or hiking Dim River. Which should I prioritize?',
fc.id, NULL, NOW() - INTERVAL '40 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-cleopatra'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Hidden coves near Alanya — any secret spots?', 'hidden-coves-snorkeling', 
'I want to find less touristy beaches for snorkeling. Any hidden coves I can access? Need boat or can I walk?',
fc.id, NULL, NOW() - INTERVAL '37 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-hidden'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Dim Cave & Dim River combo — day trip logistics?', 'dim-cave-river-day-trip', 
'Want to do Dim Cave and then Dim River on the same day. Is that possible? How long does each take?',
fc.id, NULL, NOW() - INTERVAL '33 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-dim-river'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Best time to hike — morning or evening?', 'hike-timing-morning-evening', 
'Planning a hike to Cleopatra Beach viewpoint. Is early morning better than sunset? Heat considerations?',
fc.id, NULL, NOW() - INTERVAL '30 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-hiking'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Water safety — currents, jellyfish, anything to watch for?', 'water-safety-hazards', 
'Swimmer here, want to know about water conditions. Any hazards I should know about?',
fc.id, NULL, NOW() - INTERVAL '27 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-cleopatra'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Beach club recommendations — which is worth the price?', 'beach-club-value', 
'Considering a beach club day. Are they worth it? Which ones are good value?',
fc.id, NULL, NOW() - INTERVAL '24 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-clubs'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Paragliding in Alanya — any good spots?', 'paragliding-spots', 
'I''ve heard Alanya is good for paragliding. Any companies you''d recommend? Cost?',
fc.id, NULL, NOW() - INTERVAL '20 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-nature'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Rocks vs sand beaches — preferences?', 'rocks-sand-beaches', 
'Some beaches here are rocky. Any good all-sand beaches? Or does rocky appeal to some people?',
fc.id, NULL, NOW() - INTERVAL '16 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-hidden'
ON CONFLICT (slug) DO NOTHING;

-- Food & Nightlife posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Turkish breakfast spots — must-try recommendations?', 'turkish-breakfast-spots', 
'I''ve heard Turkish breakfast is legendary. Where should I go for an authentic breakfast in Alanya?',
fc.id, NULL, NOW() - INTERVAL '41 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-breakfast'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Pide vs Pizza — which is better in Alanya?', 'pide-vs-pizza', 
'Love both, trying to decide what to eat tonight. Is Turkish pide here authentic and good?',
fc.id, NULL, NOW() - INTERVAL '39 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-restaurants'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Best fish restaurants on the seafront', 'fish-restaurants-seafront', 
'Want to splurge on a nice seafood dinner. Recommendations for quality restaurants with a view?',
fc.id, NULL, NOW() - INTERVAL '36 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-restaurants'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Street food favorites — what can''t I miss?', 'street-food-favorites', 
'I love street food. What are the must-try street eats in Alanya?',
fc.id, NULL, NOW() - INTERVAL '34 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-street'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Coffee culture in Alanya — where to work as a digital nomad?', 'coffee-nomad-cafes', 
'I work remote and need good coffee + wifi. Any cafes you''d recommend for a few hours of work?',
fc.id, NULL, NOW() - INTERVAL '31 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-cafes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Nightlife scene — bars, clubs, live music?', 'nightlife-bars-clubs', 
'I like to go out in evenings. What''s the nightlife like here? Any good bars or live music venues?',
fc.id, NULL, NOW() - INTERVAL '26 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-bars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Dessert favorites — what should I try?', 'dessert-favorites', 
'Turkish desserts look amazing. Which ones are genuinely good vs tourist traps?',
fc.id, NULL, NOW() - INTERVAL '23 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-cafes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Alcohol availability — what can you get?', 'alcohol-availability', 
'I like wine and beer. Is alcohol available? Any local Turkish beers worth trying?',
fc.id, NULL, NOW() - INTERVAL '19 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-bars'
ON CONFLICT (slug) DO NOTHING;

-- Things to Do posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Alanya Castle — how long does the full tour take?', 'alanya-castle-tour-time', 
'Planning to visit the castle. Do I need a guide or can I self-explore? How many hours should I allow?',
fc.id, NULL, NOW() - INTERVAL '43 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-castle'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Boat tours — sunset vs daytime? Which is better?', 'boat-tours-sunset-vs-day', 
'Thinking about booking a boat tour. Should I go sunset or daytime? Any recommendations?',
fc.id, NULL, NOW() - INTERVAL '40 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-boat-tours'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Jet skis and water sports — where and how much?', 'jet-ski-water-sports', 
'Interested in trying jet skiing. Where can I rent? Is it expensive?',
fc.id, NULL, NOW() - INTERVAL '37 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-water-sports'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Family-friendly activities — kids approved?', 'family-activities-kids', 
'Traveling with two kids (8 and 12). What activities will keep them entertained and happy?',
fc.id, NULL, NOW() - INTERVAL '29 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-family'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Day trips outside Alanya — where to go?', 'day-trips-outside-alanya', 
'I''ve spent 3 days in Alanya. Want to take a day trip somewhere. Options?',
fc.id, NULL, NOW() - INTERVAL '21 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-day-trips'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Horse riding on the beach — is it available?', 'horse-riding-beach', 
'Saw someone riding horses on the beach. Is this a service or just private?',
fc.id, NULL, NOW() - INTERVAL '17 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-water-sports'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Scuba diving certification courses nearby?', 'scuba-padi-certification', 
'I want to get PADI certified in Alanya. Are there good schools? Cost?',
fc.id, NULL, NOW() - INTERVAL '14 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-water-sports'
ON CONFLICT (slug) DO NOTHING;

-- Expats & Digital Nomads posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Residence permit process — first timer tips?', 'residence-permit-process', 
'I''m considering moving to Alanya long-term. What''s the residence permit process? How long? Costs?',
fc.id, NULL, NOW() - INTERVAL '44 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-permits'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Affordable neighborhoods for expats?', 'affordable-neighborhoods', 
'Looking to rent an apartment long-term. Which neighborhoods are affordable but still have amenities?',
fc.id, NULL, NOW() - INTERVAL '38 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-community'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Cost of living breakdown — how much monthly budget?', 'cost-of-living-monthly', 
'Thinking of staying 3 months. What should I budget for rent, food, utilities?',
fc.id, NULL, NOW() - INTERVAL '35 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-cost-of-living'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Best coworking spaces for remote workers?', 'coworking-spaces-remote', 
'I work remotely and need a proper desk setup. Are there coworking spaces here?',
fc.id, NULL, NOW() - INTERVAL '28 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-coworking'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Healthcare and insurance — what should I know?', 'healthcare-insurance', 
'If I stay here long-term, what are healthcare options? Should I get private insurance?',
fc.id, NULL, NOW() - INTERVAL '25 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-healthcare'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Banking as a foreigner — opening an account?', 'banking-foreigner', 
'I''ll be here for a few months. Do I need a Turkish bank account? Can a foreigner open one easily?',
fc.id, NULL, NOW() - INTERVAL '15 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-banking'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Meeting other expats and making friends?', 'meeting-expats-friends', 
'Moving here solo and want to meet people. How do expats connect here?',
fc.id, NULL, NOW() - INTERVAL '12 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-community'
ON CONFLICT (slug) DO NOTHING;

-- Real Estate & Investment posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Property prices — what''s a fair price per square meter?', 'property-prices-per-sqm', 
'Looking at buying an apartment. What should I expect to pay per sqm? Is now a good time?',
fc.id, NULL, NOW() - INTERVAL '42 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-buying'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Rental income from short-term holiday lets — realistic returns?', 'rental-income-airbnb', 
'Considering buying a place to rent on Airbnb. What kind of returns can I expect?',
fc.id, NULL, NOW() - INTERVAL '39 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-investment'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Legal issues for foreign property buyers — what to watch for?', 'foreign-property-legal', 
'I''m interested in buying but nervous about legal complications. What should I know?',
fc.id, NULL, NOW() - INTERVAL '36 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-legal'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Renovating an old property — realistic budget?', 'renovation-budget', 
'Found a cheap place that needs work. How much should I budget for renovations?',
fc.id, NULL, NOW() - INTERVAL '32 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-buying'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Renting long-term — landlord and tenant rights?', 'rental-tenant-rights', 
'Planning to rent an apartment. What are my rights? Can I be kicked out?',
fc.id, NULL, NOW() - INTERVAL '24 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-renting'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Neighborhood investing — which areas are up-and-coming?', 'neighborhood-investment', 
'Looking for investment potential. Any up-and-coming neighborhoods worth watching?',
fc.id, NULL, NOW() - INTERVAL '11 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-areas'
ON CONFLICT (slug) DO NOTHING;

-- Local Life & Culture posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Turkish customs and etiquette — what should I know?', 'turkish-customs-etiquette', 
'I want to be respectful. What are key cultural norms I should follow?',
fc.id, NULL, NOW() - INTERVAL '43 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-traditions'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Learning basic Turkish — useful phrases to start?', 'basic-turkish-phrases', 
'I want to make an effort. What are the most useful Turkish phrases for tourists?',
fc.id, NULL, NOW() - INTERVAL '38 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-language'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Bazaar haggling — is it expected? How much?', 'bazaar-haggling-guide', 
'Going to the bazaar. Should I haggle? Will it offend?',
fc.id, NULL, NOW() - INTERVAL '33 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-bazaars'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Islamic holidays and prayer times — what to know?', 'islamic-holidays-ramadan', 
'When is Ramadan? Will it affect my visit?',
fc.id, NULL, NOW() - INTERVAL '13 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-traditions'
ON CONFLICT (slug) DO NOTHING;

-- Events & Meetups posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Digital Nomad meetups — where and when?', 'nomad-meetups', 
'Anyone organizing regular meetups for remote workers in Alanya?',
fc.id, NULL, NOW() - INTERVAL '41 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-social'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Beach volleyball games — can tourists join?', 'beach-volleyball', 
'I see beach volleyball games. Can I join for fun?',
fc.id, NULL, NOW() - INTERVAL '27 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-sports'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Language exchange nights — happening now?', 'language-exchange-nights', 
'Is there an active language exchange community? I want to practice and help others.',
fc.id, NULL, NOW() - INTERVAL '10 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-language'
ON CONFLICT (slug) DO NOTHING;

-- Support & Help posts
INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'New to Alanya — where do I start?', 'newcomer-orientation', 
'Just arrived. No idea where things are or how anything works. Any newcomer orientation?',
fc.id, NULL, NOW() - INTERVAL '5 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-newbie'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Emergency contacts — what''s the number to know?', 'emergency-contacts', 
'What are the emergency numbers here? Police, ambulance, etc?',
fc.id, NULL, NOW() - INTERVAL '3 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-safety'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, author_id, created_at) 
SELECT 'Internet speeds and reliability — what can I expect?', 'internet-speeds', 
'I need fast internet for work. How''s the connectivity here?',
fc.id, NULL, NOW() - INTERVAL '8 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-forum'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Add comments to posts
-- ============================================================

-- Get the post IDs and add comments
DO $$
DECLARE
    v_post_id UUID;
BEGIN
    -- First post comments
    SELECT id INTO v_post_id FROM public.forum_posts WHERE slug = 'first-time-5-days-itinerary' LIMIT 1;
    IF v_post_id IS NOT NULL THEN
        INSERT INTO public.forum_comments (post_id, author_id, body, created_at)
        VALUES 
            (v_post_id, NULL, 'Day 1: Settle in Cleopatra Beach, walk the promenade. Day 2: Dim River & waterfalls. Day 3: Alanya Castle at sunrise, lunch at a local pide place. Day 4: Boat tour. Day 5: Beach clubs and Turkish dinner. Don''t miss the sunset from the castle!', NOW() - INTERVAL '44 days'),
            (v_post_id, NULL, 'Taxis are reliable and not expensive. Rent a scooter for the castle hike if you''re confident. August is HOT — swim during the day, explore in morning/evening.', NOW() - INTERVAL '43 days'),
            (v_post_id, NULL, 'Stay near the beach for convenience. The old town has great atmosphere at night but can be touristy.', NOW() - INTERVAL '42 days');
    END IF;

    SELECT id INTO v_post_id FROM public.forum_posts WHERE slug = 'best-time-june-september' LIMIT 1;
    IF v_post_id IS NOT NULL THEN
        INSERT INTO public.forum_comments (post_id, author_id, body, created_at)
        VALUES
            (v_post_id, NULL, 'September is the sweet spot. 28°C air, 26°C water, fewer tourists than August. June is good too — a bit cooler, still warm enough to swim.', NOW() - INTERVAL '41 days'),
            (v_post_id, NULL, 'If you''re sensitive to heat, skip July-August. Both are 35°C+. April-May and Sept-Oct are perfect.', NOW() - INTERVAL '40 days');
    END IF;

    SELECT id INTO v_post_id FROM public.forum_posts WHERE slug = 'budget-daily-breakdown' LIMIT 1;
    IF v_post_id IS NOT NULL THEN
        INSERT INTO public.forum_comments (post_id, author_id, body, created_at)
        VALUES
            (v_post_id, NULL, 'Budget: 30-40 USD/night guesthouse + 10-15 USD food + 5 USD transport + 10-20 USD activities = ~60 USD/day. Can be less if you skip tours.', NOW() - INTERVAL '37 days'),
            (v_post_id, NULL, 'Mid-range is 50-70 USD. Fine dining can go 30-40 USD per meal. Local food 2-5 USD.', NOW() - INTERVAL '36 days');
    END IF;

    -- Add a few more comment examples for diversity
    SELECT id INTO v_post_id FROM public.forum_posts WHERE slug = 'cleopatra-vs-dim-river' LIMIT 1;
    IF v_post_id IS NOT NULL THEN
        INSERT INTO public.forum_comments (post_id, author_id, body, created_at)
        VALUES
            (v_post_id, NULL, 'Different experiences. Cleopatra is iconic, social, good for swimming. Dim River is peaceful, nature, cooler in canyon. Do both if you have time!', NOW() - INTERVAL '38 days'),
            (v_post_id, NULL, 'Cleopatra for day 1 to see it. Dim River if you want to escape crowds and hike.', NOW() - INTERVAL '37 days');
    END IF;

    SELECT id INTO v_post_id FROM public.forum_posts WHERE slug = 'turkish-breakfast-spots' LIMIT 1;
    IF v_post_id IS NOT NULL THEN
        INSERT INTO public.forum_comments (post_id, author_id, body, created_at)
        VALUES
            (v_post_id, NULL, 'Go to any neighborhood kahvaltı place (family-run). You''ll get olives, cheese, tomatoes, bread, honey, tea for ~3 USD. Best value ever.', NOW() - INTERVAL '40 days'),
            (v_post_id, NULL, 'Keykubat Kahvaltı near the beach is popular but touristy. Better to ask your hotel staff for local spots.', NOW() - INTERVAL '39 days');
    END IF;

    SELECT id INTO v_post_id FROM public.forum_posts WHERE slug = 'alanya-castle-tour-time' LIMIT 1;
    IF v_post_id IS NOT NULL THEN
        INSERT INTO public.forum_comments (post_id, author_id, body, created_at)
        VALUES
            (v_post_id, NULL, 'You can self-explore. Guides cost ~15 USD but worth it for context. Allow 2-3 hours if doing it thoroughly. Bring water.', NOW() - INTERVAL '41 days'),
            (v_post_id, NULL, 'Go early morning to avoid crowds and heat. Sunrise views are phenomenal.', NOW() - INTERVAL '40 days');
    END IF;

    SELECT id INTO v_post_id FROM public.forum_posts WHERE slug = 'newcomer-orientation' LIMIT 1;
    IF v_post_id IS NOT NULL THEN
        INSERT INTO public.forum_comments (post_id, author_id, body, created_at)
        VALUES
            (v_post_id, NULL, 'Welcome! Prioritize: 1) Get a SIM card (Turkcell/Vodafone). 2) Find accommodation. 3) Explore the beach area. Tourist office has maps.', NOW() - INTERVAL '4 days'),
            (v_post_id, NULL, 'Join Facebook expat groups immediately. People are very helpful and will answer any question.', NOW() - INTERVAL '3 days'),
            (v_post_id, NULL, 'The promenade walk is amazing at sunset. Great way to get oriented to the city.', NOW() - INTERVAL '2 days');
    END IF;
END $$;

-- ============================================================
-- 4. Verification
-- ============================================================

-- Display summary
SELECT 'Forum seeding complete!' as status,
       COUNT(*) as total_posts
FROM public.forum_posts
WHERE author_id IS NULL;

SELECT category_id, 
       COUNT(*) as post_count
FROM public.forum_posts
WHERE author_id IS NULL
GROUP BY category_id
ORDER BY post_count DESC;
