export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface ItineraryItem {
  time?: string;
  title?: string;
  name?: string;
  description: string;
  location?: string;
  timeSlot?: string;
  subcategory?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  link?: string;
}

export interface GeneratedDayPlan {
  day?: number;
  dayLabel?: string;
  title?: string;
  theme?: string;
  items: ItineraryItem[];
}

export interface GeneratedItineraryResponse {
  title: string;
  description: string;
  district?: string;
  days?: GeneratedDayPlan[];
  itinerary?: GeneratedDayPlan[];
  cached?: boolean;
}

export const ALANYA_GUIDE_SYSTEM_INSTRUCTION = `You are the official AI Holiday Guide and Local Concierge for "Alanya Holidays" (alanya-holidays.com), an expert on Alanya, Antalya, and the Turkish Riviera.

Your core mission and capabilities:
- Expert Knowledge: Provide accurate, enthusiastic, and practical recommendations for visitors, tourists, and residents in Alanya and its surrounding districts (Kleopatra, Damlatas, Mahmutlar, Oba, Tosmur, Kestel, Kargicak, Avsallar, Konakli, Okurcalar, Side, Gazipasa).
- Local Insights: Share expert tips on attractions (Alanya Castle / Kalesi, Damlatas Cave, Dim River / Dim Cayi, Red Tower / Kizil Kule, Sapadere Canyon, Cleopatra Beach, Teleferik cable car), beaches, authentic Turkish restaurants, seafood, cafes, nightlife, boat tours, outdoor activities, bazaars, shopping, and public transportation.
- Property & Location Context: If a specific property name or location is provided in the context, tailor distances, transit advice, and neighborhood recommendations relative to that spot.
- Multilingual Persona: Detect and reply in the user's language with native fluency, cultural nuance, and correct local terminology. Fully support Russian (RU), English (EN), and Turkish (TR).
- Tone & Format: Warm, welcoming, helpful, concise, and structured. Use markdown formatting (bullet points, bold highlights) for readable itineraries and guides.`;

export const CURATED_ITINERARY_TEMPLATES: GeneratedDayPlan[] = [
  {
    day: 1,
    dayLabel: 'Day 1',
    title: 'Historic Castle & Sunset Harbor',
    theme: 'Historic Castle & Sunset Harbor',
    items: [
      {
        time: '09:00',
        name: 'Cleopatra Beach & Damlataş Cave',
        title: 'Cleopatra Beach & Damlataş Cave',
        description:
          'Morning walk along Cleopatra Beach and explore the ancient Damlataş stalactite cave.',
        timeSlot: 'Morning (8AM - 12PM)',
        location: 'Kleopatra Beach',
        subcategory: 'Sightseeing & Nature',
        lat: 36.548,
        lng: 31.985,
        notes:
          'Damlataş Cave is cool inside (22°C year-round) right by the cable car station.',
      },
      {
        time: '13:00',
        name: 'Alanya Teleferik & Castle Citadel',
        title: 'Alanya Teleferik & Castle Citadel',
        description:
          'Scenic cable car ride up to Alanya Castle (Kalesi), exploring Byzantine churches and panoramas.',
        timeSlot: 'Afternoon (12PM - 5PM)',
        location: 'Alanya Castle',
        subcategory: 'Historical Landmark',
        lat: 36.5438,
        lng: 31.9998,
        notes: 'Wear comfortable shoes for walking on historic stone paths.',
      },
      {
        time: '18:00',
        name: 'Harbor Promenade & Red Tower (Kızıl Kule)',
        title: 'Harbor Promenade & Red Tower (Kızıl Kule)',
        description:
          'Walk along the ancient Seljuk harbor, admire the 13th-century octagonal Red Tower and shipyard.',
        timeSlot: 'Evening (5PM - 9PM)',
        location: 'Alanya Harbor',
        subcategory: 'Culture & Sightseeing',
        lat: 36.542,
        lng: 31.995,
        notes:
          'The sunset light illuminates the ancient stone walls magnificently.',
      },
    ],
  },
  {
    day: 2,
    dayLabel: 'Day 2',
    title: 'Mountain Escapes & Dim River',
    theme: 'Mountain Escapes & Dim River',
    items: [
      {
        time: '09:30',
        name: 'Dim Cave Exploration',
        title: 'Dim Cave Exploration',
        description:
          'Venture into the Taurus foothills to explore Dim Cave, one of Turkey’s largest stalactite caves.',
        timeSlot: 'Morning (8AM - 12PM)',
        location: 'Dim Cave',
        subcategory: 'Nature & Adventure',
        lat: 36.538,
        lng: 32.112,
        notes: 'Bring a light jacket as the interior remains cool all year.',
      },
      {
        time: '12:30',
        name: 'Floating Lunch & Swimming at Dim Çayı',
        title: 'Floating Lunch & Swimming at Dim Çayı',
        description:
          'Relax on floating wooden pergolas over the mountain river, enjoying grilled trout.',
        timeSlot: 'Afternoon (12PM - 5PM)',
        location: 'Dim River (Dim Cayi)',
        subcategory: 'Dining & Relaxation',
        lat: 36.47,
        lng: 32.15,
        notes: 'Water temperature is refreshing even during peak August heat.',
      },
      {
        time: '18:30',
        name: 'Oba Promenade & Local Bazaar',
        title: 'Oba Promenade & Local Bazaar',
        description:
          'Stroll through the pedestrian avenues of Oba, browsing spices, Turkish delight, and crafts.',
        timeSlot: 'Evening (5PM - 9PM)',
        location: 'Oba',
        subcategory: 'Shopping & Culture',
        lat: 36.535,
        lng: 32.03,
        notes: 'Great spot for authentic Turkish tea and evening atmosphere.',
      },
    ],
  },
  {
    day: 3,
    dayLabel: 'Day 3',
    title: 'Sapadere Canyon & East Coast',
    theme: 'Sapadere Canyon & East Coast',
    items: [
      {
        time: '09:00',
        name: 'Sapadere Canyon Walkway & Waterfalls',
        title: 'Sapadere Canyon Walkway & Waterfalls',
        description:
          'Suspended wooden walkway through a 360m mountain gorge with emerald pools and waterfalls.',
        timeSlot: 'Morning (8AM - 12PM)',
        location: 'Sapadere Canyon',
        subcategory: 'Adventure & Hiking',
        lat: 36.4,
        lng: 32.2,
        notes: 'Dare to swim in the icy mountain waterfall pools.',
      },
      {
        time: '13:00',
        name: 'Traditional Village Lunch in Sapadere',
        title: 'Traditional Village Lunch in Sapadere',
        description:
          'Homemade gözleme flatbread, local village honey, and mountain herb tea in a rustic garden.',
        timeSlot: 'Afternoon (12PM - 5PM)',
        location: 'Sapadere Village',
        subcategory: 'Authentic Dining',
        lat: 36.405,
        lng: 32.205,
        notes:
          'Visit the traditional silk weaving demonstration in the village.',
      },
      {
        time: '18:00',
        name: 'Mahmutlar Coastal Beach Sunset',
        title: 'Mahmutlar Coastal Beach Sunset',
        description:
          'Relax at a beachfront lounge in Mahmutlar with panoramic sunset views over Alanya Castle.',
        timeSlot: 'Evening (5PM - 9PM)',
        location: 'Mahmutlar Beach',
        subcategory: 'Beach & Relaxation',
        lat: 36.49,
        lng: 32.09,
        notes: 'Spectacular wide open view of the castle peninsula.',
      },
    ],
  },
];
