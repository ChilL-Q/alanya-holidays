import { CATEGORY_PATHS, getSchemaType } from '../constants/categoryPaths';

// ── Types ────────────────────────────────────────────────────────────

export type DistrictPageType = 'hotels' | 'villas' | 'apartments' | 'things-to-do' | 'airport-transfer';

export interface DistrictConfig {
  slug: string;
  name: string;
  nameTr?: string;
  coordinates: { lat: number; lng: number };
  description: string;
  highlights: string[];
  distanceFromCenter: string;
  transferTime: { antalya: string; gazipasa: string };
}

export interface DistrictPageContent {
  districtSlug: string;
  pageType: DistrictPageType;
  url: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  longDescription: string[];
  faqs: { question: string; answer: string }[];
  categoryId: string;
  jsonLdType: string;
}

// ── Category mapping ─────────────────────────────────────────────────

const PAGE_TYPE_TO_CATEGORY: Record<DistrictPageType, string> = {
  'hotels': 'accommodations',
  'villas': 'villas',
  'apartments': 'apartments',
  'things-to-do': 'tours',
  'airport-transfer': 'transport',
};

// ── Districts ────────────────────────────────────────────────────────

export const DISTRICTS: DistrictConfig[] = [
  {
    slug: 'mahmutlar',
    name: 'Mahmutlar',
    nameTr: 'Mahmutlar',
    coordinates: { lat: 36.4720, lng: 32.0850 },
    description: 'Mahmutlar is a vibrant coastal district 12 km east of Alanya center, popular with European expats and long-stay visitors. Known for its sandy beaches, lively Saturday market, and excellent value restaurants, Mahmutlar offers a relaxed Mediterranean lifestyle with all essentials within walking distance.',
    highlights: ['Sandy beaches with clear water', 'Saturday street market', 'Affordable dining', 'Active expat community', 'Close to Dim River'],
    distanceFromCenter: '12 km east of Alanya center',
    transferTime: { antalya: '2 hours', gazipasa: '30 minutes' },
  },
  {
    slug: 'kargicak',
    name: 'Kargıcak',
    nameTr: 'Kargıcak',
    coordinates: { lat: 36.4580, lng: 32.1050 },
    description: 'Kargıcak is a peaceful hillside district 16 km east of Alanya, known for its upscale residential developments and panoramic sea views. The area offers a tranquil retreat from the busier resort zones while maintaining easy access to beaches and amenities.',
    highlights: ['Panoramic Mediterranean views', 'Upscale residential area', 'Quiet and peaceful atmosphere', 'Close to Mahmutlar amenities', 'Excellent for nature walks'],
    distanceFromCenter: '16 km east of Alanya center',
    transferTime: { antalya: '2 hours 10 minutes', gazipasa: '25 minutes' },
  },
  {
    slug: 'oba',
    name: 'Oba',
    nameTr: 'Oba',
    coordinates: { lat: 36.5500, lng: 32.0100 },
    description: 'Oba is Alanya\'s most popular residential district, just 3 km east of the city center. With its tree-lined avenues, modern shopping centers, and excellent restaurants, Oba combines convenience with a relaxed suburban atmosphere. The district is a favorite among families and long-term visitors.',
    highlights: ['Close to Alanya center', 'Modern shopping (Metro, Koçtaş)', 'Family-friendly beaches', 'Excellent restaurants and cafes', 'Well-connected by public transport'],
    distanceFromCenter: '3 km east of Alanya center',
    transferTime: { antalya: '1 hour 50 minutes', gazipasa: '45 minutes' },
  },
  {
    slug: 'tosmur',
    name: 'Tosmur',
    nameTr: 'Tosmur',
    coordinates: { lat: 36.5340, lng: 32.0400 },
    description: 'Tosmur is a charming coastal district 5 km east of Alanya, nestled between the Dim River and the Mediterranean. This laid-back area offers a more authentic Turkish atmosphere while being close enough to Alanya\'s attractions for easy day trips.',
    highlights: ['Dim River proximity', 'Authentic Turkish atmosphere', 'Quiet beaches', 'Fresh fish restaurants', 'Easy access to Alanya center'],
    distanceFromCenter: '5 km east of Alanya center',
    transferTime: { antalya: '1 hour 50 minutes', gazipasa: '40 minutes' },
  },
  {
    slug: 'konakli',
    name: 'Konaklı',
    nameTr: 'Konaklı',
    coordinates: { lat: 36.5740, lng: 31.7660 },
    description: 'Konaklı is a well-established resort town 12 km west of Alanya, offering a complete holiday experience with its own beach, water park, shopping street, and lively restaurant scene. Popular with families and repeat visitors who appreciate its balanced mix of activity and relaxation.',
    highlights: ['Blue Flag beach', 'Water park', 'Lively shopping street', 'All-inclusive resort options', 'Family-friendly atmosphere'],
    distanceFromCenter: '12 km west of Alanya center',
    transferTime: { antalya: '1 hour 30 minutes', gazipasa: '50 minutes' },
  },
  {
    slug: 'avsallar',
    name: 'Avsallar',
    nameTr: 'Avsallar',
    coordinates: { lat: 36.6010, lng: 31.7190 },
    description: 'Avsallar is a growing resort district 18 km west of Alanya, known for its long sandy beach and relaxed atmosphere. The area combines affordable holiday living with easy access to natural attractions like the Dim River and Sapadere Canyon.',
    highlights: ['Long sandy beach', 'Affordable accommodations', 'Proximity to Dim River', 'Local markets and shops', 'Growing expat community'],
    distanceFromCenter: '18 km west of Alanya center',
    transferTime: { antalya: '1 hour 20 minutes', gazipasa: '55 minutes' },
  },
  {
    slug: 'turkler',
    name: 'Türkler',
    nameTr: 'Türkler',
    coordinates: { lat: 36.6140, lng: 31.6930 },
    description: 'Türkler is a small coastal village 22 km west of Alanya, offering a quiet and authentic Turkish experience. Popular with visitors seeking a peaceful base with easy access to both Alanya and Side, Türkler provides excellent value for money in a relaxed setting.',
    highlights: ['Quiet village atmosphere', 'Authentic Turkish lifestyle', 'Great value for money', 'Easy access to Side and Alanya', 'Pristine local beach'],
    distanceFromCenter: '22 km west of Alanya center',
    transferTime: { antalya: '1 hour 15 minutes', gazipasa: '1 hour' },
  },
  {
    slug: 'okurcalar',
    name: 'Okurcalar',
    nameTr: 'Okurcalar',
    coordinates: { lat: 36.6270, lng: 31.6600 },
    description: 'Okurcalar is a peaceful coastal village 25 km west of Alanya, ideal for those seeking a quiet beach holiday away from the crowds. The area features a mix of modern resort complexes and traditional Turkish village life, with several excellent beaches within walking distance.',
    highlights: ['Uncrowded beaches', 'Mix of resort and village life', 'Close to natural attractions', 'Peaceful and relaxed', 'Good local restaurants'],
    distanceFromCenter: '25 km west of Alanya center',
    transferTime: { antalya: '1 hour 10 minutes', gazipasa: '1 hour 5 minutes' },
  },
  {
    slug: 'incekum',
    name: 'İncekum',
    nameTr: 'İncekum',
    coordinates: { lat: 36.6260, lng: 31.7770 },
    description: 'İncekum, meaning "fine sand" in Turkish, is a beachside district 20 km west of Alanya that lives up to its name. This Blue Flag beach area is popular with families thanks to its gently shelving shoreline, soft golden sand, and calm, shallow waters perfect for children.',
    highlights: ['Blue Flag beach with fine sand', 'Shallow calm waters', 'Family-friendly atmosphere', 'Pine-forested backdrop', 'Quiet and relaxed pace'],
    distanceFromCenter: '20 km west of Alanya center',
    transferTime: { antalya: '1 hour 15 minutes', gazipasa: '55 minutes' },
  },
];

// ── Page content helpers ─────────────────────────────────────────────

export const PAGE_TYPE_LABELS: Record<DistrictPageType, string> = {
  'hotels': 'Hotels',
  'villas': 'Villas',
  'apartments': 'Apartments',
  'things-to-do': 'Things to Do',
  'airport-transfer': 'Airport Transfer',
};

const PAGE_TYPE_DESCRIPTIONS: Record<DistrictPageType, (d: DistrictConfig) => string[]> = {
  'hotels': (d) => [
    `Looking for the best hotels in ${d.name}? This guide covers top-rated hotels, boutique stays, and resort options in ${d.name}, ${d.distanceFromCenter.toLowerCase()}. Whether you want a beachfront room, a family-friendly resort, or a budget-friendly option, ${d.name} offers accommodations to suit every style and budget.`,
    `${d.name} has become one of Alanya's most sought-after areas for hotel stays. ${d.description} The district's ${d.highlights.length} key attractions include ${d.highlights.slice(0, 3).join(', ').toLowerCase()}, making it an ideal base for your Alanya holiday.`,
    `Hotels in ${d.name} range from luxury beachfront resorts with pools and spa facilities to cozy boutique hotels offering personalized service. The area's popularity with international visitors means you'll find excellent English-speaking staff and amenities designed for holiday comfort. Most hotels offer airport transfer services — ${d.transferTime.gazipasa} from Gazipaşa Airport and ${d.transferTime.antalya} from Antalya Airport.`,
    `When choosing a hotel in ${d.name}, consider proximity to the beach, access to public transport, and the type of holiday you're planning. ${d.highlights[0]} and ${d.highlights[1] || d.highlights[0]} are within easy reach of most accommodations in the area.`,
  ],
  'villas': (d) => [
    `Discover the best villas in ${d.name} for your Alanya holiday. From modern villas with private pools to spacious family homes with sea views, ${d.name} offers an excellent selection of villa rentals that combine privacy, comfort, and Mediterranean lifestyle.`,
    `${d.name} is particularly well-suited for villa holidays. ${d.description} The area's residential character and ${d.distanceFromCenter.toLowerCase()} location make it a peaceful retreat with all conveniences nearby.`,
    `Villas in ${d.name} typically feature private pools, landscaped gardens, and outdoor dining areas perfect for al fresco meals. Many offer stunning views of the Mediterranean or the Taurus Mountains. The district's ${d.highlights.slice(0, 2).join(' and ').toLowerCase()} add to the appeal of a villa stay here.`,
    `A villa holiday in ${d.name} gives you the freedom to cook with local ingredients from the ${d.highlights.includes('Saturday street market') ? 'weekly market' : 'local shops'}, enjoy lazy days by your private pool, and explore the Alanya region at your own pace. Airport transfers take ${d.transferTime.gazipasa} from Gazipaşa and ${d.transferTime.antalya} from Antalya.`,
  ],
  'apartments': (d) => [
    `Find the perfect apartment in ${d.name} for your Alanya holiday. From budget-friendly studios to spacious family apartments with sea views, ${d.name} offers a wide range of holiday apartments that combine comfort, convenience, and great value.`,
    `${d.name} is a popular choice for apartment holidays thanks to its ${d.description.toLowerCase().split('.')[0]}. The district's ${d.distanceFromCenter.toLowerCase()} location provides easy access to Alanya's attractions while offering a more relaxed base.`,
    `Apartments in ${d.name} are ideal for longer stays and travelers who prefer the flexibility of self-catering accommodation. Most apartments come with fully equipped kitchens, balconies with views, and access to shared pools. The area offers ${d.highlights.slice(0, 3).join(', ').toLowerCase()} within walking distance.`,
    `Whether you're planning a week-long beach holiday or an extended seasonal stay, ${d.name} apartments provide the comfort and independence you need. The ${d.transferTime.gazipasa} transfer from Gazipaşa Airport makes arrival and departure straightforward.`,
  ],
  'things-to-do': (d) => [
    `Discover the best things to do in ${d.name}, Alanya. From ${d.highlights[0].toLowerCase()} to ${d.highlights[d.highlights.length - 1].toLowerCase()}, this guide covers the top attractions, activities, and experiences in ${d.name} and the surrounding area.`,
    `${d.description} Located ${d.distanceFromCenter.toLowerCase()}, ${d.name} offers a blend of local culture and natural beauty that makes it a rewarding destination beyond the typical tourist trail.`,
    `Top things to do in ${d.name} include ${d.highlights.slice(0, 3).join(', ').toLowerCase()}. The district's proximity to both Alanya center and natural attractions like the Dim River makes it an excellent base for exploration. Whether you prefer active adventures or relaxed cultural experiences, ${d.name} has something for everyone.`,
    `Getting around ${d.name} is easy with local buses (dolmuş) running frequently to Alanya center. For day trips, the ${d.transferTime.gazipasa} journey from Gazipaşa Airport and ${d.transferTime.antalya} from Antalya Airport make ${d.name} an accessible destination from both major airports.`,
  ],
  'airport-transfer': (d) => [
    `Book your airport transfer to ${d.name}, Alanya. We offer reliable, comfortable transfers from both Antalya Airport (AYT) and Gazipaşa-Alanya Airport (GZP) directly to your accommodation in ${d.name}. Fixed prices, no hidden fees, hotel drop-off included.`,
    `${d.name} is located ${d.distanceFromCenter.toLowerCase()}, making it accessible from both airports serving the Alanya region. Transfer times are approximately ${d.transferTime.antalya} from Antalya Airport and ${d.transferTime.gazipasa} from Gazipaşa Airport.`,
    `Our ${d.name} airport transfer service includes meet-and-greet at the airport, assistance with luggage, and door-to-door service to your hotel or apartment. Whether you're arriving at Gazipaşa (the closer airport, just ${d.transferTime.gazipasa} away) or Antalya, we ensure a smooth start to your Alanya holiday.`,
    `Why choose our transfer service to ${d.name}? Fixed pricing with no surprises, professional English-speaking drivers, free cancellation up to 24 hours before arrival, and 24/7 availability. We track your flight so even delays won't affect your pickup.`,
  ],
};

const PAGE_TYPE_FAQS: Record<DistrictPageType, (d: DistrictConfig) => { question: string; answer: string }[]> = {
  'hotels': (d) => [
    { question: `What is the best area to stay in ${d.name}?`, answer: `The best area in ${d.name} depends on your preferences. Most visitors choose accommodations near ${d.highlights[0].toLowerCase()} for easy access to the beach and local amenities. ${d.distanceFromCenter} from Alanya center means you get a quieter base while staying connected.` },
    { question: `How much do hotels in ${d.name} cost?`, answer: `Hotels in ${d.name} range from budget-friendly options starting around €30/night to luxury resorts at €150+/night. The area offers excellent value compared to Alanya center, with many mid-range hotels including breakfast and pool access.` },
    { question: `Is ${d.name} a good place to stay for a holiday?`, answer: `${d.name} is ${d.distanceFromCenter.toLowerCase()}, offering a perfect balance of local atmosphere and accessibility. ${d.description} It's especially popular with visitors who want ${d.highlights.slice(0, 2).join(' and ').toLowerCase()}.` },
    { question: `How do I get from the airport to ${d.name}?`, answer: `From Gazipaşa Airport, it takes ${d.transferTime.gazipasa} to reach ${d.name}. From Antalya Airport, the transfer is about ${d.transferTime.antalya}. Pre-booked airport transfers offer the most convenient option with door-to-door service.` },
  ],
  'villas': (d) => [
    { question: `Are villas in ${d.name} a good choice for families?`, answer: `Yes, ${d.name} villas are excellent for families. Most come with private pools, multiple bedrooms, and fully equipped kitchens. ${d.distanceFromCenter} from Alanya center gives families space and quiet while staying close to attractions like ${d.highlights[0].toLowerCase()}.` },
    { question: `What amenities do ${d.name} villas typically include?`, answer: `Most villas in ${d.name} include a private pool, air conditioning, Wi-Fi, fully equipped kitchen, outdoor dining area, and parking. Many also feature sea or mountain views and barbecue facilities.` },
    { question: `Is it better to rent a villa or hotel in ${d.name}?`, answer: `Villas offer more space, privacy, and self-catering flexibility — ideal for families or longer stays. Hotels provide daily housekeeping and on-site dining. For groups of 4+ or stays over a week, a villa in ${d.name} typically offers better value.` },
  ],
  'apartments': (d) => [
    { question: `How much do apartments in ${d.name} cost per night?`, answer: `Apartments in ${d.name} range from €20–€40/night for a studio to €60–€120/night for a spacious family apartment with sea views. Monthly rates for seasonal stays offer even better value.` },
    { question: `Are apartments in ${d.name} close to the beach?`, answer: `Most apartments in ${d.name} are within walking distance of the beach. ${d.highlights[0]} is a key attraction in the area. Check individual listings for exact distances — many apartments are just 200–500 meters from the shore.` },
    { question: `Is ${d.name} a good base for exploring Alanya?`, answer: `${d.name} is ${d.distanceFromCenter.toLowerCase()}, making it a convenient base. Local buses (dolmuş) run frequently to Alanya center. You get a quieter, more local experience while staying connected to all Alanya attractions.` },
  ],
  'things-to-do': (d) => [
    { question: `What are the top things to do in ${d.name}?`, answer: `The top things to do in ${d.name} include ${d.highlights.slice(0, 3).join(', ').toLowerCase()}, and exploring the local area. ${d.description}` },
    { question: `How far is ${d.name} from Alanya center?`, answer: `${d.name} is ${d.distanceFromCenter.toLowerCase()}. Local buses (dolmuş) connect the district to Alanya center frequently throughout the day, making it easy to explore both areas.` },
    { question: `Can I visit ${d.name} on a day trip from Alanya?`, answer: `Absolutely. ${d.name} is ${d.distanceFromCenter.toLowerCase()}, easily reachable by local bus, taxi, or rental car. Many visitors combine a visit to ${d.name} with other nearby attractions.` },
  ],
  'airport-transfer': (d) => [
    { question: `How much is an airport transfer to ${d.name}?`, answer: `Transfer prices to ${d.name} vary by airport and vehicle type. From Gazipaşa Airport (${d.transferTime.gazipasa} drive), prices start from around €25 for a private transfer. From Antalya Airport (${d.transferTime.antalya}), prices start from around €60. Book online for the best rates.` },
    { question: `Which airport is closest to ${d.name}?`, answer: `Gazipaşa-Alanya Airport (GZP) is the closest airport to ${d.name}, approximately ${d.transferTime.gazipasa} by road. Antalya Airport (AYT) is about ${d.transferTime.antalya} away but offers more international flight options.` },
    { question: `Are taxis available at the airport to ${d.name}?`, answer: `Yes, taxis are available at both airports, but pre-booked transfers are recommended for the best price and guaranteed availability. Official airport taxis charge meter rates which can be significantly higher than pre-booked fixed-price transfers.` },
  ],
};

function generateDistrictPages(): DistrictPageContent[] {
  const pages: DistrictPageContent[] = [];

  for (const district of DISTRICTS) {
    for (const pageType of Object.keys(PAGE_TYPE_LABELS) as DistrictPageType[]) {
      const categoryId = PAGE_TYPE_TO_CATEGORY[pageType];
      const label = PAGE_TYPE_LABELS[pageType];
      const urlPrefix: Record<DistrictPageType, string> = {
        'hotels': 'hotels-in',
        'villas': 'villas-in',
        'apartments': 'apartments-in',
        'things-to-do': 'things-to-do-in',
        'airport-transfer': 'airport-transfer-to',
      };
      const url = `${urlPrefix[pageType]}-${district.slug}`;

      const metaTitlePrefix: Record<DistrictPageType, string> = {
        'hotels': `${label} in ${district.name} — Best Hotels & Stays`,
        'villas': `${label} in ${district.name} — Private Villas with Pools`,
        'apartments': `${label} in ${district.name} — Holiday Apartments`,
        'things-to-do': `Best Things to Do in ${district.name}, Alanya`,
        'airport-transfer': `Airport Transfer to ${district.name} — Fixed Price`,
      };

      const metaDescPrefix: Record<DistrictPageType, string> = {
        'hotels': `Find the best hotels in ${district.name}, Alanya. Browse top-rated stays, beachfront resorts, and budget-friendly options ${district.distanceFromCenter.toLowerCase()}.`,
        'villas': `Book a private villa in ${district.name} with pool, sea views, and full privacy. ${district.distanceFromCenter}, ${district.transferTime.gazipasa} from Gazipaşa Airport.`,
        'apartments': `Rent holiday apartments in ${district.name}, Alanya. Self-catering flats with balconies, Wi-Fi, and pool access ${district.distanceFromCenter.toLowerCase()}.`,
        'things-to-do': `Discover the best things to do in ${district.name}, Alanya. ${district.highlights.slice(0, 3).join(', ')} and more. ${district.distanceFromCenter}.`,
        'airport-transfer': `Book airport transfer to ${district.name}, Alanya. Fixed prices, hotel drop-off, ${district.transferTime.gazipasa} from Gazipaşa Airport, ${district.transferTime.antalya} from Antalya.`,
      };

      const keywordTemplates: Record<DistrictPageType, string[]> = {
        'hotels': [
          `hotels in ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} hotels`,
          `${district.name.toLowerCase()} alanya hotel`,
          `best hotels ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} accommodation`,
          `stay in ${district.name.toLowerCase()} alanya`,
        ],
        'villas': [
          `villas in ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} villa rental`,
          `${district.name.toLowerCase()} villa with pool`,
          `holiday villa ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} alanya villa`,
        ],
        'apartments': [
          `apartments in ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} apartment rental`,
          `${district.name.toLowerCase()} holiday apartment`,
          `flat in ${district.name.toLowerCase()} alanya`,
          `${district.name.toLowerCase()} self catering`,
        ],
        'things-to-do': [
          `things to do in ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} alanya attractions`,
          `${district.name.toLowerCase()} activities`,
          `what to do in ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} alanya things to see`,
        ],
        'airport-transfer': [
          `airport transfer ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} airport transfer`,
          `transfer to ${district.name.toLowerCase()}`,
          `${district.name.toLowerCase()} taxi`,
          `gazipasa to ${district.name.toLowerCase()}`,
          `antalya airport to ${district.name.toLowerCase()}`,
        ],
      };

      pages.push({
        districtSlug: district.slug,
        pageType,
        url,
        metaTitle: metaTitlePrefix[pageType],
        metaDescription: metaDescPrefix[pageType],
        keywords: keywordTemplates[pageType],
        longDescription: PAGE_TYPE_DESCRIPTIONS[pageType](district),
        faqs: PAGE_TYPE_FAQS[pageType](district),
        categoryId,
        jsonLdType: getSchemaType(categoryId),
      });
    }
  }

  return pages;
}

export const DISTRICT_PAGES: DistrictPageContent[] = generateDistrictPages();

export function getDistrictPage(slug: string): DistrictPageContent | undefined {
  return DISTRICT_PAGES.find(p => p.url === slug);
}

export function getDistrictBySlug(slug: string): DistrictConfig | undefined {
  return DISTRICTS.find(d => d.slug === slug);
}

export function getDistrictPagesForDistrict(districtSlug: string): DistrictPageContent[] {
  return DISTRICT_PAGES.filter(p => p.districtSlug === districtSlug);
}

export function getDistrictPagesForType(pageType: DistrictPageType): DistrictPageContent[] {
  return DISTRICT_PAGES.filter(p => p.pageType === pageType);
}

export function getCategoryPathForType(pageType: DistrictPageType): string {
  const categoryId = PAGE_TYPE_TO_CATEGORY[pageType];
  return CATEGORY_PATHS[categoryId] || '/';
}