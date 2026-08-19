import { useState, useEffect, useCallback } from "react";
import type { PlanItem } from "@/hooks/usePlanner";
import { itinerariesService, type SavedItinerary } from "@/api-services/itineraries.service";

export interface SharedPlan {
  shareId: string;
  originalPlanId: string;
  name: string;
  description: string;
  authorName: string;
  sharedAt: string;
  category: string;
  items: Omit<PlanItem, "id">[];
  copyCount: number;
}

const STORAGE_KEY = "alanya-community-plans";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `share-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function seedCommunityPlans(): SharedPlan[] {
  return [
    {
      shareId: "community-1",
      originalPlanId: "",
      name: "Sunset & Seafood Evening",
      description:
        "A perfect evening in Alanya — start with a seaside stroll at Cleopatra Beach, then feast on fresh grilled fish at the harbor, and cap it off with cocktails at a rooftop bar overlooking the castle. Built this after three summers of trial and error — this is the definitive sunset route.",
      authorName: "Marco",
      sharedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      category: "Food & Nightlife",
      items: [
        {
          type: "custom",
          customName: "Sunset Walk — Cleopatra Beach Promenade",
          customDescription:
            "Start at the east end near the Damlataş Cave and walk west along the promenade. The sky turns unreal colors about 30 minutes before sunset. Grab a fresh-squeezed juice from a beachfront vendor.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Evening (5PM - 9PM)",
          notes: "Best spot for photos: the wooden pier about halfway down. Get there 45 minutes before sunset.",
          completed: false,
          order: 1,
        },
        {
          type: "custom",
          customName: "Fresh Seafood Dinner — Alanya Harbor",
          customDescription:
            "Pick any of the family-run fish restaurants right on the harbor. They display the day's catch on ice — point at what looks good. Grilled sea bass with meze starter is the move. The boats bobbing in the harbor and castle lights create the atmosphere.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Evening (5PM - 9PM)",
          notes:
            "Avoid the restaurants with aggressive touts. The quieter ones with locals eating are the real gems. Budget about 400-600 TL for two with wine.",
          completed: false,
          order: 2,
        },
        {
          type: "business",
          referenceId: "biz-017",
          image: "",
          subcategory: "Rooftop Bar",
          dayLabel: "Day 1",
          timeSlot: "Night (9PM+)",
          notes: "End the night here. The espresso martini is their signature. Castle views at night are magical.",
          completed: false,
          order: 3,
        },
      ],
      copyCount: 34,
    },
    {
      shareId: "community-2",
      originalPlanId: "",
      name: "Hidden Alanya — Off the Tourist Trail",
      description:
        "Skip the crowds. This route takes you to the quiet side of Alanya — a secret swimming cove only locals know about, a family-run gözleme spot in the hills, and a sunset viewpoint that tour buses never find. Built this after living here for 2 years.",
      authorName: "Elena",
      sharedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      category: "Off the Beaten Path",
      items: [
        {
          type: "custom",
          customName: "Secret Cove — İncekum Nature Park Area",
          customDescription:
            "Drive about 15 minutes east of Alanya toward İncekum. Look for a small dirt path just before the nature park entrance. Follow it down to a tiny pebble cove with crystal-clear water. Maybe 5 other people here on a busy day. Bring everything you need — there's nothing commercial here.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Morning (8AM - 12PM)",
          notes:
            "GPS: approximately 36.55, 32.05. The path is unmarked — look for the row of olive trees. Water shoes help, it's pebbly. Bring water and snacks.",
          completed: false,
          order: 1,
        },
        {
          type: "custom",
          customName: "Gözleme Lunch — Sapadere Village",
          customDescription:
            "Drive up toward Sapadere Canyon but stop at the village before the canyon entrance. An elderly couple runs a tiny gözleme stand from their garden — no sign, just smoke from the wood fire. Best spinach and cheese gözleme you'll ever eat, made while you watch, for about 40 TL.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Afternoon (12PM - 5PM)",
          notes:
            "Look for the blue-painted gate with grape vines overhead. Cash only. They also serve fresh ayran. Try the potato gözleme too.",
          completed: false,
          order: 2,
        },
        {
          type: "custom",
          customName: "Secret Sunset Point — Ehmedek Hill",
          customDescription:
            "Skip the crowded castle viewpoint. From the castle, walk east along the old walls for about 10 minutes to Ehmedek. There's a ruined watchtower with a flat top — climb up and you get a 360° panorama of the entire coastline, the Taurus Mountains, and the castle behind you. Zero tourists.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Evening (5PM - 9PM)",
          notes:
            "Bring a flashlight for the walk back down — the old wall path isn't lit. The watchtower climb is a bit sketchy (no railings), so be careful. Worth it a hundred times over.",
          completed: false,
          order: 3,
        },
        {
          type: "business",
          referenceId: "biz-024",
          image: "",
          subcategory: "Kebab Restaurant",
          dayLabel: "Day 1",
          timeSlot: "Night (9PM+)",
          notes:
            "After a day of exploring, nothing beats charcoal kebab. The İskender here is legendary. Casual, cheap, and always full of locals.",
          completed: false,
          order: 4,
        },
      ],
      copyCount: 51,
    },
    {
      shareId: "community-3",
      originalPlanId: "",
      name: "Day Trip to Side — Ancient Ruins & Beach",
      description:
        "A perfectly paced day trip to Side, about an hour east of Alanya. Walk among 2000-year-old Roman ruins, swim at a beach where ancient columns meet the sea, and eat at a family restaurant in the old town. The temple of Apollo at sunset is unforgettable. My go-to when friends visit.",
      authorName: "Ahmet",
      sharedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      category: "Day Trips",
      items: [
        {
          type: "business",
          referenceId: "biz-021",
          image: "",
          subcategory: "Scooter Rental",
          dayLabel: "Day 1",
          timeSlot: "Morning (8AM - 12PM)",
          notes:
            "Rent a scooter for the day to drive to Side — much more fun than the bus. About 1 hour along the coast road. Free delivery to your hotel.",
          completed: false,
          order: 1,
        },
        {
          type: "custom",
          customName: "Explore Side Ancient City & Amphitheater",
          customDescription:
            "Walk through the monumental gate into Side's ancient city. The Roman amphitheater seats 15,000 people and is incredibly well preserved. Then wander the colonnaded street past the agora, the hospital, and the nymphaeum. You're literally walking through 2000 years of history.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Morning (8AM - 12PM)",
          notes:
            "Amphitheater entry about 60 TL. Go early to avoid tour bus crowds. The whole ancient city is free to walk — you only pay for the amphitheater and museum.",
          completed: false,
          order: 2,
        },
        {
          type: "custom",
          customName: "Swim at Apollon Temple Beach",
          customDescription:
            "The iconic view you've seen in every Turkey tourism poster — Roman columns rising from the sand with the turquoise Mediterranean behind them. Swim right next to the Temple of Apollo. The water is shallow and clear. One of the most unique beach experiences anywhere.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Afternoon (12PM - 5PM)",
          notes:
            "Bring water shoes — some rocky areas near the columns. Sun loungers available for rent. The beach café does decent gözleme if you get hungry.",
          completed: false,
          order: 3,
        },
        {
          type: "custom",
          customName: "Late Lunch — Side Old Town",
          customDescription:
            "Wander the narrow streets of Side's old town behind the harbor. Avoid the waterfront tourist traps. Look for Ocakbaşı — a tiny family grill house — the mixed grill platter feeds two and the house-made pide is incredible.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Afternoon (12PM - 5PM)",
          notes:
            "Cash only at most old town restaurants. Budget about 350 TL for two. Try the künefe for dessert — it's baked in a copper pan.",
          completed: false,
          order: 4,
        },
        {
          type: "custom",
          customName: "Sunset at Temple of Apollo",
          customDescription:
            "Return to the temple about an hour before sunset. The columns glow golden and the sun drops directly behind them into the sea. Stay until the sky turns deep purple. This is the shot that'll make everyone back home jealous.",
          image: "",
          dayLabel: "Day 1",
          timeSlot: "Evening (5PM - 9PM)",
          notes:
            "Tripod recommended if you're into photography. Gets crowded 20 min before sunset — stake your spot early. Drive back to Alanya after dark is fine, the coast road is well lit.",
          completed: false,
          order: 5,
        },
      ],
      copyCount: 28,
    },
  ];
}

function loadSharedPlans(): SharedPlan[] {
  try {
    if (typeof localStorage === "undefined") return seedCommunityPlans();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        // Check if seeding is needed
        const hasSeeded = parsed.some(
          (p: SharedPlan) =>
            p.shareId === "community-1" ||
            p.shareId === "community-2" ||
            p.shareId === "community-3",
        );
        if (!hasSeeded) {
          const seeded = [...seedCommunityPlans(), ...parsed];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
          return seeded;
        }
        return parsed as SharedPlan[];
      }
    }
  } catch {
    // corrupted data
  }
  const seeded = seedCommunityPlans();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }
  return seeded;
}

function saveSharedPlans(plans: SharedPlan[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // storage full
  }
}

function mapSavedItineraryToSharedPlan(itin: SavedItinerary): SharedPlan {
  const params = (itin.params || {}) as Record<string, unknown>;
  const items: Omit<PlanItem, "id">[] = Array.isArray(itin.itinerary)
    ? (itin.itinerary as PlanItem[]).map(({ id: _id, ...rest }) => rest)
    : [];

  return {
    shareId: itin.id,
    originalPlanId: typeof params.originalPlanId === "string" ? params.originalPlanId : "",
    name: itin.title,
    description: typeof params.description === "string" ? params.description : "",
    authorName: typeof params.authorName === "string" ? params.authorName : "Community Member",
    sharedAt: itin.created_at || new Date().toISOString(),
    category: typeof params.category === "string" ? params.category : "Community",
    items,
    copyCount: typeof params.copyCount === "number" ? params.copyCount : 0,
  };
}

export function useSharedPlans() {
  const [sharedPlans, setSharedPlans] = useState<SharedPlan[]>(loadSharedPlans);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    saveSharedPlans(sharedPlans);
  }, [sharedPlans]);

  const fetchCommunityPlans = useCallback(async (category?: string): Promise<SharedPlan[]> => {
    setIsLoading(true);
    try {
      const data = await itinerariesService.getCommunityItineraries({ category });
      if (Array.isArray(data) && data.length > 0) {
        const cloudShared = data.map(mapSavedItineraryToSharedPlan);
        setSharedPlans((prev) => {
          const map = new Map<string, SharedPlan>();
          prev.forEach((p) => map.set(p.shareId, p));
          cloudShared.forEach((cp) => map.set(cp.shareId, cp));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn("Failed to fetch community itineraries:", err);
    } finally {
      setIsLoading(false);
    }
    return loadSharedPlans();
  }, []);

  const sharePlan = useCallback(
    (
      plan: {
        id: string;
        name: string;
        description: string;
        items: PlanItem[];
      },
      authorName?: string,
    ): SharedPlan => {
      const newShared: SharedPlan = {
        shareId: generateId(),
        originalPlanId: plan.id,
        name: plan.name,
        description: plan.description || "",
        authorName: authorName || "Alanya Traveler",
        sharedAt: new Date().toISOString(),
        category: "Community",
        items: plan.items.map(({ id: _id, ...rest }) => rest),
        copyCount: 0,
      };
      setSharedPlans((prev) => [newShared, ...prev]);

      // Background cloud save attempt
      itinerariesService
        .saveItinerary({
          title: plan.name,
          params: {
            description: plan.description || "",
            authorName: authorName || "Alanya Traveler",
            category: "Community",
            shared: true,
            originalPlanId: plan.id,
          },
          itinerary: plan.items,
        })
        .catch(() => {
          // silent offline fallback
        });

      return newShared;
    },
    [],
  );

  const unsharePlan = useCallback((shareId: string) => {
    setSharedPlans((prev) => prev.filter((p) => p.shareId !== shareId));
  }, []);

  const incrementCopyCount = useCallback((shareId: string) => {
    setSharedPlans((prev) =>
      prev.map((p) =>
        p.shareId === shareId ? { ...p, copyCount: p.copyCount + 1 } : p,
      ),
    );
  }, []);

  const isPlanShared = useCallback(
    (planId: string): string | null => {
      const found = sharedPlans.find((p) => p.originalPlanId === planId);
      return found ? found.shareId : null;
    },
    [sharedPlans],
  );

  return {
    sharedPlans,
    isLoading,
    fetchCommunityPlans,
    sharePlan,
    unsharePlan,
    incrementCopyCount,
    isPlanShared,
  };
}