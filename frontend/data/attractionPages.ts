export type AttractionJsonLdType =
  | 'TouristAttraction'
  | 'Beach'
  | 'LandmarksOrHistoricalBuildings'
  | 'TouristTrip';

export interface Attraction {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  longDescription: string;
  practicalInfo: {
    hours?: string;
    admission?: string;
    howToGet?: string;
    tips?: string;
  };
  coordinates: { lat: number; lng: number };
  jsonLdType: AttractionJsonLdType;
  searchKeywords: string[];
  relatedExcursionSlugs: string[];
  relatedAttractionSlugs: string[];
  priority?: string;
}

export const ATTRACTIONS: Attraction[] = [
  {
    slug: 'cleopatra-beach',
    title: 'Cleopatra Beach',
    metaTitle: 'Cleopatra Beach Alanya — Sandy Beach Near the Castle',
    metaDescription: 'Cleopatra Beach is Alanya\'s most famous sandy beach, stretching below the medieval castle with crystal-clear waters, water sports, and stunning views.',
    keywords: ['cleopatra beach alanya', 'alanya beach', 'cleopatra beach', 'best beach alanya', 'alanya sandy beach', 'cleopatra beach water sports'],
    longDescription: 'Cleopatra Beach is the crown jewel of Alanya\'s coastline, a long stretch of fine golden sand lapped by the clear turquoise waters of the Mediterranean. Named after the legendary Egyptian queen who reportedly swam here, the beach offers a perfect mix of natural beauty and modern amenities. Lifeguards, sunbeds, water sports rentals, and beachside cafes line the promenade, while the dramatic silhouette of Alanya Castle towers above.',
    practicalInfo: {
      hours: 'Open 24 hours, lifeguards 09:00–19:00',
      admission: 'Free (sunbeds ~50 TL)',
      howToGet: '15 min walk from Alanya center, or local bus along the coastal road',
      tips: 'Arrive early in summer for a good spot. The western end near the castle is quieter.',
    },
    coordinates: { lat: 36.5444, lng: 31.9797 },
    jsonLdType: 'Beach',
    searchKeywords: ['beach', 'swimming', 'cleopatra', 'sandy', 'water sports'],
    relatedExcursionSlugs: ['alanya-boat-tours', 'parasailing-alanya'],
    relatedAttractionSlugs: ['incekum-beach', 'keykubat-beach'],
    priority: '0.9',
  },
  {
    slug: 'incekum-beach',
    title: 'Incekum Beach',
    metaTitle: 'Incekum Beach Alanya — Quiet Sandy Beach for Families',
    metaDescription: 'Incekum Beach is a peaceful sandy beach 20 km west of Alanya, perfect for families with shallow waters and a relaxed atmosphere away from the crowds.',
    keywords: ['incekum beach', 'incekum alanya', 'quiet beach alanya', 'family beach alanya', 'alanya beach holiday', 'incekum resort'],
    longDescription: 'Incekum Beach, meaning "fine sand" in Turkish, lives up to its name with soft pale sand and gently shelving waters ideal for families with young children. Located about 20 km west of Alanya, this Blue Flag beach offers a tranquil alternative to the busier city beaches. The surrounding pine-covered hills provide natural shade and a stunning backdrop.',
    practicalInfo: {
      hours: 'Open 24 hours',
      admission: 'Free',
      howToGet: 'Local bus from Alanya center (30 min), or taxi (~200 TL)',
      tips: 'Weekdays are much quieter than weekends. Bring snorkeling gear — the water clarity is excellent.',
    },
    coordinates: { lat: 36.6260, lng: 31.7770 },
    jsonLdType: 'Beach',
    searchKeywords: ['beach', 'incekum', 'family', 'quiet', 'sandy'],
    relatedExcursionSlugs: ['alanya-boat-tours'],
    relatedAttractionSlugs: ['cleopatra-beach'],
  },
  {
    slug: 'keykubat-beach',
    title: 'Keykubat Beach',
    metaTitle: 'Keykubat Beach Alanya — Eastside Beach with Cafes & Promenade',
    metaDescription: 'Keykubat Beach on Alanya\'s eastern side offers a long promenade, beachside cafes, and calm waters — ideal for a relaxed day by the sea.',
    keywords: ['keykubat beach alanya', 'alanya east beach', 'keykubat plaji', 'alanya promenade beach', 'beach cafes alanya'],
    longDescription: 'Keykubat Beach stretches along Alanya\'s eastern coastline, offering a more laid-back atmosphere than its famous western neighbor. A well-maintained promenade connects numerous cafes, restaurants, and beach bars, making it easy to spend a full day here without leaving the waterfront. The gentle slope into the sea makes it popular with locals and returning visitors who prefer its quieter vibe.',
    practicalInfo: {
      hours: 'Open 24 hours',
      admission: 'Free',
      howToGet: '10 min walk from Alanya harbor, along the eastern promenade',
      tips: 'The beachside fish restaurants here are excellent and reasonably priced. Great for sunset views.',
    },
    coordinates: { lat: 36.5475, lng: 31.9985 },
    jsonLdType: 'Beach',
    searchKeywords: ['beach', 'keykubat', 'promenade', 'cafes', 'relaxed'],
    relatedExcursionSlugs: ['parasailing-alanya'],
    relatedAttractionSlugs: ['cleopatra-beach'],
  },
  {
    slug: 'dim-cave',
    title: 'Dim Cave',
    metaTitle: 'Dim Cave Alanya — Underground Limestone Cave with Stalactites',
    metaDescription: 'Explore Dim Cave near Alanya: a stunning underground limestone cave with colorful stalactites, stalagmites, and an underground lake just 15 km from the city.',
    keywords: ['dim cave alanya', 'alanya cave tour', 'dim magarasi', 'stalactite cave alanya', 'alanya underground cave', 'dim cave entrance fee'],
    longDescription: 'Dim Cave is one of Turkey\'s most impressive show caves, located just 15 km from Alanya in the Dim River valley. This ancient limestone cave stretches over 360 meters into the mountain, revealing spectacular stalactites and stalagmites formed over millions of years. Colored lighting highlights the natural formations, and an underground lake near the end adds to the otherworldly atmosphere. The cave stays a cool 18–20°C year-round — a perfect escape from the summer heat.',
    practicalInfo: {
      hours: '09:00–19:00 daily (summer), 09:00–17:00 (winter)',
      admission: '~60 TL',
      howToGet: 'Local bus or taxi from Alanya (15 km east), or combine with a Dim River tour',
      tips: 'Wear non-slip shoes — the path can be wet inside. Bring a light jacket; the cave is cool even in summer.',
    },
    coordinates: { lat: 36.4590, lng: 32.0730 },
    jsonLdType: 'TouristAttraction',
    searchKeywords: ['cave', 'dim', 'stalactite', 'underground', 'nature'],
    relatedExcursionSlugs: ['alanya-jeep-safari'],
    relatedAttractionSlugs: ['dim-river'],
    priority: '0.9',
  },
  {
    slug: 'dim-river',
    title: 'Dim River',
    metaTitle: 'Dim River Alanya — Swimming, Rafting & Riverside Restaurants',
    metaDescription: 'The Dim River near Alanya offers natural swimming pools, rafting adventures, and riverside fish restaurants in a stunning mountain setting.',
    keywords: ['dim river alanya', 'dim river restaurants', 'dim cayi alanya', 'alanya rafting', 'dim river swimming', 'alanya river tour'],
    longDescription: 'The Dim River flows through a dramatic gorge east of Alanya, creating natural swimming pools and offering some of the region\'s best rafting. The riverside restaurants, perched on platforms above the cool mountain water, serve fresh trout caught from the river itself. Whether you come for an adrenaline-pumping rafting trip or a lazy afternoon meal with your feet in the water, the Dim River is a must-visit escape from the coastal heat.',
    practicalInfo: {
      hours: 'Open year-round (rafting season: April–October)',
      admission: 'Free access; rafting tours from ~300 TL/person',
      howToGet: '30 min drive east from Alanya, or book a tour with hotel transfer',
      tips: 'The riverside restaurants are busiest at lunchtime — come early or late for a quieter experience.',
    },
    coordinates: { lat: 36.4620, lng: 32.0520 },
    jsonLdType: 'TouristAttraction',
    searchKeywords: ['river', 'dim', 'rafting', 'swimming', 'restaurant', 'nature'],
    relatedExcursionSlugs: ['alanya-rafting'],
    relatedAttractionSlugs: ['dim-cave', 'green-canyon'],
  },
  {
    slug: 'sapadere-canyon',
    title: 'Sapadere Canyon',
    metaTitle: 'Sapadere Canyon Alanya — Hidden Gorge with Waterfalls',
    metaDescription: 'Walk through Sapadere Canyon\'s dramatic gorge, swim under waterfalls, and explore a traditional village — one of Alanya\'s most stunning natural attractions.',
    keywords: ['sapadere canyon', 'sapadere canyon alanya', 'alanya canyon tour', 'sapadere waterfall', 'alanya nature attraction', 'sapadere village'],
    longDescription: 'Hidden deep in the Taurus Mountains, Sapadere Canyon is a breathtaking natural wonder that remained unknown to tourists until walkways were built in 2008. Wooden pathways wind through the narrow gorge, past cascading waterfalls and emerald pools so clear you can see the riverbed below. The canyon walk takes about an hour, ending at a traditional Sapadere village where you can experience authentic Turkish village life and sample homemade gözleme.',
    practicalInfo: {
      hours: '08:00–19:00 daily (April–October), 09:00–17:00 (November–March)',
      admission: '~40 TL',
      howToGet: 'Book a guided tour from Alanya (hotel transfer included), or drive 30 km east',
      tips: 'Wear water shoes — the pathways can be slippery. The water is refreshing even in summer.',
    },
    coordinates: { lat: 36.5040, lng: 32.1500 },
    jsonLdType: 'TouristAttraction',
    searchKeywords: ['sapadere', 'canyon', 'waterfall', 'gorge', 'nature', 'village'],
    relatedExcursionSlugs: ['sapadere-canyon-tour'],
    relatedAttractionSlugs: ['dim-cave'],
  },
  {
    slug: 'alanya-castle',
    title: 'Alanya Castle',
    metaTitle: 'Alanya Castle — Seljuk Fortress with Panoramic Sea Views',
    metaDescription: 'Visit Alanya Castle, a 13th-century Seljuk fortress perched above the city with stunning panoramic views, ancient walls, and the iconic Red Tower.',
    keywords: ['alanya castle', 'alanya kalesi', 'alanya fortress', 'seljuk castle alanya', 'red tower alanya', 'alanya castle views'],
    longDescription: 'Alanya Castle is the city\'s most iconic landmark, a sprawling 13th-century Seljuk fortress that crowns the rocky peninsula dividing Alanya\'s two main beaches. Built by Sultan Alaeddin Keykubat I in 1226, the castle walls stretch over 6 km, encircling the old town, the Red Tower, and the shipyard below. Today, parts of the fortress are open to visitors, with panoramic viewpoints offering breathtaking views over the Mediterranean, the Taurus Mountains, and the city below.',
    practicalInfo: {
      hours: '09:00–19:00 daily (summer), 08:30–17:00 (winter)',
      admission: '~30 TL (cable car extra ~60 TL round trip)',
      howToGet: 'Cable car from Cleopatra Beach, or drive/taxi up the hill. Walking takes ~30 min uphill.',
      tips: 'The cable car offers the best views on the way up. Visit in the late afternoon for golden-hour photos.',
    },
    coordinates: { lat: 36.5400, lng: 31.9945 },
    jsonLdType: 'LandmarksOrHistoricalBuildings',
    searchKeywords: ['castle', 'fortress', 'seljuk', 'history', 'views', 'keykubat'],
    relatedExcursionSlugs: ['alanya-city-tour'],
    relatedAttractionSlugs: ['red-tower-alanya', 'alanya-shipyard'],
    priority: '0.9',
  },
  {
    slug: 'red-tower-alanya',
    title: 'Red Tower (Kızıl Kule)',
    metaTitle: 'Red Tower Alanya — 13th-Century Octagonal Seljuk Landmark',
    metaDescription: 'The Red Tower is Alanya\'s iconic octagonal 13th-century fortress tower, housing an ethnographic museum with stunning harbor views from the top.',
    keywords: ['red tower alanya', 'kizil kule', 'alanya red tower', 'octagonal tower alanya', 'seljuk tower alanya', 'alanya harbor tower'],
    longDescription: 'The Red Tower (Kızıl Kule) stands as Alanya\'s most recognizable landmark, a striking 33-meter-tall octagonal tower built in 1226 by the Seljuk Sultan Alaeddin Keykubat I to defend the city\'s shipyard. Its distinctive red brick cladding gives it its name and makes it visible from across the harbor. Inside, the tower houses a small ethnographic museum showcasing Seljuk and Ottoman artifacts. Climb to the top for panoramic views of the harbor, castle hill, and the Mediterranean stretching to the horizon.',
    practicalInfo: {
      hours: '09:00–18:00 Tuesday–Sunday (closed Mondays)',
      admission: '~15 TL',
      howToGet: 'Located at the harbor in central Alanya, a 5 min walk from the city center',
      tips: 'Combine with the shipyard visit — they\'re right next to each other. The top floor has the best photos.',
    },
    coordinates: { lat: 36.5420, lng: 31.9960 },
    jsonLdType: 'LandmarksOrHistoricalBuildings',
    searchKeywords: ['red tower', 'kizil kule', 'seljuk', 'fortress', 'museum', 'harbor'],
    relatedExcursionSlugs: ['alanya-city-tour'],
    relatedAttractionSlugs: ['alanya-castle', 'alanya-shipyard'],
  },
  {
    slug: 'alanya-shipyard',
    title: 'Alanya Shipyard (Tersane)',
    metaTitle: 'Alanya Shipyard — 13th-Century Seljuk Naval Dockyard',
    metaDescription: 'Explore Alanya\'s 13th-century shipyard carved into the cliffs — the only surviving Seljuk naval dockyard and a unique piece of Mediterranean maritime history.',
    keywords: ['alanya shipyard', 'alanya tersane', 'seljuk shipyard', 'alanya naval museum', 'alanya dockyard', 'medieval shipyard'],
    longDescription: 'The Alanya Shipyard (Tersane) is a remarkable 13th-century naval dockyard carved directly into the rocky cliffs of the peninsula. Built in 1227 by order of Sultan Alaeddin Keykubat I, it is the only surviving Seljuk shipyard in the world and one of the best-preserved medieval dockyards in the Mediterranean. Five vaulted bays could shelter ships up to 40 meters long, and a small mosque within the complex served the sailors. Today, you can walk through the ancient dry docks and imagine the galleys that were once built and repaired here.',
    practicalInfo: {
      hours: '09:00–18:00 daily (summer), 09:00–17:00 (winter)',
      admission: '~15 TL (combined ticket with Red Tower available)',
      howToGet: 'Next to the Red Tower at the harbor, 5 min walk from Alanya center',
      tips: 'Visit in the morning when the light streams through the arched entrances. The combined ticket with the Red Tower is better value.',
    },
    coordinates: { lat: 36.5425, lng: 31.9975 },
    jsonLdType: 'LandmarksOrHistoricalBuildings',
    searchKeywords: ['shipyard', 'tersane', 'seljuk', 'naval', 'dockyard', 'history'],
    relatedExcursionSlugs: ['alanya-boat-tours'],
    relatedAttractionSlugs: ['alanya-castle', 'red-tower-alanya'],
  },
  {
    slug: 'syedra-ancient-city',
    title: 'Syedra Ancient City',
    metaTitle: 'Syedra Ancient City — Roman Ruins Near Alanya',
    metaDescription: 'Discover the ancient Roman city of Syedra near Alanya, with well-preserved mosaics, a Roman bath, and panoramic sea views from its clifftop location.',
    keywords: ['syedra ancient city', 'syedra alanya', 'roman ruins alanya', 'ancient city alanya', 'syedra mosaics', 'alanya archaeology'],
    longDescription: 'Syedra was a prosperous Roman city perched on a hilltop overlooking the Mediterranean, 20 km southeast of Alanya. Founded in the 3rd century BC, it flourished under Roman rule and was eventually abandoned in the 13th century. Today, visitors can explore the ruins of a Roman bath complex with remarkably preserved mosaics, a colonnaded street, an amphitheater with sea views, and the city\'s impressive defensive walls. The site remains largely unrestored, giving it an authentic, adventurous feel.',
    practicalInfo: {
      hours: 'Open 24 hours (ungated site)',
      admission: 'Free',
      howToGet: '30 min drive southeast from Alanya; best accessed by rental car or guided tour',
      tips: 'Bring water and sun protection — there is no shade or facilities on site. Wear sturdy shoes for the rocky terrain.',
    },
    coordinates: { lat: 36.4830, lng: 32.0840 },
    jsonLdType: 'LandmarksOrHistoricalBuildings',
    searchKeywords: ['syedra', 'ancient', 'roman', 'ruins', 'mosaics', 'archaeology'],
    relatedExcursionSlugs: ['alanya-jeep-safari'],
    relatedAttractionSlugs: ['dim-cave'],
  },
  {
    slug: 'manavgat-waterfall',
    title: 'Manavgat Waterfall',
    metaTitle: 'Manavgat Waterfall — Scenic River Cascade Near Alanya',
    metaDescription: 'Visit Manavgat Waterfall, a wide cascade on the Manavgat River near Side — a scenic picnic spot with riverside restaurants and easy access from Alanya.',
    keywords: ['manavgat waterfall', 'manavgat falls', 'manavgat waterfall alanya', 'manavgat river', 'waterfall near alanya', 'manavgat picnic'],
    longDescription: 'The Manavgat Waterfall is a wide, low cascade on the Manavgat River, about 3 km north of Manavgat town. Though not tall, the waterfall stretches impressively across the river, creating a popular spot for picnics, riverside dining, and boat trips. The surrounding park has shaded seating areas, and several restaurants serve fresh trout overlooking the falls. It\'s an easy day trip from Alanya, often combined with a visit to Side\'s ancient ruins.',
    practicalInfo: {
      hours: 'Open 24 hours (park: 08:00–22:00)',
      admission: 'Free (parking ~10 TL)',
      howToGet: '45 min drive from Alanya, or book a combined Manavgat/Side tour',
      tips: 'The riverside restaurants are excellent for lunch. Combine with a visit to Side\'s ancient city and Apollo Temple.',
    },
    coordinates: { lat: 36.4660, lng: 31.4420 },
    jsonLdType: 'TouristAttraction',
    searchKeywords: ['manavgat', 'waterfall', 'river', 'cascade', 'picnic', 'nature'],
    relatedExcursionSlugs: [],
    relatedAttractionSlugs: ['green-canyon'],
  },
  {
    slug: 'side-day-trip',
    title: 'Side Day Trip',
    metaTitle: 'Day Trip to Side from Alanya — Ancient City & Beach',
    metaDescription: 'Plan a day trip to Side from Alanya: explore the Temple of Apollo, Roman theater, and ancient harbor, then relax on the beach beside 2,000-year-old ruins.',
    keywords: ['side day trip', 'side alanya', 'temple of apollo side', 'side ancient city', 'side turkey', 'day trip from alanya to side'],
    longDescription: 'A day trip to Side from Alanya takes you to one of Turkey\'s most atmospheric ancient cities. Side\'s remarkably preserved ruins sit directly on a sandy Mediterranean beach — you can literally swim beside Roman columns. The highlight is the Temple of Apollo at sunset, one of the most photographed spots on the Turkish Riviera. Wander through the Roman theater (seating 15,000), explore the agora and the Roman bath museum, then finish the day with fresh seafood at the old harbor.',
    practicalInfo: {
      hours: 'Ancient sites: 09:00–19:00 (summer), 08:30–17:30 (winter)',
      admission: 'Combined museum ticket ~100 TL, Temple of Apollo area is free',
      howToGet: '1 hour drive from Alanya; regular buses from Alanya otogar, or guided tour with hotel pickup',
      tips: 'Visit the Temple of Apollo at sunset for the best photos. The museum ticket covers multiple sites and is good value.',
    },
    coordinates: { lat: 36.7680, lng: 31.3910 },
    jsonLdType: 'TouristTrip',
    searchKeywords: ['side', 'ancient', 'apollo', 'roman', 'beach', 'day trip', 'temple'],
    relatedExcursionSlugs: ['alanya-city-tour'],
    relatedAttractionSlugs: ['manavgat-waterfall'],
  },
  {
    slug: 'green-canyon',
    title: 'Green Canyon',
    metaTitle: 'Green Canyon Alanya — Oymapınar Dam Lake & Boat Cruise',
    metaDescription: 'Green Canyon is a stunning emerald lake surrounded by dramatic canyon walls near Alanya. Take a boat cruise, swim in pristine waters, and enjoy mountain scenery.',
    keywords: ['green canyon alanya', 'oymapinar dam', 'green canyon boat tour', 'alanya lake cruise', 'green canyon swimming', 'alanya nature trip'],
    longDescription: 'The Green Canyon is the stunning reservoir of the Oymapınar Dam, nestled in the Taurus Mountains about 25 km from Alanya. The lake\'s vivid emerald color comes from the mineral-rich mountain springs that feed it. Boat cruises take visitors through narrow canyon walls that rise dramatically from the water, with stops for swimming in the crystal-clear lake. The surrounding pine forests and the sheer rock faces create a landscape that feels a world away from the coastal resorts.',
    practicalInfo: {
      hours: 'Tours run 09:00–17:00 (April–October)',
      admission: 'Tours from ~300 TL/person (includes lunch and hotel transfer)',
      howToGet: 'Book a guided tour from Alanya with hotel transfer, or drive 25 km north',
      tips: 'Bring a towel and swimwear. The lake water is cool and refreshing. Morning tours are less crowded.',
    },
    coordinates: { lat: 36.4650, lng: 31.8250 },
    jsonLdType: 'TouristAttraction',
    searchKeywords: ['green canyon', 'oymapinar', 'lake', 'cruise', 'canyon', 'nature', 'swimming'],
    relatedExcursionSlugs: ['green-canyon-tour'],
    relatedAttractionSlugs: ['dim-river'],
  },
];

export function getAttraction(slug: string): Attraction | undefined {
  return ATTRACTIONS.find(a => a.slug === slug);
}