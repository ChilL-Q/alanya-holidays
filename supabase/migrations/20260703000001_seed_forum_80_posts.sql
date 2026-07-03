-- Forum Seeding - Final Version
-- 80+ realistic posts across all categories
-- This file seeds posts without relying on external scripts or auth

-- Travel & Vacation Planning (10 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'First time in Alanya — 5 days itinerary', 'itinerary-5days-001', 
'Hi everyone! First visit with my wife in August. We have 5 days total. Interested in beaches, local food, and maybe one day trip. What''s the must-do list?',
fc.id, NOW() - INTERVAL '45 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-first-time' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Best time to visit Alanya', 'best-time-visit-002', 
'Planning a trip and torn between June and September. I hate extreme heat. Which month is better? Water temp?',
fc.id, NOW() - INTERVAL '42 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-best-time' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Daily budget for 2-week trip', 'budget-2weeks-003', 
'Solo traveler, 14 days planned. What is realistic daily budget for accommodation, food, and activities?',
fc.id, NOW() - INTERVAL '38 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-budget' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Flights from London to Antalya', 'flights-london-004', 
'Looking at easyJet, Ryanair, Turkish Airlines. Which offers best value for flights to Antalya?',
fc.id, NOW() - INTERVAL '35 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-flights' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Where to stay in Alanya', 'accommodation-location-005', 
'Can''t decide between Old Town and beach area. Which location is better for a week visit?',
fc.id, NOW() - INTERVAL '32 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-hotels' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Visa for USA citizens in Turkey', 'visa-usa-006', 
'Planning 3-week visit. Do I need visa or get it on arrival as a US citizen?',
fc.id, NOW() - INTERVAL '28 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-itineraries' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Phone roaming vs local SIM', 'phone-sim-007', 
'EU based. Is roaming expensive or should I buy local Turkish SIM card?',
fc.id, NOW() - INTERVAL '25 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-itineraries' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Packing for August in Mediterranean', 'packing-august-008', 
'First time in summer Mediterranean heat. What am I missing from my packing list?',
fc.id, NOW() - INTERVAL '22 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-best-time' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Group trip planning — 8 people', 'group-trip-009', 
'Organizing friends trip in September. Should we stay together? Group activities ideas?',
fc.id, NOW() - INTERVAL '18 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-hotels' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Airport transfer from Antalya', 'airport-transfer-010', 
'From Antalya airport — taxi, shuttle, or car rental? What do you recommend?',
fc.id, NOW() - INTERVAL '15 days'
FROM public.forum_categories fc WHERE fc.slug = 'travel-flights' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Beaches & Nature (10 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Cleopatra Beach vs Dim River hike', 'cleopatra-vs-dimriver-011', 
'Can''t fit both in one day. Which should I prioritize between beach and hiking?',
fc.id, NOW() - INTERVAL '40 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-cleopatra' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Hidden coves for snorkeling', 'hidden-coves-snorkel-012', 
'Looking for less touristy beaches for snorkeling. Any secret spots? Boat or walking access?',
fc.id, NOW() - INTERVAL '37 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-hidden' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Dim Cave and River combo day', 'dim-cave-river-013', 
'Can I do cave tour plus river hike same day? Duration? Best order?',
fc.id, NOW() - INTERVAL '33 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-dim-river' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Hiking timing — morning or sunset', 'hike-timing-014', 
'Planning castle viewpoint hike. Early morning or sunset? Heat and crowds?',
fc.id, NOW() - INTERVAL '30 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-hiking' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Water safety warnings', 'water-safety-015', 
'Keen swimmer. Any hazards in the sea I should watch for?',
fc.id, NOW() - INTERVAL '27 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-cleopatra' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Beach club worth the cost', 'beach-club-value-016', 
'Considering beach club day. Which are good value?',
fc.id, NOW() - INTERVAL '24 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-clubs' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Paragliding opportunities', 'paragliding-spots-017', 
'Alanya good for paragliding? Companies? Pricing?',
fc.id, NOW() - INTERVAL '20 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-nature' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Rocky vs sand beaches', 'rocky-vs-sand-018', 
'Some beaches rocky, some sandy. Which better for snorkeling?',
fc.id, NOW() - INTERVAL '16 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-hidden' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Windsurfing in Alanya', 'windsurfing-019', 
'Any windsurfing spots? Water conditions? Lessons available?',
fc.id, NOW() - INTERVAL '12 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-nature' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Sun protection in August heat', 'sunburn-protection-020', 
'Going in August. SPF recommendations? Sun safety tips?',
fc.id, NOW() - INTERVAL '8 days'
FROM public.forum_categories fc WHERE fc.slug = 'beaches-cleopatra' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Food & Nightlife (10 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Turkish breakfast must-tries', 'breakfast-spots-021', 
'Turkish breakfast is legendary. Where for authentic experience?',
fc.id, NOW() - INTERVAL '41 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-breakfast' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Pide vs Pizza comparison', 'pide-pizza-022', 
'Love both. Turkish pide worth trying over pizza here?',
fc.id, NOW() - INTERVAL '39 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-restaurants' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Best seafood restaurants', 'seafood-restaurants-023', 
'Want nice seafood dinner with view. Recommendations?',
fc.id, NOW() - INTERVAL '36 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-restaurants' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Street food favorites', 'street-food-024', 
'Love street food. Must-try street eats in Alanya?',
fc.id, NOW() - INTERVAL '34 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-street' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Cafes with WiFi for remote work', 'cafe-wifi-nomad-025', 
'Work remotely. Need good coffee and WiFi. Recommendations?',
fc.id, NOW() - INTERVAL '31 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-cafes' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Nightlife and entertainment', 'nightlife-026', 
'Looking for evening activities. Bars? Clubs? Live music?',
fc.id, NOW() - INTERVAL '26 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-bars' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Turkish desserts to try', 'desserts-027', 
'Turkish desserts amazing. Genuine vs tourist traps?',
fc.id, NOW() - INTERVAL '23 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-cafes' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Alcohol availability', 'alcohol-beers-028', 
'Like wine and beer. Availability? Local Turkish beers?',
fc.id, NOW() - INTERVAL '19 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-bars' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Turkish tea and coffee culture', 'tea-coffee-029', 
'Turkish tea and coffee traditions? Local spots?',
fc.id, NOW() - INTERVAL '14 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-cafes' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Vegetarian and vegan options', 'vegan-030', 
'I''m vegan. Are there good options in restaurants?',
fc.id, NOW() - INTERVAL '10 days'
FROM public.forum_categories fc WHERE fc.slug = 'food-restaurants' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Things to Do (10 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Alanya Castle tour duration', 'castle-031', 
'Planning castle visit. Self-explore or need guide? Hours needed?',
fc.id, NOW() - INTERVAL '43 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-castle' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Boat tours sunset vs daytime', 'boat-tours-032', 
'Sunset or daytime boat tour? Which better?',
fc.id, NOW() - INTERVAL '40 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-boat-tours' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Jet skis and water sports', 'water-sports-033', 
'Want to try jet skiing. Where to rent? Cost?',
fc.id, NOW() - INTERVAL '37 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-water-sports' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Family activities for kids', 'family-034', 
'Traveling with two kids. Activities to keep them happy?',
fc.id, NOW() - INTERVAL '29 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-family' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Day trips from Alanya', 'day-trips-035', 
'Spent 3 days locally. Where can I day trip to?',
fc.id, NOW() - INTERVAL '21 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-day-trips' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Horse riding on beach', 'horse-riding-036', 
'Saw horses on beach. Available? Cost?',
fc.id, NOW() - INTERVAL '17 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-water-sports' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'PADI scuba certification', 'scuba-037', 
'Want PADI certified. Good schools here? Cost?',
fc.id, NOW() - INTERVAL '14 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-water-sports' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Aqua park and water parks', 'aquapark-038', 
'Any water parks near Alanya?',
fc.id, NOW() - INTERVAL '11 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-family' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Rock climbing and adventure', 'climbing-039', 
'Rock climbing or adventure sports available?',
fc.id, NOW() - INTERVAL '7 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-water-sports' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Night shows and entertainment', 'night-shows-040', 
'Nighttime shows or entertainment venues?',
fc.id, NOW() - INTERVAL '4 days'
FROM public.forum_categories fc WHERE fc.slug = 'things-castle' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Expats & Digital Nomads (10 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Residence permit process', 'residency-041', 
'Long-term stay. Residence permit (ikamet) process?',
fc.id, NOW() - INTERVAL '44 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-permits' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Neighborhoods for expats', 'neighborhoods-042', 
'Looking to rent long-term. Affordable neighborhoods?',
fc.id, NOW() - INTERVAL '38 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-community' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Monthly budget for 3 months', 'budget-3m-043', 
'Staying 3 months. Budget for rent, food, utilities?',
fc.id, NOW() - INTERVAL '35 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-cost-of-living' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Coworking for remote workers', 'coworking-044', 
'Work remotely. Coworking spaces available?',
fc.id, NOW() - INTERVAL '28 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-coworking' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Healthcare and insurance', 'healthcare-045', 
'Long-term stay. Healthcare options? Private insurance?',
fc.id, NOW() - INTERVAL '25 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-healthcare' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Turkish bank account as foreigner', 'banking-046', 
'Need Turkish bank account? Can foreigners open?',
fc.id, NOW() - INTERVAL '15 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-banking' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Meeting other expats', 'community-047', 
'Moving solo. How do expats connect?',
fc.id, NOW() - INTERVAL '12 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-community' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Learning Turkish language', 'turkish-lang-048', 
'Want to learn Turkish. Classes or tutors?',
fc.id, NOW() - INTERVAL '9 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-coworking' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Internet reliability for work', 'internet-work-049', 
'Need fast internet for work. Connectivity?',
fc.id, NOW() - INTERVAL '6 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-coworking' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Taxes for digital nomads', 'taxes-050', 
'Remote worker long-term. Tax implications?',
fc.id, NOW() - INTERVAL '2 days'
FROM public.forum_categories fc WHERE fc.slug = 'expats-banking' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Real Estate (8 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Property prices per sqm', 'property-051', 
'Buying apartment. Fair price per sqm?',
fc.id, NOW() - INTERVAL '42 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-buying' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Airbnb rental income', 'airbnb-052', 
'Airbnb rental. What returns realistic?',
fc.id, NOW() - INTERVAL '39 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-investment' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Legal issues for foreign buyers', 'legal-053', 
'Want to buy property. Legal complications?',
fc.id, NOW() - INTERVAL '36 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-legal' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Renovation budget', 'renovation-054', 
'Found cheap property. Renovation budget?',
fc.id, NOW() - INTERVAL '32 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-buying' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Tenant rights and protections', 'tenants-055', 
'Renting apartment. Tenant rights? Protections?',
fc.id, NOW() - INTERVAL '24 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-renting' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Up-and-coming neighborhoods', 'invest-neighborhoods-056', 
'Investment potential. Neighborhoods to watch?',
fc.id, NOW() - INTERVAL '11 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-areas' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Foreign ownership restrictions', 'foreign-ownership-057', 
'Turkey limits foreign property ownership?',
fc.id, NOW() - INTERVAL '5 days'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-legal' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Furnished vs unfurnished rental', 'furnished-058', 
'Furnished or unfurnished? Pros and cons?',
fc.id, NOW() - INTERVAL '1 day'
FROM public.forum_categories fc WHERE fc.slug = 'realestate-renting' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Local Life & Culture (8 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Turkish customs and etiquette', 'customs-059', 
'Want to be respectful. Key cultural norms?',
fc.id, NOW() - INTERVAL '43 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-traditions' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Basic Turkish phrases', 'phrases-060', 
'Useful Turkish phrases for tourists?',
fc.id, NOW() - INTERVAL '38 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-language' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Bazaar haggling etiquette', 'haggling-061', 
'Should I haggle at bazaar? Offend anyone?',
fc.id, NOW() - INTERVAL '33 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-bazaars' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Islamic holidays and Ramadan', 'ramadan-062', 
'When is Ramadan? Affect my visit?',
fc.id, NOW() - INTERVAL '13 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-traditions' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Authentic souvenirs', 'souvenirs-063', 
'Quality souvenirs. Genuine vs tourist junk?',
fc.id, NOW() - INTERVAL '8 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-bazaars' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Local art and music scene', 'arts-064', 
'Local galleries, artists, live music?',
fc.id, NOW() - INTERVAL '3 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-traditions' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Folk traditions and celebrations', 'traditions-065', 
'Local traditions or festivals?',
fc.id, NOW() - INTERVAL '6 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-bazaars' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Tipping customs', 'tipping-066', 
'Tipping expectations? Restaurants, taxis?',
fc.id, NOW() - INTERVAL '9 days'
FROM public.forum_categories fc WHERE fc.slug = 'culture-traditions' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Events & Meetups (6 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Digital nomad meetups', 'meetups-067', 
'Regular meetups for remote workers?',
fc.id, NOW() - INTERVAL '41 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-social' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Beach volleyball pickup', 'volleyball-068', 
'See volleyball games. Can tourists join?',
fc.id, NOW() - INTERVAL '27 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-sports' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Language exchange nights', 'exchange-069', 
'Language exchange community? Practice Turkish?',
fc.id, NOW() - INTERVAL '10 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-language' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Summer festivals and events', 'festivals-070', 
'Big summer events? When?',
fc.id, NOW() - INTERVAL '22 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-festivals' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Sports and fitness groups', 'sports-071', 
'Sports leagues, running clubs, yoga?',
fc.id, NOW() - INTERVAL '19 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-sports' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Volunteering opportunities', 'volunteer-072', 
'Volunteering or community projects?',
fc.id, NOW() - INTERVAL '7 days'
FROM public.forum_categories fc WHERE fc.slug = 'events-social' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Support & Help (6 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'New to Alanya newcomer tips', 'newcomer-073', 
'Just arrived. Newcomer tips and orientation?',
fc.id, NOW() - INTERVAL '5 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-newbie' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Emergency contacts and numbers', 'emergency-074', 
'Emergency numbers? Police, ambulance?',
fc.id, NOW() - INTERVAL '3 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-safety' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Internet speed and connectivity', 'internet-075', 
'Need fast internet for work. Connectivity?',
fc.id, NOW() - INTERVAL '8 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-forum' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'SIM card and mobile providers', 'sim-076', 
'Which mobile provider best? Turkcell, Vodafone?',
fc.id, NOW() - INTERVAL '6 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-newbie' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Safety for tourists and expats', 'safety-077', 
'Alanya safe? Safety tips?',
fc.id, NOW() - INTERVAL '4 days'
FROM public.forum_categories fc WHERE fc.slug = 'support-safety' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Transportation getting around', 'transport-078', 
'How to get around? Taxis? Buses? Car rental?',
fc.id, NOW() - INTERVAL '1 day'
FROM public.forum_categories fc WHERE fc.slug = 'support-forum' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Marketplace (5 posts)
INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Selling used furniture platforms', 'furniture-079', 
'Leaving Alanya. Where to sell furniture?',
fc.id, NOW() - INTERVAL '30 days'
FROM public.forum_categories fc WHERE fc.slug = 'market-buy-sell' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Furnished vs unfurnished apartments', 'furnished-080', 
'Furnished or unfurnished? Pros and cons?',
fc.id, NOW() - INTERVAL '20 days'
FROM public.forum_categories fc WHERE fc.slug = 'market-housing' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Jobs for expats', 'jobs-081', 
'Looking for work. Jobs available for foreigners?',
fc.id, NOW() - INTERVAL '17 days'
FROM public.forum_categories fc WHERE fc.slug = 'market-jobs' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Free events and budget activities', 'free-082', 
'Budget traveler. Free or cheap things?',
fc.id, NOW() - INTERVAL '13 days'
FROM public.forum_categories fc WHERE fc.slug = 'market-free' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.forum_posts (title, slug, body, category_id, created_at)
SELECT 'Second-hand and used items', 'secondhand-083', 
'Second-hand shops or markets?',
fc.id, NOW() - INTERVAL '11 days'
FROM public.forum_categories fc WHERE fc.slug = 'market-buy-sell' LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Summary
SELECT 
    'SEEDING COMPLETE' as status,
    COUNT(*) as total_posts,
    COUNT(DISTINCT category_id) as categories_with_posts
FROM public.forum_posts 
WHERE created_at > NOW() - INTERVAL '60 days'
AND author_id IS NULL;
