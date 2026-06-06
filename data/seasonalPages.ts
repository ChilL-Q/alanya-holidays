// ── Types ────────────────────────────────────────────────────────────

export type SeasonalPageSlug =
  | 'alanya-in-april'
  | 'alanya-in-may'
  | 'alanya-in-june'
  | 'alanya-in-july'
  | 'alanya-in-august'
  | 'alanya-in-september'
  | 'alanya-in-october'
  | 'alanya-in-november'
  | 'alanya-in-december'
  | 'alanya-in-january'
  | 'alanya-summer-holidays'
  | 'alanya-winter-holiday'
  | 'best-time-to-visit-alanya';

export type SeasonRating = 'excellent' | 'great' | 'good' | 'quiet' | 'off-season';

export interface WeatherData {
  avgHigh: number;
  avgLow: number;
  seaTemp: number;
  sunHours: number;
  rainDays: number;
}

export interface SeasonalActivity {
  name: string;
  description: string;
}

export interface SeasonalPage {
  slug: SeasonalPageSlug;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  heroSubtitle: string;
  weather?: WeatherData;
  longDescription: string[];
  highlights: string[];
  activities: SeasonalActivity[];
  pros: string[];
  cons: string[];
  faqs: { question: string; answer: string }[];
  rating: SeasonRating;
}

// ── Data ─────────────────────────────────────────────────────────────

export const SEASONAL_PAGES: SeasonalPage[] = [
  {
    slug: 'alanya-in-april',
    title: 'Alanya in April',
    metaTitle: 'Alanya in April — Weather, Activities & Travel Guide 2026',
    metaDescription: 'Planning a trip to Alanya in April? Discover the weather (avg 20°C), best activities, beach conditions, and why April is one of the best months to visit.',
    keywords: ['alanya in april', 'alanya april weather', 'alanya april holiday', 'visit alanya april', 'alanya spring'],
    heroSubtitle: 'Spring blooms, warm days, and uncrowded beaches — April is one of the best times to discover Alanya.',
    weather: { avgHigh: 20, avgLow: 13, seaTemp: 19, sunHours: 9, rainDays: 5 },
    longDescription: [
      'April is one of the most pleasant months to visit Alanya. The Turkish Riviera is waking up from winter, and the landscape is lush and green after the spring rains. Temperatures are comfortable — warm enough to sit on the terrace but cool enough for active sightseeing without the intense summer heat.',
      'The beaches are uncrowded compared to the summer peak season, making April ideal for travelers who want the beauty of the Mediterranean without fighting for sunbeds. The sea temperature reaches around 19°C — cool for swimming, but not unpleasant for a dip on a warm afternoon.',
      'April is perfect for exploring Alanya\'s cultural highlights: Alanya Castle, the Red Tower, Dim Cave, and Sapadere Canyon are all best visited in the comfortable spring temperatures. Jeep safaris and hiking tours also run at full capacity without the summer heat.',
      'Prices for hotels and apartments are significantly lower than in July-August, and availability is much better. If you\'re looking for the sweet spot between value, weather, and experience, April delivers on all counts.',
    ],
    highlights: [
      'Comfortable 20°C daytime temperatures',
      'Uncrowded beaches and attractions',
      'Lower hotel prices vs summer peak',
      'Lush green landscape after spring rains',
      'Perfect for sightseeing and outdoor activities',
    ],
    activities: [
      { name: 'Alanya Castle & Red Tower', description: 'Explore Alanya\'s iconic fortress without summer queues — the views over the bay are stunning in spring light.' },
      { name: 'Jeep Safari', description: 'The Taurus Mountains are at their most scenic in April with wildflowers in bloom — perfect for an off-road adventure.' },
      { name: 'Sapadere Canyon', description: 'The canyon waterfalls run at full strength in spring — visit before the summer crowds arrive.' },
      { name: 'Boat Tours', description: 'Calmer seas in April make for smooth boat trips along the coastline and into the sea caves.' },
      { name: 'Dim Cave & Dim River', description: 'Spring is an excellent time to visit Dim Cave and picnic along the Dim River before the summer heat sets in.' },
    ],
    pros: ['Great sightseeing weather', 'Low season prices', 'No summer crowds', 'Green landscape', 'All excursions operating'],
    cons: ['Sea may be cool for swimming', 'Some beach clubs not yet open', 'Occasional spring rain showers'],
    faqs: [
      { question: 'Is April a good time to visit Alanya?', answer: 'Yes — April is excellent for sightseeing, hiking, and cultural visits. The weather is warm and pleasant at 20°C, crowds are low, and prices are affordable.' },
      { question: 'Can you swim in Alanya in April?', answer: 'The sea is around 19°C in April — cool but manageable for a dip. Many visitors enjoy the beach without swimming or simply relax on the sunbeds.' },
      { question: 'What is the weather like in Alanya in April?', answer: 'April averages 20°C daytime highs and 13°C nights. Expect 9 hours of sunshine per day with around 5 rainy days during the month.' },
      { question: 'Are hotels open in Alanya in April?', answer: 'Yes, most hotels and resorts are open in April — it\'s the start of the shoulder season. You\'ll find great availability and good prices.' },
    ],
    rating: 'great',
  },

  {
    slug: 'alanya-in-may',
    title: 'Alanya in May',
    metaTitle: 'Alanya in May — Weather, Things to Do & Holiday Guide 2026',
    metaDescription: 'Alanya in May offers warm 25°C weather, a sea temperature of 22°C, and beautiful uncrowded beaches. Find out why May is perfect for a Turkish Riviera holiday.',
    keywords: ['alanya in may', 'alanya may weather', 'weather in alanya may', 'alanya may holiday', 'alanya spring may'],
    heroSubtitle: 'Warm sunshine, warm sea, and beaches that aren\'t yet packed — May is Alanya at its very best.',
    weather: { avgHigh: 25, avgLow: 17, seaTemp: 22, sunHours: 11, rainDays: 3 },
    longDescription: [
      'May is arguably the best month to visit Alanya. The weather is warm and sunny — 25°C during the day — but not yet at the intense heat of peak summer. The sea has warmed to a comfortable 22°C, ideal for swimming, and the beaches are beautiful without being overcrowded.',
      'May sits at the start of the holiday season, which means resorts are fully open and operating, yet the crowds of July and August haven\'t arrived. You can enjoy sunbeds on Cleopatra Beach with space to breathe, explore the old city without queuing, and book popular excursions without advance planning.',
      'The evenings in May are perfect for alfresco dining — warm enough to sit outside comfortably, cool enough to enjoy a meal without feeling sticky. Restaurant terraces overlooking the sea are particularly lovely at sunset.',
      'For families, May is an ideal choice: the sea is warm enough for children, the heat isn\'t overwhelming, and the whole resort is in full swing. Prices remain below the July-August peak, often significantly so.',
    ],
    highlights: [
      'Perfect 25°C swimming weather',
      'Sea at 22°C — ideal for swimming',
      '11 hours of sunshine daily',
      'Full resort season — everything open',
      'Uncrowded beaches and attractions',
    ],
    activities: [
      { name: 'Beach & Swimming', description: 'Cleopatra Beach and Keykubat Beach are stunning in May — warm enough to swim, cool enough to enjoy all day.' },
      { name: 'Boat Tours', description: 'May is prime season for boat trips — calm seas, good visibility, and fewer passengers per boat than July.' },
      { name: 'Scuba Diving & Snorkeling', description: 'Visibility in the Mediterranean is excellent in May — a great time to explore the underwater world off Alanya.' },
      { name: 'Alanya Castle & Historical Sites', description: 'Explore in comfort before the heat of summer — the castle, Red Tower, and Shipyard are best visited in May temperatures.' },
      { name: 'Jeep Safari & Rafting', description: 'Spring river levels make May excellent for rafting on the Dim River, and the mountain scenery is still green and lush.' },
    ],
    pros: ['Best overall weather', 'Warm sea for swimming', 'Low crowds vs summer', 'Everything fully open', 'Good value prices'],
    cons: ['Slightly more expensive than April', 'Some busy weekends from European holidays', 'School groups can be active in sightseeing areas'],
    faqs: [
      { question: 'Is May a good time to visit Alanya?', answer: 'May is one of the very best times to visit Alanya — warm weather, warm sea, uncrowded beaches, and everything fully open. It\'s highly recommended.' },
      { question: 'How warm is Alanya in May?', answer: 'Alanya averages 25°C in May with 11 hours of sunshine. Nights cool to around 17°C — perfect for evenings outdoors.' },
      { question: 'Is the sea warm enough to swim in Alanya in May?', answer: 'Yes — the sea reaches 22°C in May, which is comfortably warm for swimming. Most visitors find it ideal.' },
      { question: 'Is Alanya crowded in May?', answer: 'May is much less crowded than July and August. Beaches have space, attractions are accessible, and restaurants don\'t need advance booking on weekdays.' },
    ],
    rating: 'excellent',
  },

  {
    slug: 'alanya-in-june',
    title: 'Alanya in June',
    metaTitle: 'Alanya in June — Weather, Beaches & What to Do 2026',
    metaDescription: 'Alanya in June: 30°C days, sea temperature 25°C, and long sunny days make it peak beach season. Find the best activities, tips for the heat, and where to stay.',
    keywords: ['alanya in june', 'alanya june weather', 'alanya june holiday', 'alanya beach june', 'alanya june activities'],
    heroSubtitle: 'The Mediterranean heat arrives — June marks the beginning of Alanya\'s glorious beach season.',
    weather: { avgHigh: 30, avgLow: 22, seaTemp: 25, sunHours: 13, rainDays: 1 },
    longDescription: [
      'June is the start of high season in Alanya. Temperatures climb to 30°C, the sea warms to 25°C, and the resort shifts into full holiday mode. If you\'re looking for classic Turkish Riviera sun, sea, and sand, June delivers from day one.',
      'The days are the longest of the year — 13 hours of sunshine means plenty of time for beach mornings, afternoon excursions, and long summer evenings. Boat tours, water sports, and beach clubs are all running at peak capacity.',
      'June crowds are noticeable but not yet at the intense peak of July-August. You\'ll find most beaches, restaurants, and attractions busy but manageable. Early June is particularly good — warm weather without the full summer rush.',
      'Evenings are warm and lively. The Alanya promenade, beachside restaurants, and rooftop bars are at their best in June — the heat of the day gives way to a perfect warm evening atmosphere. Nightlife begins to pick up significantly.',
    ],
    highlights: [
      'Peak beach season begins',
      '25°C sea temperature — perfect swimming',
      '13 hours of sunshine daily',
      'All water sports and boat tours running',
      'Long warm evenings for dining and nightlife',
    ],
    activities: [
      { name: 'Beach & Water Sports', description: 'June is prime time for parasailing, jet skiing, banana boat rides, and all water sports along Cleopatra and Keykubat beaches.' },
      { name: 'Pirate Boat Tour', description: 'The classic Alanya excursion — a full-day tour with swimming stops, caves, and lunch on board. Best booked in advance in June.' },
      { name: 'Nightlife & Beach Bars', description: 'Alanya\'s nightlife scene opens fully in June — beach bars, rooftop venues, and the famous club strip come alive.' },
      { name: 'Green Canyon Day Trip', description: 'A popular day trip from Alanya — a boat cruise through the stunning emerald canyon. Very popular in summer, book early.' },
      { name: 'Alanya Sunset Cruise', description: 'June evenings are long and golden — a sunset yacht cruise is spectacular in the warm summer light.' },
    ],
    pros: ['Peak beach weather', 'Everything fully open and operating', 'Long sunny days', 'Great nightlife scene', 'Warm evenings'],
    cons: ['Getting crowded and expensive', 'Heat can be intense midday', 'Book excursions and restaurants in advance'],
    faqs: [
      { question: 'What is Alanya like in June?', answer: 'June is the beginning of peak season — hot, sunny, and very busy. Expect 30°C days, warm sea, and a lively holiday atmosphere throughout the resort.' },
      { question: 'Is June crowded in Alanya?', answer: 'June is busier than spring but slightly less crowded than July-August. Early June is the sweet spot — summer weather without the maximum crowds.' },
      { question: 'What to do in Alanya in June?', answer: 'Beach days, boat tours, water sports, and evening dining. June is perfect for all water-based activities and nightlife.' },
      { question: 'How hot is Alanya in June?', answer: 'Average daytime temperatures of 30°C with sea at 25°C. Evenings stay warm at 22°C — ideal for outdoor dining.' },
    ],
    rating: 'excellent',
  },

  {
    slug: 'alanya-in-july',
    title: 'Alanya in July',
    metaTitle: 'Alanya in July — Peak Season Guide: Weather, Beaches & Tips 2026',
    metaDescription: 'Alanya in July: the hottest and busiest month with 34°C highs and sea at 28°C. Everything you need to know about visiting Alanya in peak summer.',
    keywords: ['alanya in july', 'alanya july weather', 'alanya july holiday', 'alanya peak season', 'alanya july beach'],
    heroSubtitle: 'Peak summer in full swing — Alanya in July is hot, vibrant, and at maximum energy.',
    weather: { avgHigh: 34, avgLow: 25, seaTemp: 28, sunHours: 13, rainDays: 0 },
    longDescription: [
      'July is Alanya\'s peak month — the hottest, busiest, and most vibrant. Temperatures reach 34°C and the sea is a bath-warm 28°C. If you love intense summer sun, a lively beach scene, and the full resort experience, July is Alanya at maximum.',
      'The resort operates at full capacity. Every restaurant, beach club, excursion boat, and hotel is running. Cleopatra Beach is packed, the promenade is alive until the early hours, and every corner of town is buzzing with holidaymakers from across Europe and Russia.',
      'The heat in July requires planning. Most visitors stick to the beach in the morning, rest or visit air-conditioned attractions in the early afternoon, and venture out again in the cooler early evening. The warm nights are a highlight — dining on a sea-view terrace at 10pm is a very Alanya experience.',
      'Booking in advance is essential for July: hotels, popular excursions, and even good restaurants should all be reserved ahead. Prices are at their annual peak. But for those who love a buzzing holiday atmosphere, July delivers an energy that\'s hard to match.',
    ],
    highlights: [
      'Bath-warm 28°C sea temperature',
      'Maximum holiday energy and atmosphere',
      'Non-stop sunshine — 0 rain days expected',
      'Vibrant nightlife every night',
      'Peak season — everything at full operation',
    ],
    activities: [
      { name: 'Beach Days', description: 'The sea hits 28°C in July — perfect for long hours swimming, floating, and enjoying the Mediterranean at its warmest.' },
      { name: 'Night Swimming & Beach Clubs', description: 'July evenings stay warm enough for swimming after dark. Beach clubs host events and parties throughout the night.' },
      { name: 'Boat Tours & Yacht Charters', description: 'All boat tours are at peak operation — from pirate trips to private yacht charters. Book well in advance.' },
      { name: 'Dim Cave', description: 'A perfect midday escape from the heat — the cave maintains a cool 18°C inside all year round.' },
      { name: 'Alanya Nightlife', description: 'July is peak party season — the famous Alanya clubs, rooftop bars, and beachfront venues are at their best.' },
    ],
    pros: ['Warmest sea of the year', 'Maximum holiday atmosphere', 'Long days and warm nights', 'Non-stop sunshine'],
    cons: ['Very hot midday heat (34°C)', 'Beaches very crowded', 'Highest hotel prices of the year', 'Book everything in advance'],
    faqs: [
      { question: 'How hot is Alanya in July?', answer: 'July is the hottest month — averaging 34°C during the day and 25°C at night. The sea reaches 28°C. Shade and hydration are essential during peak afternoon hours.' },
      { question: 'Is Alanya too hot in July?', answer: 'For beach lovers, July heat is perfect. For those wanting to sightsee or hike, the midday heat is intense — plan outdoor activities for morning or evening.' },
      { question: 'Is July peak season in Alanya?', answer: 'Yes — July and August are the peak months. Expect maximum crowds, maximum prices, and maximum energy. Book everything in advance.' },
      { question: 'What is the sea temperature in Alanya in July?', answer: 'The sea reaches 28°C in July — one of the warmest seas in the Mediterranean. Perfect for swimming at any time of day or night.' },
    ],
    rating: 'excellent',
  },

  {
    slug: 'alanya-in-august',
    title: 'Alanya in August',
    metaTitle: 'Alanya in August — Peak Summer Holiday Guide 2026',
    metaDescription: 'Alanya in August: 34°C sunshine, sea at 28°C, and the resort at full capacity. Complete guide to visiting Alanya in the hottest peak season month.',
    keywords: ['alanya in august', 'alanya august weather', 'alanya august holiday', 'alanya august beach', 'alanya summer august'],
    heroSubtitle: 'The height of Mediterranean summer — Alanya in August is the ultimate sun and sea holiday.',
    weather: { avgHigh: 34, avgLow: 25, seaTemp: 28, sunHours: 12, rainDays: 0 },
    longDescription: [
      'August matches July for heat and energy — temperatures stay at 34°C with a bath-warm sea at 28°C. The resort is at its absolute peak, with visitors from across Europe filling every hotel, beach, and restaurant. If the ultimate summer holiday is your goal, August delivers.',
      'The main beaches — Cleopatra, Keykubat, and İncekum — are at maximum capacity but remain beautiful. For quieter spots, head to the smaller coves east of Mahmutlar or the calmer beaches in Avsallar and Konaklı.',
      'August is the month when Alanya\'s nightlife reaches its peak. The famous club and bar scene on Iskele Square and along the seafront is at full swing, with live music, DJ nights, and beach parties running well into the early hours.',
      'Despite the crowds, August has a particular magic: the long warm nights, the buzz of a resort in full swing, and the Mediterranean at its most inviting. Just plan ahead, book everything in advance, and embrace the peak season energy.',
    ],
    highlights: [
      '28°C sea — warmest swimming of the year',
      'Peak holiday energy and atmosphere',
      'Vibrant nightlife and beach parties',
      'Maximum sunshine and warmth',
      'Full resort season at peak capacity',
    ],
    activities: [
      { name: 'Beach & Swimming', description: 'The sea is at its warmest in August — perfect for all-day beach sessions, swimming, snorkeling, and water sports.' },
      { name: 'Water Parks', description: 'Alanya\'s water parks and aquaparks are at peak fun in August — perfect for families with children.' },
      { name: 'Sunset Boat Cruise', description: 'An August sunset over the Mediterranean is spectacular — evening yacht tours are one of the highlights of the season.' },
      { name: 'Alanya Club Scene', description: 'August is the peak of nightlife season — every venue is open, packed, and running special events.' },
      { name: 'Sapadere Canyon', description: 'A refreshing midday escape — the canyon waterfalls and shaded paths offer relief from the August heat.' },
    ],
    pros: ['Perfect sea swimming conditions', 'Ultimate summer atmosphere', 'Full nightlife scene', 'Warm nights for outdoor dining'],
    cons: ['Hottest and most crowded month', 'Highest prices of the year', 'Advance booking essential', 'Intense midday heat'],
    faqs: [
      { question: 'Is August a good time to visit Alanya?', answer: 'August is perfect for those who want peak summer sun, warm sea, and a buzzing holiday atmosphere. If you prefer quieter travel, opt for May or September.' },
      { question: 'What is the weather in Alanya in August?', answer: 'Alanya in August averages 34°C with 0 rain days. The sea is 28°C and the sun shines 12 hours per day.' },
      { question: 'How crowded is Alanya in August?', answer: 'August is the most crowded month. Beaches are busy, restaurants book up, and popular excursions fill weeks in advance. Book everything ahead.' },
      { question: 'What are the best things to do in Alanya in August?', answer: 'Beach, water sports, boat tours, nightlife, and evening dining. August is about making the most of the Mediterranean summer.' },
    ],
    rating: 'excellent',
  },

  {
    slug: 'alanya-in-september',
    title: 'Alanya in September',
    metaTitle: 'Alanya in September — Perfect Late Summer Holiday Guide 2026',
    metaDescription: 'Alanya in September: 31°C days, warm 27°C sea, and noticeably fewer crowds than July-August. September is the perfect month for a late summer Alanya holiday.',
    keywords: ['alanya in september', 'alanya september weather', 'alanya september holiday', 'alanya late summer', 'alanya autumn september'],
    heroSubtitle: 'Late summer warmth without the peak season crowds — September is many visitors\' favourite month.',
    weather: { avgHigh: 31, avgLow: 22, seaTemp: 27, sunHours: 10, rainDays: 2 },
    longDescription: [
      'September is consistently rated by repeat visitors as the best month to come to Alanya. The heat drops from the intense July-August peak to a very comfortable 31°C. The sea is still a warm 27°C — better than most other Mediterranean destinations achieve all year. And the crowds have thinned dramatically.',
      'By mid-September, the summer rush has ended. European schools are back, which means beaches have space, restaurants can be booked spontaneously, and you can visit Alanya Castle or Dim Cave without queuing. Yet everything is still fully open and operating.',
      'Prices in September are noticeably lower than August. Many hotels offer excellent deals in the second half of the month. The weather remains very reliable — sunshine is guaranteed and rain is a rare occurrence.',
      'September evenings are beautiful: warm enough for outdoor dining, cool enough to walk around comfortably. The combination of summer warmth, autumn calm, and lower prices makes September an exceptional value month for the discerning traveler.',
    ],
    highlights: [
      'Warm 27°C sea — still perfect for swimming',
      'Significantly fewer crowds than peak season',
      'Lower prices vs July-August',
      'Everything fully open and operating',
      'Comfortable 31°C — not too hot',
    ],
    activities: [
      { name: 'Beach & Swimming', description: 'The sea at 27°C in September is ideal — warm, calm, and much less crowded than the peak summer months.' },
      { name: 'Hiking & Nature', description: 'September temperatures are perfect for hiking to Alanya Castle, exploring Sapadere Canyon, or walking the coastal paths.' },
      { name: 'Boat Tours', description: 'Boat tours are still operating at full schedule in September with fewer passengers per trip than July.' },
      { name: 'Alanya Old City', description: 'Explore the castle, Red Tower, and historic shipyard in September comfort — the heat has dropped and the sites are accessible.' },
      { name: 'Scuba Diving', description: 'September is one of the best months for diving — the sea is warm, visibility is excellent, and dive boats are less busy.' },
    ],
    pros: ['Best value of any warm month', 'Warm sea still perfect for swimming', 'Low crowds', 'Everything open', 'Comfortable temperatures'],
    cons: ['Occasional early rain showers', 'Some beach clubs closing mid-month', 'Nights getting shorter'],
    faqs: [
      { question: 'Is September a good time to visit Alanya?', answer: 'September is one of the very best months — warm sea, lower crowds, affordable prices, and reliable sunshine. Highly recommended for repeat visitors.' },
      { question: 'Is the sea still warm in Alanya in September?', answer: 'Yes — the sea stays at 27°C in September, still excellent for swimming. This is warmer than the peak of summer in many northern European seaside destinations.' },
      { question: 'How crowded is Alanya in September?', answer: 'Much less crowded than July-August. After the first week of September, European schools return and the crowds drop significantly.' },
      { question: 'What is the weather like in Alanya in September?', answer: 'Average 31°C during the day, 22°C at night. Around 10 hours of sunshine. Only 2 rainy days expected during the month.' },
    ],
    rating: 'excellent',
  },

  {
    slug: 'alanya-in-october',
    title: 'Alanya in October',
    metaTitle: 'Alanya in October — Autumn Holiday Guide: Weather & Activities 2026',
    metaDescription: 'Alanya in October offers 26°C days, a swimmable 24°C sea, and very few tourists. Discover why October is perfect for a peaceful, affordable Alanya break.',
    keywords: ['alanya in october', 'alanya october weather', 'alanya october holiday', 'alanya autumn holiday', 'alanya autumn october'],
    heroSubtitle: 'Autumn warmth and total tranquillity — October Alanya is a hidden gem for those in the know.',
    weather: { avgHigh: 26, avgLow: 17, seaTemp: 24, sunHours: 8, rainDays: 5 },
    longDescription: [
      'October is Alanya\'s hidden gem month. The summer crowds have gone, prices have dropped significantly, and yet the weather remains genuinely warm and sunny. At 26°C, October days are more comfortable than the intense heat of July — you can sightsee all day without needing to retreat from the sun.',
      'The sea is 24°C in October — still perfectly swimmable. Many visitors find October beach days more enjoyable than August ones: the water is warm, there\'s space on the sand, and the light has the golden quality of autumn.',
      'October is ideal for exploring everything Alanya has to offer beyond the beach. Day trips to Side, Green Canyon, Sapadere Canyon, and Manavgat Waterfall are uncrowded and operate at their best. Hiking in the Taurus Mountains becomes genuinely pleasant as the summer heat recedes.',
      'Long-stay visitors and digital nomads particularly favour October for its combination of good weather, affordable rates (often 50-70% below August prices), and a more relaxed pace. The authentic side of Alanya — local markets, neighbourhood restaurants — is more accessible in October.',
    ],
    highlights: [
      'Pleasant 26°C — comfortable for all activities',
      'Sea at 24°C — still great for swimming',
      'Very low crowds — peaceful and relaxed',
      'Lowest prices of the warm season',
      'Golden autumn light — beautiful photography',
    ],
    activities: [
      { name: 'Sightseeing & Day Trips', description: 'October is the best month for day trips — to Side, Manavgat, Antalya, or the canyons — with comfortable temperatures and minimal crowds.' },
      { name: 'Hiking', description: 'The Taurus Mountains are spectacular in October with clear air and comfortable temperatures. Guided hikes operate with small groups.' },
      { name: 'Beach & Swimming', description: 'The sea at 24°C is still excellent for swimming in October. Enjoy uncrowded beaches with plenty of space and clear water.' },
      { name: 'Local Market Experience', description: 'October is ideal for experiencing authentic Alanya — local markets, neighbourhood restaurants, and off-season local life.' },
      { name: 'Photography', description: 'The golden October light is beautiful for photography — Alanya Castle at sunset, the harbour, and coastal walks look spectacular.' },
    ],
    pros: ['Very affordable prices', 'Comfortable temperatures', 'Uncrowded everywhere', 'Still swimmable sea', 'Best for sightseeing and day trips'],
    cons: ['Some beach clubs and restaurants closing', 'More rain than summer', 'Shorter days (8 hours of sun)', 'Nightlife much quieter'],
    faqs: [
      { question: 'Is October a good time to visit Alanya?', answer: 'October is excellent for those who prefer quiet travel, sightseeing, and value for money. The sea is still warm and the weather is very pleasant.' },
      { question: 'Can you swim in Alanya in October?', answer: 'Yes — the sea is 24°C in October, which is comfortable for swimming. The beaches are uncrowded and the conditions are relaxed and pleasant.' },
      { question: 'How cheap is Alanya in October?', answer: 'October prices can be 50-70% lower than August. Hotels, apartments, and excursions all offer significant discounts in the autumn shoulder season.' },
      { question: 'What is the weather like in Alanya in October?', answer: 'Warm and sunny with 26°C daytime temperatures. Around 8 hours of sunshine per day. Some rain (5 days) is more likely than in summer.' },
    ],
    rating: 'great',
  },

  {
    slug: 'alanya-in-november',
    title: 'Alanya in November',
    metaTitle: 'Alanya in November — Off-Season Guide: What to Expect 2026',
    metaDescription: 'Visiting Alanya in November? Expect mild 20°C weather, very few tourists, and very low prices. Find out what\'s open and what to do in off-season Alanya.',
    keywords: ['alanya in november', 'alanya november weather', 'alanya november holiday', 'alanya off season', 'alanya winter november'],
    heroSubtitle: 'Quiet, affordable, and surprisingly mild — November Alanya is perfect for long-stay visitors.',
    weather: { avgHigh: 20, avgLow: 13, seaTemp: 21, sunHours: 6, rainDays: 8 },
    longDescription: [
      'November marks the transition to Alanya\'s off-season. The summer crowds are long gone, many seasonal businesses have closed, and the resort has a completely different character — quieter, more authentic, and considerably cheaper.',
      'Despite this, Alanya in November still offers genuinely mild weather by European standards. At 20°C, November days are warmer than an average summer day in Northern Europe. If you\'re escaping a grey northern winter, Alanya in November feels like a warm refuge.',
      'The sea cools to 21°C — cool for swimming but still possible on warm sunny days. More importantly, Alanya\'s permanent infrastructure is fully accessible: the castle, caves, and historical sites have no queues, and local restaurants offer excellent food at their best prices of the year.',
      'November is ideal for long-stay visitors, retirees, and digital nomads. Monthly rental prices drop dramatically, the city has a pleasant local rhythm, and the surrounding nature — mountains, canyons, rivers — is beautiful after the first autumn rains.',
    ],
    highlights: [
      'Very mild 20°C — warm by European standards',
      'Extremely low prices — best value of the year',
      'Authentic local atmosphere',
      'All historical sites and attractions open',
      'Excellent long-stay value',
    ],
    activities: [
      { name: 'Historical Alanya', description: 'November is ideal for unhurried exploration of the castle, Red Tower, and ancient shipyard — all fully accessible with no crowds.' },
      { name: 'Nature & Walking', description: 'The Dim River and Sapadere Canyon area is lush and cool in November — great for walking and nature photography.' },
      { name: 'Day Trips', description: 'Day trips to Side, Aspendos, or Antalya Old City are excellent in November with comfortable temperatures and no queues.' },
      { name: 'Local Life', description: 'November reveals authentic Alanya — local markets, neighbourhood cafes, and a relaxed city pace without the tourist overlay.' },
      { name: 'Spa & Hamam', description: 'A traditional Turkish hamam is a perfect November experience — warm, relaxing, and deeply local.' },
    ],
    pros: ['Very low prices', 'No crowds anywhere', 'Mild weather vs Northern Europe', 'Authentic local experience', 'Great for long stays'],
    cons: ['Many seasonal businesses closed', 'More rain and cloudy days', 'Sea too cool for most swimmers', 'Limited nightlife and entertainment'],
    faqs: [
      { question: 'Is it worth visiting Alanya in November?', answer: 'Yes, for the right traveler — those seeking peace, low prices, and mild weather. November is not for beach holidays, but excellent for culture, history, and long stays.' },
      { question: 'What is open in Alanya in November?', answer: 'The main attractions (castle, Red Tower, caves, canyons), local restaurants, and permanent businesses are open. Many seasonal beach clubs and tourist restaurants are closed.' },
      { question: 'How cold is Alanya in November?', answer: 'Mild rather than cold — 20°C in the day, 13°C at night. You\'ll need a jacket for evenings but daytimes are comfortable in light clothing.' },
      { question: 'Is November a good time for a long stay in Alanya?', answer: 'Excellent — November prices for monthly apartment rentals can be 60-70% below peak. The city is peaceful, authentic, and the climate is mild.' },
    ],
    rating: 'quiet',
  },

  {
    slug: 'alanya-in-december',
    title: 'Alanya in December',
    metaTitle: 'Alanya in December — Winter Holiday Guide & What to Expect 2026',
    metaDescription: 'Alanya in December: 16°C mild winter weather, very low prices, and a peaceful atmosphere. Discover winter Alanya — what\'s open, what to do, and who it\'s for.',
    keywords: ['alanya in december', 'alanya december weather', 'alanya winter holiday', 'alanya christmas', 'alanya december visit'],
    heroSubtitle: 'Peaceful winter Alanya — mild Mediterranean winter days and the whole city to yourself.',
    weather: { avgHigh: 16, avgLow: 9, seaTemp: 19, sunHours: 5, rainDays: 10 },
    longDescription: [
      'December is firmly off-season in Alanya, but it\'s also when the city shows a completely different, equally appealing face. The streets are quiet, prices are at their lowest, and the permanent resident population goes about its daily life without the summer tourist overlay.',
      'The weather is mild by Mediterranean standards — 16°C in the day is cooler than autumn but still comfortable for walking, sightseeing, and exploring. Alanya\'s position on the Taurus coast means it\'s protected from the worst winter weather, and cold snaps are brief.',
      'December sees some rainfall, and there will be cloudy days — but sunny December days in Alanya are genuinely lovely: crisp air, dramatic skies over the castle, and the castle rock looking its most dramatic against winter clouds.',
      'December is the month for those who want value, authenticity, and a different kind of travel experience. Monthly apartment costs can be a fraction of summer rates, local restaurants serve the best food at the best prices, and you experience Alanya as a real Mediterranean town rather than a holiday resort.',
    ],
    highlights: [
      'Mild 16°C winter — warm by Northern European standards',
      'Absolute lowest prices of the year',
      'Peaceful and authentic local atmosphere',
      'Historical sites fully accessible with no crowds',
      'Perfect for remote workers and long stays',
    ],
    activities: [
      { name: 'Alanya Old City', description: 'December is the best time to explore the castle quarter, ancient cisterns, and Byzantine streets without another tourist in sight.' },
      { name: 'Mountain Villages', description: 'Day trips to the Taurus Mountain villages are wonderful in winter — dramatic scenery, local life, and cool mountain air.' },
      { name: 'Hamam & Wellness', description: 'A winter hamam experience in Alanya is traditional and deeply relaxing — the best time to appreciate this ancient ritual.' },
      { name: 'Local Food & Markets', description: 'December local markets showcase seasonal produce, local crafts, and winter flavours of Turkish cuisine.' },
      { name: 'Photography & Walking', description: 'The castle against winter skies, the harbour in quiet light, and the old town in soft winter sun make for exceptional photography.' },
    ],
    pros: ['Lowest prices of the year', 'Authentic local experience', 'No crowds anywhere', 'Mild vs Northern Europe', 'Ideal for long stays'],
    cons: ['Cool and rainy days possible', 'Many tourist businesses closed', 'Not a beach holiday', 'Limited entertainment options'],
    faqs: [
      { question: 'Is Alanya worth visiting in December?', answer: 'Yes — for culture, peace, and extreme value. December is not for sun and beach, but it\'s excellent for exploration, long stays, and experiencing authentic Turkish life.' },
      { question: 'What is the weather like in Alanya in December?', answer: 'Mild by Northern European standards — 16°C in the day, 9°C at night. Around 10 rainy days, but plenty of sunny winter days too.' },
      { question: 'Does Alanya celebrate Christmas?', answer: 'Alanya has a significant expat community, and some hotels and restaurants mark Christmas. New Year is more widely celebrated, with fireworks and parties.' },
      { question: 'Is December good for long-stay visitors?', answer: 'Excellent — monthly apartment rentals are at their lowest, the city is liveable and pleasant, and the mild winter climate is appealing for those from colder countries.' },
    ],
    rating: 'off-season',
  },

  {
    slug: 'alanya-in-january',
    title: 'Alanya in January',
    metaTitle: 'Alanya in January — Winter Visit Guide: Weather & What to Do 2026',
    metaDescription: 'Alanya in January: 15°C mild winters, very low prices, and a peaceful city. Find out what\'s open, who visits, and whether January Alanya is right for you.',
    keywords: ['alanya in january', 'alanya january weather', 'alanya winter january', 'alanya january holiday', 'alanya winter visit'],
    heroSubtitle: 'Deep winter Alanya — the quietest and most authentic season for those who seek it.',
    weather: { avgHigh: 15, avgLow: 7, seaTemp: 18, sunHours: 5, rainDays: 10 },
    longDescription: [
      'January is the quietest month in Alanya. The summer resort completely transforms — most seasonal businesses are closed, the main beaches are empty, and the town returns to its natural pace as a small Mediterranean city.',
      'At 15°C, January days are mild but can be noticeably cool, especially with wind or rain. Sunny January days, however, are beautiful: clear air, low light, and the castle rock at its most dramatic against a winter sky.',
      'The appeal of January Alanya is entirely about value and authenticity. Long-term stays in quality apartments cost a fraction of summer rates. Local life — markets, neighbourhood restaurants, the fishing harbour — is fully accessible. The mountains are snowcapped, creating a striking backdrop to the blue Mediterranean.',
      'January is particularly popular with retirees and long-stay visitors from Northern Europe (Germany, Netherlands, UK, Scandinavia) who appreciate the mild climate relative to their home winters. The expat community is active, and there are social events and meet-ups throughout the month.',
    ],
    highlights: [
      'Mildest winter on the Turkish Riviera',
      'Lowest rental prices of the year',
      'Active expat community for long-stay visitors',
      'Snow-capped mountains + blue sea backdrop',
      'Fully authentic local life',
    ],
    activities: [
      { name: 'Walking & Photography', description: 'January light is exceptional for photography — the castle, harbour, and old town look their most dramatic in winter.' },
      { name: 'Taurus Mountain Day Trips', description: 'January is the only time you can see snowcapped Taurus peaks from Alanya\'s beaches — a striking contrast.' },
      { name: 'Historical Exploration', description: 'The castle, Syedra Ancient City, and Red Tower are all accessible without queues — a peaceful, contemplative experience.' },
      { name: 'Local Restaurants', description: 'January is when the best local restaurants are at their most authentic — serving winter menus to local customers, not tourist menus.' },
      { name: 'Hamam & Wellness', description: 'Traditional hamam visits are particularly appropriate in winter — warming, traditional, and very affordable off-season.' },
    ],
    pros: ['Absolute lowest prices', 'Peaceful and authentic', 'Good for long stays', 'Mild vs Northern European winters', 'Snow on mountains visible'],
    cons: ['Coolest month (15°C)', 'Most seasonal businesses closed', 'Rainy days likely', 'Not suitable for beach holiday'],
    faqs: [
      { question: 'What is Alanya like in January?', answer: 'Quiet, affordable, and authentic. January Alanya is for those who want to experience the city as a real place, not a holiday resort. The climate is mild but not warm.' },
      { question: 'How cold is Alanya in January?', answer: 'Averages 15°C in the day and 7°C at night — mild compared to Northern Europe. Rainfall and cooler spells are more common than in other months.' },
      { question: 'Is January a good time for a long stay in Alanya?', answer: 'Yes — it\'s the best value month of the year. Monthly rentals can be 70% below peak season prices, and the climate is very liveable for those from colder countries.' },
      { question: 'Are there things to do in Alanya in January?', answer: 'Yes — the castle, historical sites, local restaurants, markets, hamam, and day trips to Antalya or the mountains are all accessible and enjoyable in January.' },
    ],
    rating: 'off-season',
  },

  {
    slug: 'alanya-summer-holidays',
    title: 'Alanya Summer Holidays',
    metaTitle: 'Alanya Summer Holidays 2026 — Beach, Sun & Activities Guide',
    metaDescription: 'Planning Alanya summer holidays? Get the complete guide to Alanya in summer — best beaches, top excursions, where to stay, and tips for the perfect Turkish Riviera holiday.',
    keywords: ['alanya summer holidays', 'alanya beach holiday', 'alanya summer', 'holiday in alanya', 'alanya summer 2026', 'turkish riviera summer'],
    heroSubtitle: 'Everything you need to plan the perfect Alanya summer holiday — beaches, excursions, and insider tips.',
    longDescription: [
      'An Alanya summer holiday delivers the classic Turkish Riviera experience: long sunny days, a warm turquoise sea, and a resort buzzing with energy. Whether you\'re planning a family beach break, a romantic escape, or an action-packed adventure holiday, Alanya delivers on all fronts.',
      'The summer season runs from May through September. The sweet spots for most visitors are May (warm, uncrowded, great value), June-August (peak season with maximum energy and heat), and September (warm sea, fewer crowds, excellent prices). July and August are the most intense months — excellent if you love a lively atmosphere, but requiring advance booking and a tolerance for crowds.',
      'Alanya\'s beaches are its crown jewel. Cleopatra Beach, a Blue Flag strip of golden sand, is the most popular. Keykubat Beach offers a longer stretch with a mix of sunbed zones and free areas. İncekum, Avsallar, and Mahmutlar beaches provide slightly quieter alternatives within easy reach.',
      'Beyond the beach, summer Alanya offers an extraordinary range of activities: boat tours to sea caves, jeep safaris in the Taurus Mountains, rafting on the Dim River, diving in crystal-clear waters, and a nightlife scene that rivals any Mediterranean resort.',
    ],
    highlights: [
      'Blue Flag Cleopatra Beach — golden sand and clear water',
      'Sea temperatures 22–28°C throughout summer',
      'World-class excursions: boat tours, safaris, rafting',
      'Vibrant nightlife and restaurant scene',
      'Excellent value vs comparable Mediterranean destinations',
    ],
    activities: [
      { name: 'Cleopatra Beach', description: 'Alanya\'s most famous beach — a Blue Flag stretch of golden sand with sunbed rental, beach bars, and clear Mediterranean water.' },
      { name: 'Pirate Boat Tour', description: 'The quintessential Alanya experience — a full day cruise to sea caves, swimming stops, and the famous Lover\'s Cave.' },
      { name: 'Jeep Safari', description: 'A full-day off-road adventure through Taurus Mountain villages with lunch, swimming, and spectacular scenery.' },
      { name: 'Scuba Diving', description: 'Alanya\'s waters offer excellent visibility and interesting dive sites — suitable for beginners and experienced divers.' },
      { name: 'Alanya Nightlife', description: 'From beachfront bars to rooftop clubs — Alanya\'s summer nightlife is one of the best on the Turkish coast.' },
    ],
    pros: ['World-class beaches', 'Warm sea all summer', 'Huge range of activities', 'Excellent value vs Ibiza/Greece', 'Family friendly'],
    cons: ['Peak July-August can be very hot and crowded', 'Advance booking needed for best prices', 'Busy beach areas in peak season'],
    faqs: [
      { question: 'When is the best time for a summer holiday in Alanya?', answer: 'May and September offer the best combination of warm weather, warm sea, low crowds, and affordable prices. June-August is perfect if you love peak season energy.' },
      { question: 'How long should I spend in Alanya?', answer: 'Most visitors stay 7-14 days. A week is enough for the beach, main excursions, and the castle. Two weeks allows you to explore further afield and enjoy a more relaxed pace.' },
      { question: 'Is Alanya good for families?', answer: 'Excellent — the calm shallow beaches (especially İncekum), the range of family excursions, the water parks, and the safe resort environment make Alanya very family-friendly.' },
      { question: 'How do I get to Alanya?', answer: 'The closest airport is Gazipaşa-Alanya (GZP), a 45-minute transfer. Antalya Airport (AYT) is larger with more international flights and a 2-hour transfer. Pre-booking an airport transfer is recommended.' },
    ],
    rating: 'excellent',
  },

  {
    slug: 'alanya-winter-holiday',
    title: 'Alanya Winter Holiday',
    metaTitle: 'Alanya Winter Holiday 2026 — Guide to Off-Season Alanya',
    metaDescription: 'Planning an Alanya winter holiday? Discover mild 15-20°C winters, very low prices, and a peaceful city. The complete guide to Alanya in winter for long-stay visitors.',
    keywords: ['alanya winter holiday', 'alanya in winter', 'alanya winter', 'alanya winter visit', 'alanya off season holiday'],
    heroSubtitle: 'Escape northern winters for Alanya\'s mild Mediterranean climate — peaceful, affordable, and authentic.',
    longDescription: [
      'An Alanya winter holiday offers something entirely different from the summer experience — and for many visitors, something they prefer. The resort transforms from a buzzing holiday destination into a calm Mediterranean town, where the real rhythm of Turkish life takes centre stage.',
      'Winter in Alanya runs from November through March. Temperatures are mild by Northern European standards — 15-20°C during the day is warm enough for comfortable walking, sightseeing, and outdoor café culture. Cold snaps do occur but are brief, and Alanya\'s sheltered coastal position means it\'s warmer than most of the Turkish Mediterranean in winter.',
      'The practical appeal of winter Alanya is strong. Accommodation costs drop dramatically — monthly apartment rentals can be 60-70% below peak season. Local restaurants offer their best prices and most authentic menus. Alanya Castle, the caves, the canyons, and all historical sites are completely accessible without queues.',
      'A growing community of long-stay visitors — retirees, remote workers, and "snowbirds" from Germany, the Netherlands, UK, and Scandinavia — has made Alanya one of the most popular winter retreat destinations in the Mediterranean. The infrastructure for long-stay visitors is excellent: supermarkets, healthcare, English-speaking services, and a well-connected expat community.',
    ],
    highlights: [
      'Mild 15-20°C — warm escape from Northern winters',
      'Very affordable long-stay accommodation',
      'Active expat community and social scene',
      'All historical attractions open with no queues',
      'Authentic Turkish city life experience',
    ],
    activities: [
      { name: 'Alanya Castle & Historical Sites', description: 'Winter is the best time for deep exploration of Alanya\'s historical treasures — no queues, peaceful atmosphere, and dramatic winter light.' },
      { name: 'Taurus Mountain Excursions', description: 'Day trips to mountain villages, waterfalls, and canyons are excellent in winter — cooler temperatures and beautiful winter scenery.' },
      { name: 'Day Trips to Antalya', description: 'Antalya\'s stunning old city (Kaleiçi) and world-class Archaeological Museum are perfect winter cultural outings from Alanya.' },
      { name: 'Local Market Culture', description: 'Winter markets reveal authentic Turkish life — seasonal produce, local crafts, and the rhythm of a real Mediterranean town.' },
      { name: 'Hamam & Wellness', description: 'Traditional Turkish hamam is the quintessential winter experience — warming, relaxing, and deeply cultural.' },
    ],
    pros: ['Lowest prices of the year', 'Peaceful and authentic', 'Mild climate vs Northern Europe', 'Active expat community', 'All sights fully accessible'],
    cons: ['Not a beach holiday', 'Rain and cloudy days more frequent', 'Many seasonal businesses closed', 'Shorter daylight hours'],
    faqs: [
      { question: 'Is Alanya nice in winter?', answer: 'Yes — for the right visitor. Winter Alanya is peaceful, authentic, and very affordable. It\'s not suitable for a beach holiday, but excellent for culture, long stays, and escaping northern winters.' },
      { question: 'How warm is Alanya in winter?', answer: 'Mild: November 20°C, December 16°C, January 15°C, February 15°C, March 17°C. Warmer than most of Europe, though cooler days and rain are regular.' },
      { question: 'Is Alanya good for long-stay winter visits?', answer: 'Alanya is one of the most popular long-stay winter destinations in the Mediterranean, particularly for Northern Europeans. Infrastructure, community, and value are all excellent.' },
      { question: 'What is open in Alanya in winter?', answer: 'All permanent infrastructure: supermarkets, local restaurants, cafes, the castle and historical sites, healthcare, banks. Many tourist-oriented seasonal businesses are closed.' },
    ],
    rating: 'quiet',
  },

  {
    slug: 'best-time-to-visit-alanya',
    title: 'Best Time to Visit Alanya',
    metaTitle: 'Best Time to Visit Alanya — Month-by-Month Guide 2026',
    metaDescription: 'Find the best time to visit Alanya for your holiday. Month-by-month weather guide, crowd levels, prices, and expert recommendations for every type of traveler.',
    keywords: ['best time to visit alanya', 'when to visit alanya', 'alanya best month', 'alanya best season', 'alanya travel guide'],
    heroSubtitle: 'The honest, month-by-month guide to when you should visit Alanya — for every type of traveler.',
    longDescription: [
      'The best time to visit Alanya depends on what you\'re looking for. If maximum beach weather is your priority, the answer is different from if you want quiet exploration or the best value for money. This guide breaks down every month so you can make the right choice for your holiday.',
      'For beach holidays and swimming: May, June, and September are the sweet spots. The sea is warm (22-27°C), the weather is excellent, and the crowds are manageable. July and August offer the warmest sea (28°C) but with maximum crowds and prices. April is borderline — 19°C sea is cool for swimming but perfect for everything else.',
      'For sightseeing, culture, and day trips: April, May, October, and November are ideal. Comfortable temperatures, no queues at attractions, and lower prices make these shoulder months the best for anyone who wants to do more than lie on a beach.',
      'For long stays and maximum value: November through March offers dramatic savings on accommodation — often 60-70% below peak season. The weather is mild by Northern European standards, the city is authentic and peaceful, and the infrastructure for long-stay visitors is excellent. This is the choice of the growing community of "snowbirds" who spend their winters in Alanya.',
    ],
    highlights: [
      'May & September: best overall combination of weather, value, and low crowds',
      'July & August: peak season — hottest sea, maximum energy, book in advance',
      'April & October: ideal for sightseeing, very affordable',
      'November–March: long-stay value season — mild climate, lowest prices',
      'Year-round destination: something to offer every month',
    ],
    activities: [
      { name: 'Month-by-Month Summary', description: 'Apr: Great (20°C, uncrowded) | May: Excellent (25°C, warm sea) | Jun: Excellent (30°C, peak begins) | Jul-Aug: Peak (34°C, 28°C sea) | Sep: Excellent (31°C, less crowded) | Oct: Great (26°C, very quiet) | Nov-Mar: Off-season (15-20°C, lowest prices).' },
      { name: 'Beach Season', description: 'The beach season runs May-October. Swimming is comfortable from May (22°C sea) through October (24°C). Peak sea temperature of 28°C is July-August.' },
      { name: 'Excursion Season', description: 'All major excursions (boat tours, jeep safari, rafting, diving) operate April-October. Some operate in November. A few year-round options exist.' },
      { name: 'Budget Travel', description: 'For the lowest prices: November-March. For good value with full beach experience: May and September. Peak prices: July-August.' },
    ],
    pros: ['Year-round destination', 'Excellent summer beach season', 'Great shoulder season options', 'Strong off-season value'],
    cons: ['Peak season (Jul-Aug) can be very crowded and expensive', 'Some months have limited beach use', 'Rain is possible from October onwards'],
    faqs: [
      { question: 'What is the best month to visit Alanya?', answer: 'May and September are the most consistently recommended months — warm sea, good weather, low crowds, and affordable prices. They offer the best overall balance.' },
      { question: 'Is Alanya better in May or September?', answer: 'Both are excellent. May has a slightly more vibrant atmosphere as the season opens. September has slightly warmer sea (27°C vs 22°C) and even lower crowds after the school return. It\'s a close call.' },
      { question: 'When should I avoid Alanya?', answer: 'July and August are best avoided if you dislike crowds and heat. The beaches are very busy, prices are highest, and the midday heat (34°C) can be intense. If you go, book everything months in advance.' },
      { question: 'Is Alanya a year-round destination?', answer: 'Yes — Alanya has something to offer every month. The character of the destination changes dramatically by season, but there\'s a growing visitor base who come specifically for the off-season experience.' },
    ],
    rating: 'excellent',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

export function getSeasonalPage(slug: string): SeasonalPage | undefined {
  return SEASONAL_PAGES.find(p => p.slug === slug);
}

export const RATING_LABELS: Record<SeasonRating, string> = {
  excellent: 'Excellent',
  great: 'Great',
  good: 'Good',
  quiet: 'Quiet Season',
  'off-season': 'Off-Season',
};

export const RATING_COLORS: Record<SeasonRating, string> = {
  excellent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  great: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  quiet: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'off-season': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};
