export interface ExcursionType {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  longDescription: string;
  searchKeywords: string[];
  relatedAttractions: string[];
  relatedExcursionSlugs: string[];
  jsonLdType: 'TouristTrip';
  priority?: string;
}

export const EXCURSION_TYPES: ExcursionType[] = [
  {
    slug: 'alanya-boat-tours',
    title: 'Boat Tours in Alanya',
    metaTitle: 'Alanya Boat Tours — Pirate Ship, Catamaran & Sunset Cruises',
    metaDescription: 'Book the best boat tours in Alanya: pirate ship adventures, catamaran cruises, and sunset trips along the Turkish Riviera. Free hotel transfer included.',
    keywords: ['alanya boat tour', 'pirate boat tour alanya', 'alanya catamaran tour', 'alanya sunset cruise', 'boat trip alanya', 'alanya sea tour'],
    longDescription: 'Explore the stunning Turkish Riviera coastline on an Alanya boat tour. Choose from pirate ship adventures perfect for families, relaxed catamaran cruises, or romantic sunset trips along the Mediterranean. All tours include hotel pickup, swimming stops in crystal-clear bays, and onboard entertainment.',
    searchKeywords: ['boat', 'pirate', 'catamaran', 'sunset', 'cruise', 'sea', 'yacht'],
    relatedAttractions: ['cleopatra-beach', 'alanya-castle'],
    relatedExcursionSlugs: ['parasailing-alanya', 'alanya-yacht-charter', 'scuba-diving-alanya'],
    jsonLdType: 'TouristTrip',
    priority: '0.9',
  },
  {
    slug: 'alanya-jeep-safari',
    title: 'Jeep Safari in Alanya',
    metaTitle: 'Alanya Jeep Safari — Off-Road Adventure Tours',
    metaDescription: 'Experience Alanya jeep safari tours through the Taurus Mountains. Off-road adventure with village visits, mud baths, and stunning views. Book online.',
    keywords: ['alanya jeep safari', 'alanya quad safari', 'alanya buggy safari', 'off-road alanya', 'jeep tour alanya', 'alanya mountain safari'],
    longDescription: 'Hit the dusty trails of the Taurus Mountains on an Alanya jeep safari. These off-road adventures take you through authentic Turkish villages, past breathtaking mountain viewpoints, and into natural mud baths. A thrilling day out for adventure seekers and families alike.',
    searchKeywords: ['jeep', 'safari', 'off-road', 'quad', 'buggy', 'mountain', 'adventure'],
    relatedAttractions: ['dim-river', 'sapadere-canyon'],
    relatedExcursionSlugs: ['alanya-rafting', 'green-canyon-tour'],
    jsonLdType: 'TouristTrip',
    priority: '0.9',
  },
  {
    slug: 'alanya-buggy-safari',
    title: 'Buggy Safari in Alanya',
    metaTitle: 'Alanya Buggy Safari — Drive Your Own Off-Road Buggy',
    metaDescription: 'Drive your own off-road buggy through Alanya\'s stunning countryside. Mud, dust, and pure adventure on specially designed tracks and trails.',
    keywords: ['alanya buggy safari', 'buggy rental alanya', 'dune buggy alanya', 'alanya off-road driving'],
    longDescription: 'Take the wheel of a powerful dune buggy and tear through Alanya\'s rugged terrain. Buggy safaris offer a hands-on off-road experience with mud tracks, forest trails, and open countryside. No previous driving experience needed — full instruction provided.',
    searchKeywords: ['buggy', 'dune buggy', 'off-road', 'driving', 'adventure'],
    relatedAttractions: ['dim-river'],
    relatedExcursionSlugs: ['alanya-jeep-safari', 'alanya-rafting'],
    jsonLdType: 'TouristTrip',
  },
  {
    slug: 'alanya-rafting',
    title: 'Rafting in Alanya',
    metaTitle: 'Alanya Rafting Tour — Köprülü Canyon White Water Adventure',
    metaDescription: 'Book Alanya rafting tours on the Köprülü River. White water adventure through stunning canyons with professional guides. Canyoning options available.',
    keywords: ['alanya rafting tour', 'rafting alanya', 'canyoning alanya', 'white water alanya', 'koprulu canyon rafting', 'alanya water adventure'],
    longDescription: 'Navigate the rapids of the Köprülü River on an Alanya rafting tour. This exhilarating white water adventure takes you through a stunning national park canyon with towering cliffs and emerald pools. Suitable for beginners and experienced rafters, with professional guides ensuring safety throughout.',
    searchKeywords: ['rafting', 'canoe', 'kayak', 'canyon', 'water', 'river', 'adventure'],
    relatedAttractions: ['green-canyon'],
    relatedExcursionSlugs: ['alanya-jeep-safari', 'green-canyon-tour'],
    jsonLdType: 'TouristTrip',
    priority: '0.9',
  },
  {
    slug: 'scuba-diving-alanya',
    title: 'Scuba Diving in Alanya',
    metaTitle: 'Scuba Diving in Alanya — Dive Courses & Snorkeling Trips',
    metaDescription: 'Discover underwater Alanya with scuba diving courses and snorkeling trips. Crystal-clear Mediterranean waters, colorful marine life, and professional instructors.',
    keywords: ['scuba diving alanya', 'snorkeling alanya', 'alanya diving', 'dive course alanya', 'underwater alanya', 'alanya sea life'],
    longDescription: 'Dive into the crystal-clear waters of the Mediterranean with Alanya scuba diving tours. Whether you\'re a certified diver or a complete beginner, professional instructors guide you through underwater caves, reefs, and shipwrecks teeming with marine life. Snorkeling options also available for those who prefer to stay near the surface.',
    searchKeywords: ['scuba', 'diving', 'snorkeling', 'underwater', 'dive', 'fish'],
    relatedAttractions: ['cleopatra-beach'],
    relatedExcursionSlugs: ['alanya-boat-tours', 'parasailing-alanya'],
    jsonLdType: 'TouristTrip',
    priority: '0.9',
  },
  {
    slug: 'sapadere-canyon-tour',
    title: 'Sapadere Canyon Tour from Alanya',
    metaTitle: 'Sapadere Canyon Tour from Alanya — Nature & Waterfalls',
    metaDescription: 'Visit Sapadere Canyon from Alanya: walk through stunning gorges, swim under waterfalls, and explore authentic village life. Hotel transfer included.',
    keywords: ['sapadere canyon tour', 'sapadere canyon alanya', 'alanya canyon trip', 'alanya waterfall tour', 'sapadere village'],
    longDescription: 'Discover the hidden gem of Sapadere Canyon, a spectacular natural wonder nestled in the Taurus Mountains near Alanya. Walk along wooden pathways through narrow gorges, swim in natural pools beneath cascading waterfalls, and visit a traditional Turkish village where time stands still.',
    searchKeywords: ['sapadere', 'canyon', 'waterfall', 'nature', 'village', 'gorge'],
    relatedAttractions: ['sapadere-canyon', 'dim-cave'],
    relatedExcursionSlugs: ['green-canyon-tour', 'alanya-jeep-safari'],
    jsonLdType: 'TouristTrip',
  },
  {
    slug: 'green-canyon-tour',
    title: 'Green Canyon Tour from Alanya',
    metaTitle: 'Green Canyon Tour from Alanya — Lake Cruise & Swimming',
    metaDescription: 'Book the Green Canyon tour from Alanya: scenic boat cruise on Oymapınar Dam Lake, swimming in emerald waters, and breathtaking mountain views.',
    keywords: ['green canyon tour', 'green canyon alanya', 'oymapinar dam tour', 'alanya lake cruise', 'green canyon boat trip'],
    longDescription: 'Cruise across the emerald waters of Oymapınar Dam Lake on the Green Canyon tour from Alanya. This peaceful boat trip takes you through dramatic canyon walls, with stops for swimming in the lake\'s pristine waters and lunch at a lakeside restaurant. A perfect day trip for nature lovers and families.',
    searchKeywords: ['green canyon', 'lake', 'cruise', 'oymapinar', 'dam', 'swimming'],
    relatedAttractions: ['green-canyon', 'dim-river'],
    relatedExcursionSlugs: ['sapadere-canyon-tour', 'alanya-boat-tours'],
    jsonLdType: 'TouristTrip',
  },
  {
    slug: 'parasailing-alanya',
    title: 'Parasailing & Water Sports in Alanya',
    metaTitle: 'Parasailing in Alanya — Water Sports & Jet Ski Rentals',
    metaDescription: 'Soar above Alanya\'s coastline with parasailing, or ride the waves on a jet ski. Book water sports activities online with best price guarantee.',
    keywords: ['parasailing alanya', 'jet ski alanya', 'water sports alanya', 'alanya parasailing', 'alanya banana boat', 'alanya fly board'],
    longDescription: 'Take to the skies with parasailing over Alanya\'s stunning coastline, or feel the adrenaline rush on a jet ski. Alanya\'s water sports scene offers something for everyone — from gentle banana boat rides for the family to high-octane flyboarding for thrill seekers.',
    searchKeywords: ['parasailing', 'jet ski', 'water sport', 'banana boat', 'fly board', 'adrenaline'],
    relatedAttractions: ['cleopatra-beach', 'incekum-beach'],
    relatedExcursionSlugs: ['alanya-boat-tours', 'scuba-diving-alanya'],
    jsonLdType: 'TouristTrip',
  },
  {
    slug: 'alanya-fishing-trips',
    title: 'Fishing Trips in Alanya',
    metaTitle: 'Alanya Fishing Trips — Sea Fishing & Lake Excursions',
    metaDescription: 'Join a fishing trip in Alanya: deep-sea fishing in the Mediterranean or peaceful lake fishing. All equipment provided, perfect for beginners.',
    keywords: ['fishing trips alanya', 'alanya sea fishing', 'fishing tour alanya', 'alanya lake fishing', 'deep sea fishing turkey'],
    longDescription: 'Cast your line into the Mediterranean or the tranquil mountain lakes on an Alanya fishing trip. Deep-sea excursions target big game fish, while lake trips offer a peaceful day surrounded by stunning scenery. All equipment and bait provided — just bring your sense of adventure.',
    searchKeywords: ['fishing', 'sea fishing', 'lake', 'boat', 'fish', 'angling'],
    relatedAttractions: ['dim-river', 'green-canyon'],
    relatedExcursionSlugs: ['alanya-boat-tours', 'alanya-yacht-charter'],
    jsonLdType: 'TouristTrip',
    priority: '0.7',
  },
  {
    slug: 'alanya-city-tour',
    title: 'Alanya City Tour',
    metaTitle: 'Alanya City Tour — Castle, Red Tower & Old Town Walking Tour',
    metaDescription: 'Explore Alanya\'s historic landmarks on a city tour: the medieval castle, Red Tower, shipyard, and charming old town. Guided tours with hotel pickup.',
    keywords: ['alanya city tour', 'alanya castle tour', 'red tower alanya tour', 'alanya old town', 'alanya sightseeing', 'alanya historical tour'],
    longDescription: 'Step back in time on an Alanya city tour that takes you through centuries of history. Visit the imposing Seljuk castle overlooking the coast, the iconic Red Tower, the ancient shipyard carved into the cliffs, and the atmospheric old town with its bazaar and mosque. A must for culture lovers.',
    searchKeywords: ['city', 'castle', 'red tower', 'shipyard', 'old town', 'history', 'sightseeing'],
    relatedAttractions: ['alanya-castle', 'red-tower-alanya', 'alanya-shipyard'],
    relatedExcursionSlugs: ['sapadere-canyon-tour', 'alanya-boat-tours'],
    jsonLdType: 'TouristTrip',
  },
  {
    slug: 'alanya-yacht-charter',
    title: 'Yacht Charter in Alanya',
    metaTitle: 'Alanya Yacht Charter — Private & Luxury Boat Rental',
    metaDescription: 'Charter a private yacht in Alanya for an exclusive Mediterranean experience. Luxury boats, crewed charters, and romantic sunset cruises available.',
    keywords: ['yacht charter alanya', 'private yacht alanya', 'luxury yacht tour alanya', 'alanya boat rental', 'alanya private cruise'],
    longDescription: 'Experience the ultimate Mediterranean luxury with a private yacht charter from Alanya. Choose from sleek motor yachts, traditional gulets, or sailing vessels — all with professional crews. Perfect for special occasions, romantic escapes, or simply an unforgettable day on the turquoise waters.',
    searchKeywords: ['yacht', 'charter', 'luxury', 'private', 'boat', 'gulet', 'crew'],
    relatedAttractions: ['cleopatra-beach', 'alanya-castle'],
    relatedExcursionSlugs: ['alanya-boat-tours', 'parasailing-alanya'],
    jsonLdType: 'TouristTrip',
  },
];

export function getExcursionType(slug: string): ExcursionType | undefined {
  return EXCURSION_TYPES.find(et => et.slug === slug);
}