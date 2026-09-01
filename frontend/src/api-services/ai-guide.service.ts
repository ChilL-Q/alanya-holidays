import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export interface ChatMessageDto {
  role: "user" | "model";
  content: string;
}

export interface AiGuideDto {
  propertyName?: string | null;
  location?: string | null;
  userQuestion: string;
  history?: ChatMessageDto[];
  mode?: "chat" | "structured";
}

export interface AskGuideResponse {
  answer: string;
  cached: boolean;
}

export interface ItineraryActivity {
  name: string;
  description: string;
  timeSlot: string; // e.g. "Morning (8AM - 12PM)", "Afternoon (12PM - 5PM)", "Evening (5PM - 9PM)", "Night (9PM+)", "All Day", "Flexible"
  subcategory?: string;
  notes?: string;
}

export interface GeneratedDayPlan {
  dayLabel: string;
  theme?: string;
  items: ItineraryActivity[];
}

export interface GenerateItineraryParams {
  days: number;
  interests?: string[];
  district?: string;
  pace?: "relaxed" | "moderate" | "packed";
}

export interface GenerateItineraryResult {
  title: string;
  description: string;
  district?: string;
  days: GeneratedDayPlan[];
}

export const CURATED_ALANYA_HIGHLIGHTS: Record<string, string> = {
  castle:
    "Alanya Castle (Alanya Kalesi): Magnificent medieval Seljuk fortress standing 250m above the Mediterranean. Features the Red Tower (Kızıl Kule), ancient shipyards (Tersane), and panoramic views. Reachable via scenic Teleferik cable car from Damlataş Beach.",
  beach:
    "Cleopatra Beach: Famous golden-sand beach on the west side with crystal-clear waters and vibrant beach clubs. Damlataş Beach and Portakal (Orange) Beach offer calm waters and water sports.",
  dim:
    "Dim Çayı & Dim Cave: Refreshing mountain river with floating wooden pergolas and riverside trout restaurants, plus one of Turkey's largest stalactite caves located 11km inland.",
  canyon:
    "Sapadere Canyon: Dramatic 360m-long wooden walking path suspended through a mountain canyon with natural waterfalls, emerald swimming pools, and traditional village silk weaving.",
  food:
    "Local Gastronomy: Traditional Turkish breakfast (serpme kahvaltı), freshly grilled Mediterranean sea bass and sea bream at the harbor, wood-fired pides, and authentic İskender kebab.",
  transit:
    "Getting Around: Dolmuş city buses (Lines 1 & 101 connect Cleopatra to Mahmutlar along the coast), yellow taxis, and the Damlataş Teleferik cable car up to the Castle.",
};

export const CURATED_DAY_TEMPLATES: GeneratedDayPlan[] = [
  {
    dayLabel: "Day 1",
    theme: "Historic Castle & Sunset Harbor",
    items: [
      {
        name: "Cleopatra Beach & Damlataş Cave",
        description:
          "Start your morning with a stroll along Cleopatra Beach and explore the ancient Damlataş Cave with its famous stalactites.",
        timeSlot: "Morning (8AM - 12PM)",
        subcategory: "Sightseeing & Nature",
        notes: "Damlataş Cave is cool inside (22°C year-round) and right at the entrance of Cleopatra Beach.",
      },
      {
        name: "Alanya Teleferik & Castle Citadel",
        description:
          "Take the cable car up to Alanya Castle (Alanya Kalesi), explore Ehmedek, and enjoy 360-degree panoramic views of the bay.",
        timeSlot: "Afternoon (12PM - 5PM)",
        subcategory: "Historical Landmark",
        notes: "Wear comfortable walking shoes. Grab fresh pomegranate juice from castle vendors.",
      },
      {
        name: "Harbor Promenade & Red Tower (Kızıl Kule)",
        description:
          "Walk along the ancient harbor, admire the 13th-century Red Tower and Seljuk Shipyard (Tersane).",
        timeSlot: "Evening (5PM - 9PM)",
        subcategory: "Culture & Sightseeing",
        notes: "The golden hour light illuminates the stone walls beautifully.",
      },
      {
        name: "Kaleici Harbor Seafood Dinner",
        description:
          "Dine at an authentic waterfront restaurant with views of illuminated fortress walls.",
        timeSlot: "Night (9PM+)",
        subcategory: "Dining & Nightlife",
        notes: "Try fresh grilled sea bream with cold Turkish mezze.",
      },
    ],
  },
  {
    dayLabel: "Day 2",
    theme: "Mountain Escapes & Dim River",
    items: [
      {
        name: "Dim Cave Exploration",
        description:
          "Venture into the Taurus foothills to explore Dim Cave, one of Turkey's largest and most impressive stalactite caves.",
        timeSlot: "Morning (8AM - 12PM)",
        subcategory: "Nature & Adventure",
        notes: "Bring a light jacket as the cave is naturally cool inside.",
      },
      {
        name: "Floating Lunch & Swimming at Dim Çayı",
        description:
          "Relax in traditional floating wooden seating over the rushing mountain waters of Dim River.",
        timeSlot: "Afternoon (12PM - 5PM)",
        subcategory: "Dining & Relaxation",
        notes: "Order fresh mountain river trout and swim in the invigorating cold mountain water.",
      },
      {
        name: "Oba Promenade & Local Bazaar",
        description:
          "Stroll through the green neighborhood of Oba and browse local handicrafts, Turkish delight, and spices.",
        timeSlot: "Evening (5PM - 9PM)",
        subcategory: "Shopping & Local Culture",
        notes: "Great spot for picking up authentic Turkish spices and treats.",
      },
    ],
  },
  {
    dayLabel: "Day 3",
    theme: "Sapadere Canyon & East Coast",
    items: [
      {
        name: "Sapadere Canyon Wooden Walkway",
        description:
          "Walk along the suspended wooden footpaths through the dramatic gorge with roaring waterfalls.",
        timeSlot: "Morning (8AM - 12PM)",
        subcategory: "Adventure & Hiking",
        notes: "Dare a dip in the crystal clear emerald natural waterfall pools!",
      },
      {
        name: "Traditional Village Lunch in Sapadere",
        description:
          "Taste homemade gözleme (flatbread), mountain village honey, and village tea in a rustic garden.",
        timeSlot: "Afternoon (12PM - 5PM)",
        subcategory: "Authentic Dining",
        notes: "Stop by the village water mill and silk weaving demonstration.",
      },
      {
        name: "Mahmutlar Coastal Beach Sunset",
        description:
          "Head back along the eastern coastline, relaxing at a beach club in Mahmutlar with sunset cocktail views.",
        timeSlot: "Evening (5PM - 9PM)",
        subcategory: "Beach & Relaxation",
        notes: "Unobstructed sunset views over the Alanya Castle peninsula.",
      },
    ],
  },
  {
    dayLabel: "Day 4",
    theme: "Mediterranean Boat Cruise & Sea Caves",
    items: [
      {
        name: "Alanya Coastline Boat Cruise",
        description:
          "Sail past the Castle peninsula, Pirates Cave, Lovers Cave, and Phosphorus Cave.",
        timeSlot: "Morning (8AM - 12PM)",
        subcategory: "Boat Tour & Sea",
        notes: "Snorkeling equipment and lunch are usually included on board.",
      },
      {
        name: "Swimming in Turquoise Bays",
        description:
          "Anchor in secluded bays around Ulas beach and swim in pristine Mediterranean waters.",
        timeSlot: "Afternoon (12PM - 5PM)",
        subcategory: "Water Sports & Swimming",
        notes: "Look out for sea turtles and dolphins often spotted near the castle cliffs.",
      },
      {
        name: "Rooftop Lounge Sunset Drinks",
        description:
          "Sip crafted Mediterranean cocktails overlooking the harbor and lit-up fortress.",
        timeSlot: "Evening (5PM - 9PM)",
        subcategory: "Nightlife & Lounge",
        notes: "Book ahead for a terrace table at sunset.",
      },
    ],
  },
  {
    dayLabel: "Day 5",
    theme: "Side Ancient Ruins & Manavgat Waterfalls",
    items: [
      {
        name: "Side Ancient City & Apollo Temple",
        description:
          "Take a day trip to the ancient Greco-Roman port city of Side and marvel at the iconic Temple of Apollo by the sea.",
        timeSlot: "Morning (8AM - 12PM)",
        subcategory: "Archaeology & History",
        notes: "Located about 45 minutes west of Alanya along the D400 highway.",
      },
      {
        name: "Manavgat River & Waterfall Picnic",
        description:
          "Visit the wide foaming Manavgat Waterfall surrounded by shady pine trees and tea gardens.",
        timeSlot: "Afternoon (12PM - 5PM)",
        subcategory: "Nature & Sightseeing",
        notes: "Boat cruises along the Manavgat River are also available.",
      },
      {
        name: "Alanya Old Town (Tophane) Night Walk",
        description:
          "Walk through the atmospheric cobbled lanes of Tophane beneath the ancient castle ramparts.",
        timeSlot: "Evening (5PM - 9PM)",
        subcategory: "Culture & Atmosphere",
        notes: "Atmospheric lantern-lit alleys with charming wooden Ottoman houses.",
      },
    ],
  },
  {
    dayLabel: "Day 6",
    theme: "Active Thrills & Traditional Hammam",
    items: [
      {
        name: "Tandem Paragliding over Cleopatra Beach",
        description:
          "Launch from 800m up in the Taurus Mountains and glide like an eagle down to Cleopatra Beach.",
        timeSlot: "Morning (8AM - 12PM)",
        subcategory: "Adrenaline & Adventure",
        notes: "GoPro photo and video recording is captured by certified tandem pilots.",
      },
      {
        name: "Authentic Turkish Hammam & Spa",
        description:
          "Rejuvenate with a full traditional Turkish bath ritual: sauna, kese exfoliation, foam bath, and aromatherapy massage.",
        timeSlot: "Afternoon (12PM - 5PM)",
        subcategory: "Wellness & Spa",
        notes: "Allow about 90 minutes for the complete royal ritual.",
      },
      {
        name: "Charcoal Kebab & Meze Feast",
        description:
          "Enjoy a banquet of Anatolian kebabs, freshly baked balloon bread, and spicy Ezme salad.",
        timeSlot: "Evening (5PM - 9PM)",
        subcategory: "Local Dining",
        notes: "Try traditional Adana kebab or lamb shanks baked in clay pots.",
      },
    ],
  },
  {
    dayLabel: "Day 7",
    theme: "Panoramic Vistas & Leisurely Farewell",
    items: [
      {
        name: "Seyir Terasi Panoramic Breakfast",
        description:
          "Savor an extensive Turkish village breakfast on the mountain terraces overlooking all of Alanya.",
        timeSlot: "Morning (8AM - 12PM)",
        subcategory: "Breakfast & Viewpoint",
        notes: "Unmatched morning views with unlimited hot Turkish çay.",
      },
      {
        name: "Central Grand Bazaar Souvenir Shopping",
        description:
          "Browse quality Turkish leather, handmade ceramics, Anatolian carpets, and Turkish delight.",
        timeSlot: "Afternoon (12PM - 5PM)",
        subcategory: "Shopping & Souvenirs",
        notes: "Polite bargaining is customary and welcomed in the bazaars.",
      },
      {
        name: "Farewell Sunset Walk on Cleopatra Pier",
        description:
          "Watch the sun dip below the Mediterranean horizon on your final evening in paradise.",
        timeSlot: "Evening (5PM - 9PM)",
        subcategory: "Relaxation & Sunset",
        notes: "Capture unforgettable farewell photos by the turquoise shore.",
      },
    ],
  },
];

export class AiGuideService {
  /**
   * Send a question to the AI Holiday Guide / Concierge.
   * Calls `POST /ai/guide` on backend.
   * Gracefully falls back to curated local knowledge if the backend or AI is unreachable.
   */
  async askGuide(dto: AiGuideDto): Promise<AskGuideResponse> {
    try {
      const result = await apiClient.post<AskGuideResponse>("/ai/guide", dto);
      if (result && typeof result.answer === "string" && result.answer.trim().length > 0) {
        return result;
      }
    } catch (err) {
      logger.warn("Failed to reach AI guide backend, using curated fallback:", err);
    }

    return {
      answer: this.getCuratedFallback(dto),
      cached: false,
    };
  }

  /**
   * Requests AI to generate a structured day-by-day itinerary.
   * Calls `POST /ai/itinerary` on the NestJS backend, with resilient client-side fallback.
   */
  async generateItinerary(params: GenerateItineraryParams): Promise<GenerateItineraryResult> {
    const daysCount = Math.max(1, Math.min(params.days || 3, 14));
    const district = params.district || "Alanya";

    try {
      const response = await apiClient.post<GenerateItineraryResult & { itinerary?: GeneratedDayPlan[] }>("/ai/itinerary", {
        days: daysCount,
        district,
        interests: params.interests,
        pace: params.pace,
      });

      if (response) {
        const daysList = response.days || response.itinerary;
        if (Array.isArray(daysList) && daysList.length > 0) {
          const normalizedDays: GeneratedDayPlan[] = daysList.slice(0, daysCount).map((d, index) => ({
            dayLabel: d.dayLabel || `Day ${index + 1}`,
            theme: d.theme || `Day ${index + 1} Highlights`,
            items: (d.items || []).map((item) => ({
              ...item,
              name: item.name || (item as { title?: string }).title || "Sightseeing Activity",
              timeSlot: item.timeSlot || (item as { time?: string }).time || "Flexible",
            })),
          }));

          return {
            title: response.title || `${daysCount}-Day ${district} Adventure`,
            description: response.description || `A curated ${daysCount}-day itinerary exploring the best of ${district}.`,
            district,
            days: normalizedDays,
          };
        }
      }
    } catch (err) {
      logger.warn("Failed to generate itinerary with backend /ai/itinerary, using curated fallback template:", err);
    }

    return this.getCuratedItineraryFallback(params);
  }

  /**
   * Helper to parse and sanitize JSON string returned by Gemini.
   */
  private parseItineraryJson(raw: string): GenerateItineraryResult | null {
    try {
      let clean = raw.trim();
      // Remove markdown code fences if present (```json ... ``` or ``` ...)
      if (clean.startsWith("```")) {
        clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }

      // Find first '{' and last '}'
      const firstBrace = clean.indexOf("{");
      const lastBrace = clean.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.slice(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(clean);
      if (parsed && Array.isArray(parsed.days)) {
        return parsed as GenerateItineraryResult;
      }
    } catch {
      // Ignore JSON parse error, fallback will be used
    }
    return null;
  }

  /**
   * Curated offline / error fallback answer tailored to user questions.
   */
  getCuratedFallback(dto: AiGuideDto): string {
    const q = (dto.userQuestion || "").toLowerCase();
    const loc = (dto.location || "").toLowerCase();

    if (q.includes("beach") || q.includes("kleopatra") || q.includes("swim") || loc.includes("kleopatra")) {
      return (
        `🌊 **Cleopatra & Alanya Beaches Guide**\n\n` +
        `• **Cleopatra Beach**: Golden sand, crystal-clear water, and dramatic castle views. Sunbeds and umbrellas available along all stations.\n` +
        `• **Damlataş Beach**: At the base of the peninsula next to the cave, great for families and swimming.\n` +
        `• **Portakal & Tosmur Beach**: Quieter beaches to the east where Dim River meets the sea.\n` +
        `💡 *Tip: Water temperature stays comfortable for swimming from May through November.*`
      );
    }

    if (q.includes("castle") || q.includes("kale") || q.includes("teleferik") || q.includes("history")) {
      return (
        `🏰 **Alanya Castle & Historic Highlights**\n\n` +
        `• **Alanya Teleferik (Cable Car)**: Takes you from Cleopatra Beach directly to the castle gates in 5 minutes with breathtaking coastal views.\n` +
        `• **The Citadel (İç Kale)**: Byzantine church, historic cisterns, and 360-degree viewpoints.\n` +
        `• **Red Tower (Kızıl Kule) & Shipyard (Tersane)**: 13th-century Seljuk architecture located right at the harbor.\n` +
        `💡 *Tip: Visit late afternoon to explore the ruins and catch the world-famous sunset over Cleopatra Beach.*`
      );
    }

    if (q.includes("dim") || q.includes("cave") || q.includes("canyon") || q.includes("sapadere") || q.includes("nature")) {
      return (
        `🌲 **Nature & Mountain Escapes**\n\n` +
        `• **Dim Çayı (Dim River)**: Dine on floating platforms above cool mountain waters. Fantastic on hot summer days.\n` +
        `• **Dim Cave**: Huge stalactite cave situated high in the Taurus mountains.\n` +
        `• **Sapadere Canyon**: Spectacular 360m wooden walkway along waterfalls and turquoise pools.\n` +
        `💡 *Tip: Wear water shoes if you plan to take a refreshing dip in Sapadere's canyon pools.*`
      );
    }

    if (q.includes("eat") || q.includes("food") || q.includes("restaurant") || q.includes("breakfast") || q.includes("kebab")) {
      return (
        `🍽️ **Alanya Dining & Local Cuisine**\n\n` +
        `• **Serpme Kahvaltı (Turkish Breakfast)**: A table-filling feast with cheeses, olives, jams, eggs, menemen, and fresh bread.\n` +
        `• **Harbor Seafood**: Fresh Mediterranean sea bass (levrek) and sea bream (çipura) paired with Turkish mezze.\n` +
        `• **Authentic Kebab**: Try charcoal-grilled İskender kebab and freshly baked lavaş flatbreads in the town center.\n` +
        `💡 *Tip: For panoramic dining, check out the terrace restaurants in the Kale old town or along Seyir Terası.*`
      );
    }

    if (q.includes("bus") || q.includes("transit") || q.includes("taxi") || q.includes("airport") || q.includes("transport")) {
      return (
        `🚌 **Getting Around Alanya**\n\n` +
        `• **Dolmuş (City Buses)**: Lines 1 and 101 run along the main coastline through Cleopatra Beach, the Center, Oba, and Mahmutlar.\n` +
        `• **Airports**: Gazipaşa-Alanya Airport (GZP) is 40km east (approx 35-45 mins); Antalya Airport (AYT) is 125km west (approx 1.5 - 2 hrs).\n` +
        `• **Taxis**: Readily available at designated stands across town with taximeters or set route rates.\n` +
        `• **Scooters & Bikes**: Dedicated seaside cycling and walking promenade runs across the entire coast.`
      );
    }

    return (
      `✨ **Welcome to Alanya Holidays Guide**\n\n` +
      `Here are recommended top highlights for your holiday in Alanya:\n` +
      `• **Alanya Castle (Kalesi)**: Medieval Seljuk fortress with 360° Mediterranean vistas.\n` +
      `• **Cleopatra Beach & Damlataş Cave**: Iconic golden sands and historic stalactites.\n` +
      `• **Dim Çayı River**: Floating restaurants and cool mountain river breeze.\n` +
      `• **Sapadere Canyon**: Suspended wooden walkways and emerald waterfalls.\n` +
      `• **Harbor & Red Tower**: Historic shipyards and bustling seaside promenade.\n\n` +
      `Feel free to ask for custom itineraries, restaurant tips, transit advice, or hidden gems!`
    );
  }

  /**
   * Curated offline / error fallback for generating structured day plans.
   */
  getCuratedItineraryFallback(params: GenerateItineraryParams): GenerateItineraryResult {
    const daysCount = Math.max(1, Math.min(params.days || 3, 14));
    const district = params.district || "Alanya";
    const selectedDays: GeneratedDayPlan[] = [];

    for (let i = 0; i < daysCount; i++) {
      const template = CURATED_DAY_TEMPLATES[i % CURATED_DAY_TEMPLATES.length];
      selectedDays.push({
        dayLabel: `Day ${i + 1}`,
        theme: template.theme,
        items: template.items.map((item) => ({ ...item })),
      });
    }

    return {
      title: `${daysCount}-Day Curated ${district} Itinerary`,
      description: `A handpicked ${daysCount}-day holiday plan exploring the highlights, scenic coastlines, historic treasures, and culinary delights of ${district}.`,
      district,
      days: selectedDays,
    };
  }
}

export const aiGuideService = new AiGuideService();

export const askGuide = (dto: AiGuideDto) => aiGuideService.askGuide(dto);
export const generateItinerary = (params: GenerateItineraryParams) =>
  aiGuideService.generateItinerary(params);
