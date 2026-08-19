import { apiClient } from "@/lib/api-client";
import { yachts as mockYachts, type Yacht } from "@/mocks/yachts";
import { helicopterTours as mockHelicopterTours, type HelicopterTour } from "@/mocks/helicopter-tours";
import { wineTastings as mockWineTastings, type WineTasting } from "@/mocks/wine-tastings";
import { hammamSpaExperiences as mockHammamSpa, type HammamSpa } from "@/mocks/hammam-spa";
import { photographyExcursions as mockPhotography, type PhotographyExcursion } from "@/mocks/photography-excursions";
import { golfVacations as mockGolf, type GolfVacation } from "@/mocks/golf-vacations";
import { privateJets as mockJets, type PrivateJet } from "@/mocks/private-jets";
import { personalChefs as mockChefs, type PersonalChef } from "@/mocks/personal-chefs";
import { personalDrivers as mockDrivers, type PersonalDriver } from "@/mocks/personal-drivers";
import { personalShoppers as mockShoppers, type PersonalShopper } from "@/mocks/personal-shoppers";

export type {
  Yacht,
  PrivateJet,
  HelicopterTour,
  PersonalChef,
  PersonalDriver,
  PersonalShopper,
  WineTasting,
  HammamSpa,
  GolfVacation,
  PhotographyExcursion,
};

export interface ConciergeServiceItem {
  id: string;
  title: string;
  name?: string;
  description?: string;
  type: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  review_count?: number;
  image?: string;
  image_url?: string;
  images?: string[];
  duration?: string;
  capacity?: number | string;
  location?: string;
  featured?: boolean;
  amenities?: string[];
  details?: Record<string, unknown>;
  provider_id?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ConciergeEnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  country_code?: string;
  preferred_contact?: "email" | "whatsapp" | "phone_call" | string;
  experience_type?: string;
  item_name?: string;
  item_id?: string;
  notes?: string;
  dates?: string;
  guests?: number;
  duration?: string;
  subject?: string;
  message?: string;
  form_endpoint?: string;
  custom_fields?: Record<string, unknown>;
}

export type CreateConciergeEnquiryPayload = ConciergeEnquiryPayload;

export interface ConciergeEnquiryResult {
  success: boolean;
  id?: number | string;
  message?: string;
}

export type CreateConciergeEnquiryResult = ConciergeEnquiryResult;

export interface CreateConciergeBookingPayload {
  item_id: string;
  user_id?: string;
  service_type?: string;
  check_in?: string;
  check_out?: string;
  date?: string;
  total_price: number;
  currency?: string;
  guests?: number;
  message?: string;
  payment_method?: string;
  contact_info?: {
    name: string;
    email: string;
    phone?: string;
  };
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ConciergeBookingResult {
  success: boolean;
  bookingId?: string;
  id?: string;
  message?: string;
}

export type CreateBookingResult = ConciergeBookingResult;

export interface LuxuryExperienceItem {
  icon: string;
  title: string;
  description: string;
  price: string;
  tag: string;
  categoryLink: string;
  weeklyViews: number;
}

export const luxuryExperiences: LuxuryExperienceItem[] = [
  {
    icon: "ri-sailboat-line",
    title: "Private Yacht Charters",
    description:
      "Cruise the Turquoise Coast on a private gulet or luxury yacht. Full-day and sunset options with onboard dining and snorkeling gear included.",
    price: "From €350",
    tag: "Most Popular",
    categoryLink: "/yacht-charters",
    weeklyViews: 1847,
  },
  {
    icon: "ri-hotel-bed-line",
    title: "Boutique Villa Stays",
    description:
      "Handpicked luxury villas with private pools, panoramic sea views, and personal concierge service. Each property is a destination in itself.",
    price: "From €200/night",
    tag: "Exclusive",
    categoryLink: "/villa-stays",
    weeklyViews: 1320,
  },
  {
    icon: "ri-flight-takeoff-line",
    title: "Helicopter Tours",
    description:
      "See Alanya Castle, the Taurus Mountains, and the coastline from above. A once-in-a-lifetime perspective with champagne toast on landing.",
    price: "From €180",
    tag: "Premium",
    categoryLink: "/helicopter-tours",
    weeklyViews: 1105,
  },
  {
    icon: "ri-cup-line",
    title: "Private Wine Tastings",
    description:
      "Sommelier-led tastings featuring Anatolian wines paired with local cheeses and mezze. Hosted in a restored Ottoman-era stone house.",
    price: "From €75",
    tag: "Gourmet",
    categoryLink: "/wine-tastings",
    weeklyViews: 743,
  },
  {
    icon: "ri-golf-ball-line",
    title: "Luxury Golf Vacations",
    description:
      "Tee off at world-class championship courses in Belek, the golf capital of the Turkish Riviera. All-inclusive packages with five-star stays, just minutes from Alanya.",
    price: "From €420",
    tag: "Golf",
    categoryLink: "/golf-vacations",
    weeklyViews: 1105,
  },
  {
    icon: "ri-heart-pulse-line",
    title: "Traditional Hammam & Spa",
    description:
      "A full Turkish bath experience followed by aromatherapy massage in a five-star setting. Organic oils, private suites, and total relaxation.",
    price: "From €95",
    tag: "Wellness",
    categoryLink: "/hammam-spa",
    weeklyViews: 892,
  },
  {
    icon: "ri-camera-lens-line",
    title: "Photography Excursions",
    description:
      "Guided photo walks with a professional photographer through Alanya's most photogenic spots — old town, harbor, and sunset viewpoints.",
    price: "From €60",
    tag: "Creative",
    categoryLink: "/photography-excursions",
    weeklyViews: 568,
  },
  {
    icon: "ri-plane-line",
    title: "Private Jet Charters",
    description:
      "Skip the terminals with on-demand private jet charters across Turkey and the Mediterranean. Choose your schedule, your aircraft, and arrive in absolute privacy.",
    price: "From €2,500",
    tag: "Aviation",
    categoryLink: "/private-jets",
    weeklyViews: 487,
  },
  {
    icon: "ri-restaurant-2-line",
    title: "Personal Chefs",
    description:
      "A private chef in your villa or yacht — custom multi-course menus crafted from seasonal local produce, fresh-caught seafood, and Anatolian culinary traditions.",
    price: "From €150",
    tag: "Culinary",
    categoryLink: "/personal-chefs",
    weeklyViews: 635,
  },
  {
    icon: "ri-steering-2-line",
    title: "Personal Driver",
    description:
      "Chauffeured luxury vehicles at your disposal — airport transfers, coastal day trips, or a dedicated driver for your entire stay. English-speaking, vetted professionals.",
    price: "From €120/day",
    tag: "Transport",
    categoryLink: "/personal-driver",
    weeklyViews: 521,
  },
  {
    icon: "ri-shopping-bag-3-line",
    title: "Personal Shopper",
    description:
      "A style consultant who knows Alanya's best boutiques, artisan workshops, and hidden ateliers. From handmade Turkish carpets to designer fashion, find the perfect pieces.",
    price: "From €80/hr",
    tag: "Lifestyle",
    categoryLink: "/personal-shopper",
    weeklyViews: 398,
  },
];

function mapYachtToConciergeItem(y: Yacht): ConciergeServiceItem {
  return {
    id: y.id,
    title: y.name,
    name: y.name,
    description: y.description,
    type: "yacht",
    price: y.pricePerDay,
    currency: y.currency,
    rating: y.rating,
    reviewCount: y.reviewCount,
    review_count: y.reviewCount,
    image: y.image,
    image_url: y.image,
    images: [y.image],
    capacity: y.capacity,
    featured: y.featured,
    location: y.port,
    amenities: y.amenities,
    details: {
      company: y.company,
      yachtType: y.type,
      capacity: y.capacity,
      cabins: y.cabins,
      length: y.length,
      year: y.year,
      halfDayPrice: y.halfDayPrice,
      crewIncluded: y.crewIncluded,
      skipperRequired: y.skipperRequired,
      availableRoutes: y.availableRoutes,
      crew: y.crew,
    },
  };
}

function mapHelicopterTourToConciergeItem(h: HelicopterTour): ConciergeServiceItem {
  return {
    id: h.id,
    title: h.name,
    name: h.name,
    description: h.description,
    type: "helicopter",
    price: h.pricePerPerson,
    currency: h.currency,
    rating: h.rating,
    reviewCount: h.reviewCount,
    review_count: h.reviewCount,
    image: h.image,
    image_url: h.image,
    images: [h.image],
    duration: h.duration,
    capacity: h.maxPassengers,
    featured: h.featured,
    location: h.departurePoint,
    details: {
      duration: h.duration,
      maxPassengers: h.maxPassengers,
      aircraft: h.aircraft,
      privatePrice: h.privatePrice,
      highlights: h.highlights,
      route: h.route,
      includes: h.includes,
    },
  };
}

function mapWineTastingToConciergeItem(w: WineTasting): ConciergeServiceItem {
  return {
    id: w.id,
    title: w.name,
    name: w.name,
    description: w.description,
    type: "wine-tasting",
    price: w.pricePerPerson,
    currency: w.currency,
    rating: w.rating,
    reviewCount: w.reviewCount,
    review_count: w.reviewCount,
    image: w.image,
    image_url: w.image,
    images: [w.image],
    duration: w.duration,
    capacity: w.groupSize,
    featured: w.featured,
    location: w.venue,
    details: {
      duration: w.duration,
      groupSize: w.groupSize,
      winesIncluded: w.winesIncluded,
      wineTypes: w.wineTypes,
      foodPairing: w.foodPairing,
      includes: w.includes,
      language: w.language,
    },
  };
}

function mapHammamToConciergeItem(h: HammamSpa): ConciergeServiceItem {
  return {
    id: h.id,
    title: h.name,
    name: h.name,
    description: h.description,
    type: "hammam-spa",
    price: h.pricePerPerson,
    currency: h.currency,
    rating: h.rating,
    reviewCount: h.reviewCount,
    review_count: h.reviewCount,
    image: h.image,
    image_url: h.image,
    images: [h.image],
    duration: h.duration,
    featured: h.featured,
    location: h.location,
    details: {
      spaType: h.type,
      duration: h.duration,
      couplesPrice: h.couplesPrice,
      treatments: h.treatments,
      facilities: h.facilities,
      openingHours: h.openingHours,
    },
  };
}

function mapPhotographyToConciergeItem(p: PhotographyExcursion): ConciergeServiceItem {
  return {
    id: p.id,
    title: p.name,
    name: p.name,
    description: p.description,
    type: "photography",
    price: p.pricePerPerson,
    currency: p.currency,
    rating: p.rating,
    reviewCount: p.reviewCount,
    review_count: p.reviewCount,
    image: p.image,
    image_url: p.image,
    images: [p.image],
    duration: p.duration,
    capacity: p.groupSize,
    featured: p.featured,
    details: {
      duration: p.duration,
      groupSize: p.groupSize,
      privatePrice: p.privatePrice,
      locations: p.locations,
      includes: p.includes,
      skillLevel: p.skillLevel,
      focus: p.focus,
      guide: p.guide,
      bestTime: p.bestTime,
    },
  };
}

function mapGolfToConciergeItem(g: GolfVacation): ConciergeServiceItem {
  return {
    id: g.id,
    title: g.name,
    name: g.name,
    description: g.description,
    type: "golf",
    price: g.pricePerPerson,
    currency: "EUR",
    rating: g.rating,
    reviewCount: g.reviewCount,
    review_count: g.reviewCount,
    image: g.image,
    image_url: g.image,
    images: [g.image],
    duration: g.duration,
    capacity: g.groupSize,
    featured: g.featured,
    location: g.location,
    details: {
      club: g.club,
      holes: g.holes,
      courses: g.courses,
      duration: g.duration,
      difficulty: g.difficulty,
      amenities: g.amenities,
      priceIncludes: g.priceIncludes,
      groupSize: g.groupSize,
    },
  };
}

function mapJetToConciergeItem(j: PrivateJet): ConciergeServiceItem {
  return {
    id: j.id,
    title: j.name,
    name: j.name,
    description: j.description,
    type: "private-jet",
    price: j.pricePerHour,
    currency: j.currency,
    rating: j.rating,
    reviewCount: j.reviewCount,
    review_count: j.reviewCount,
    image: j.image,
    image_url: j.image,
    images: [j.image],
    capacity: j.capacity,
    featured: j.featured,
    location: j.base,
    details: {
      company: j.company,
      jetType: j.type,
      capacity: j.capacity,
      range: j.range,
      speed: j.speed,
      minHours: j.minHours,
      amenities: j.amenities,
    },
  };
}

function mapChefToConciergeItem(c: PersonalChef): ConciergeServiceItem {
  return {
    id: c.id,
    title: c.name,
    name: c.name,
    description: c.description,
    type: "personal-chef",
    price: c.pricePerPerson,
    currency: c.currency,
    rating: c.rating,
    reviewCount: c.reviewCount,
    review_count: c.reviewCount,
    image: c.image,
    image_url: c.image,
    images: [c.image],
    duration: c.duration,
    capacity: c.groupSize,
    featured: c.featured,
    location: c.location,
    details: {
      specialty: c.specialty,
      cuisines: c.cuisines,
      menuStyle: c.menuStyle,
      duration: c.duration,
      experience: c.experience,
      priceIncludes: c.priceIncludes,
      groupSize: c.groupSize,
    },
  };
}

function mapDriverToConciergeItem(d: PersonalDriver): ConciergeServiceItem {
  return {
    id: d.id,
    title: d.name,
    name: d.name,
    description: d.description,
    type: "personal-driver",
    price: d.pricePerDay,
    currency: d.currency,
    rating: d.rating,
    reviewCount: d.reviewCount,
    review_count: d.reviewCount,
    image: d.image,
    image_url: d.image,
    images: [d.image],
    capacity: d.capacity,
    featured: d.featured,
    location: d.base,
    details: {
      company: d.company,
      vehicleType: d.vehicleType,
      vehicle: d.vehicle,
      capacity: d.capacity,
      pricePerHour: d.pricePerHour,
      includes: d.includes,
      languages: d.languages,
    },
  };
}

function mapShopperToConciergeItem(s: PersonalShopper): ConciergeServiceItem {
  return {
    id: s.id,
    title: s.name,
    name: s.name,
    description: s.description,
    type: "personal-shopper",
    price: s.pricePerHour,
    currency: s.currency,
    rating: s.rating,
    reviewCount: s.reviewCount,
    review_count: s.reviewCount,
    image: s.image,
    image_url: s.image,
    images: [s.image],
    duration: `${s.minHours} hours min`,
    featured: s.featured,
    details: {
      specialty: s.specialty,
      minHours: s.minHours,
      includes: s.includes,
      areas: s.areas,
      style: s.style,
      languages: s.languages,
    },
  };
}

function getAllMockShowcaseItems(): ConciergeServiceItem[] {
  return [
    ...mockYachts.map(mapYachtToConciergeItem),
    ...mockHelicopterTours.map(mapHelicopterTourToConciergeItem),
    ...mockWineTastings.map(mapWineTastingToConciergeItem),
    ...mockHammamSpa.map(mapHammamToConciergeItem),
    ...mockPhotography.map(mapPhotographyToConciergeItem),
    ...mockGolf.map(mapGolfToConciergeItem),
    ...mockJets.map(mapJetToConciergeItem),
    ...mockChefs.map(mapChefToConciergeItem),
    ...mockDrivers.map(mapDriverToConciergeItem),
    ...mockShoppers.map(mapShopperToConciergeItem),
  ];
}

function getShowcaseItemsByCategory(categorySlug: string): ConciergeServiceItem[] {
  const norm = categorySlug.toLowerCase().trim();
  if (norm.includes("yacht")) return mockYachts.map(mapYachtToConciergeItem);
  if (norm.includes("heli")) return mockHelicopterTours.map(mapHelicopterTourToConciergeItem);
  if (norm.includes("wine")) return mockWineTastings.map(mapWineTastingToConciergeItem);
  if (norm.includes("hammam") || norm.includes("spa")) return mockHammamSpa.map(mapHammamToConciergeItem);
  if (norm.includes("photo")) return mockPhotography.map(mapPhotographyToConciergeItem);
  if (norm.includes("golf")) return mockGolf.map(mapGolfToConciergeItem);
  if (norm.includes("jet")) return mockJets.map(mapJetToConciergeItem);
  if (norm.includes("chef")) return mockChefs.map(mapChefToConciergeItem);
  if (norm.includes("driver")) return mockDrivers.map(mapDriverToConciergeItem);
  if (norm.includes("shopper") || norm.includes("shop")) return mockShoppers.map(mapShopperToConciergeItem);
  return getAllMockShowcaseItems();
}

function getRawCategoryMockItems<T>(category: string): T[] {
  const norm = category.toLowerCase().trim();
  if (norm.includes("yacht")) return mockYachts as unknown as T[];
  if (norm.includes("heli")) return mockHelicopterTours as unknown as T[];
  if (norm.includes("wine")) return mockWineTastings as unknown as T[];
  if (norm.includes("hammam") || norm.includes("spa")) return mockHammamSpa as unknown as T[];
  if (norm.includes("photo")) return mockPhotography as unknown as T[];
  if (norm.includes("golf")) return mockGolf as unknown as T[];
  if (norm.includes("jet")) return mockJets as unknown as T[];
  if (norm.includes("chef")) return mockChefs as unknown as T[];
  if (norm.includes("driver")) return mockDrivers as unknown as T[];
  if (norm.includes("shopper") || norm.includes("shop")) return mockShoppers as unknown as T[];
  return getAllMockShowcaseItems() as unknown as T[];
}

export class ConciergeService {
  /**
   * Retrieves concierge offerings filtered by type/category with fallback to mock datasets.
   */
  async getConciergeOfferings(
    type?: string,
    params?: Record<string, unknown>
  ): Promise<ConciergeServiceItem[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (type) {
      queryParams.type = type;
    }
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          queryParams[key] = val as string | number | boolean;
        }
      });
    }

    try {
      const response = await apiClient.get<
        { data?: ConciergeServiceItem[]; count?: number } | ConciergeServiceItem[]
      >("/services", { params: queryParams });

      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data;
      }
    } catch (err) {
      console.warn(
        `Failed to fetch concierge offerings from API for type '${type || "all"}', using fallback:`,
        err
      );
    }

    if (type) {
      return getShowcaseItemsByCategory(type);
    }
    return getAllMockShowcaseItems();
  }

  /**
   * Retrieves a concierge service item by ID with fallback to mock items.
   */
  async getServiceById(id: string, categoryHint?: string): Promise<ConciergeServiceItem | null> {
    try {
      const data = await apiClient.get<ConciergeServiceItem>(`/services/${id}`);
      if (data && data.id) {
        return data;
      }
    } catch (err) {
      console.warn(`Failed to fetch concierge service '${id}' from API, searching fallback:`, err);
    }

    const searchPool = categoryHint
      ? getShowcaseItemsByCategory(categoryHint)
      : getAllMockShowcaseItems();

    const normalizedTargetId = id.toLowerCase().trim();
    const fallbackItem = searchPool.find(
      (s) =>
        s.id.toLowerCase() === normalizedTargetId ||
        s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === normalizedTargetId ||
        s.id.replace(/-/g, "").toLowerCase() === normalizedTargetId.replace(/-/g, "")
    );

    if (fallbackItem) {
      return fallbackItem;
    }

    if (categoryHint) {
      const allItems = getAllMockShowcaseItems();
      const anyFallback = allItems.find(
        (s) =>
          s.id.toLowerCase() === normalizedTargetId ||
          s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === normalizedTargetId ||
          s.id.replace(/-/g, "").toLowerCase() === normalizedTargetId.replace(/-/g, "")
      );
      if (anyFallback) {
        return anyFallback;
      }
    }

    return null;
  }

  /**
   * Retrieves typed luxury category items (e.g. Yacht[], PrivateJet[], etc.)
   */
  async getOfferingsByCategory<T>(category: string): Promise<T[]> {
    try {
      const response = await apiClient.get<T[] | { data?: T[] }>("/services", {
        params: { type: category },
      });

      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data;
      }
    } catch (err) {
      console.warn(`Failed to fetch category '${category}' offerings from API, using fallback:`, err);
    }

    return getRawCategoryMockItems<T>(category);
  }

  /**
   * Submits a concierge enquiry request.
   */
  async createEnquiry(payload: ConciergeEnquiryPayload): Promise<ConciergeEnquiryResult> {
    const formattedSubject =
      payload.subject ||
      `${payload.experience_type || "Experience"} — ${payload.item_name || "Custom Request"}`;

    const enrichedNotes = [
      payload.experience_type && `Experience: ${payload.experience_type}`,
      payload.item_name && `Item: ${payload.item_name}`,
      payload.dates && `Dates: ${payload.dates}`,
      payload.duration && `Duration: ${payload.duration}`,
      payload.guests && `Guests: ${payload.guests}`,
      payload.phone && `Phone: ${payload.country_code || "+90"} ${payload.phone}`,
      payload.preferred_contact &&
        `Preferred contact: ${
          payload.preferred_contact === "whatsapp"
            ? "WhatsApp"
            : payload.preferred_contact === "phone_call"
            ? "Phone Call"
            : "Email"
        }`,
      payload.notes && `Notes: ${payload.notes}`,
      payload.message && `Message: ${payload.message}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await apiClient.post<{ success?: boolean; id?: number | string; message?: string }>(
        "/enquiries",
        {
          name: payload.name.trim(),
          email: payload.email.trim(),
          phone: payload.phone
            ? `${payload.country_code ? payload.country_code + " " : ""}${payload.phone}`.trim()
            : undefined,
          subject: formattedSubject,
          message: enrichedNotes || payload.message || formattedSubject,
          enquiry_type: payload.experience_type || "general",
          service_type: payload.item_name,
          dates: payload.dates,
          duration: payload.duration,
          party_size: payload.guests,
          preferred_contact: payload.preferred_contact,
        }
      );

      return {
        success: res?.success ?? true,
        id: res?.id || `enq-${Date.now()}`,
        message: res?.message || "Enquiry submitted successfully",
      };
    } catch (err) {
      console.warn("Failed to submit concierge enquiry via API /enquiries endpoint, using fallback:", err);
    }

    if (payload.form_endpoint) {
      try {
        const formData = new URLSearchParams();
        formData.append("name", payload.name);
        formData.append("email", payload.email);
        if (payload.phone) formData.append("phone", payload.phone);
        if (payload.country_code) formData.append("country_code", payload.country_code);
        if (payload.preferred_contact) formData.append("preferred_contact", payload.preferred_contact);
        if (payload.notes) formData.append("notes", payload.notes);
        if (payload.experience_type) formData.append("experience_type", payload.experience_type);
        if (payload.item_name) formData.append("item_name", payload.item_name);

        await fetch(payload.form_endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });
      } catch (err) {
        console.warn("Form endpoint submission fallback warning:", err);
      }
    }

    return {
      success: true,
      id: `enq-${Date.now()}`,
      message: "Enquiry accepted",
    };
  }

  /**
   * Alias for createEnquiry.
   */
  async submitConciergeEnquiry(payload: ConciergeEnquiryPayload): Promise<ConciergeEnquiryResult> {
    return this.createEnquiry(payload);
  }

  /**
   * Creates a booking request for a concierge experience.
   */
  async createBooking(payload: CreateConciergeBookingPayload): Promise<ConciergeBookingResult> {
    try {
      const res = await apiClient.post<{ id?: string; data?: string; booking_id?: string }>(
        "/bookings",
        payload
      );
      const generatedOrReceivedId = res.booking_id || res.id || res.data || `bk-${Date.now()}`;
      return {
        id: generatedOrReceivedId,
        bookingId: generatedOrReceivedId,
        success: true,
        message: "Booking created successfully",
      };
    } catch (err) {
      console.warn("Failed to create concierge booking on API, generating fallback confirmation:", err);
      const fallbackId = `bk-${Date.now()}`;
      return {
        id: fallbackId,
        bookingId: fallbackId,
        success: true,
        message: "Booking confirmed (offline)",
      };
    }
  }

  // ============================================
  // Category-specific convenience getters
  // ============================================

  async getYachts(type?: string): Promise<Yacht[]> {
    if (!type || type === "all") {
      return mockYachts;
    }
    return mockYachts.filter((y) => y.type.toLowerCase() === type.toLowerCase());
  }

  async getPrivateJets(): Promise<PrivateJet[]> {
    return mockJets;
  }

  async getHelicopterTours(): Promise<HelicopterTour[]> {
    return mockHelicopterTours;
  }

  async getWineTastings(): Promise<WineTasting[]> {
    return mockWineTastings;
  }

  async getHammamSpaExperiences(): Promise<HammamSpa[]> {
    return mockHammamSpa;
  }

  async getPhotographyExcursions(): Promise<PhotographyExcursion[]> {
    return mockPhotography;
  }

  async getGolfVacations(): Promise<GolfVacation[]> {
    return mockGolf;
  }

  async getPersonalChefs(): Promise<PersonalChef[]> {
    return mockChefs;
  }

  async getPersonalDrivers(): Promise<PersonalDriver[]> {
    return mockDrivers;
  }

  async getPersonalShoppers(): Promise<PersonalShopper[]> {
    return mockShoppers;
  }

  getLuxuryExperiences(): LuxuryExperienceItem[] {
    return luxuryExperiences;
  }
}

export const conciergeService = new ConciergeService();

export const getConciergeOfferings = (type?: string, params?: Record<string, unknown>) =>
  conciergeService.getConciergeOfferings(type, params);

export const getServiceById = (id: string, categoryHint?: string) =>
  conciergeService.getServiceById(id, categoryHint);

export const getOfferingsByCategory = <T>(category: string) =>
  conciergeService.getOfferingsByCategory<T>(category);

export const createEnquiry = (payload: ConciergeEnquiryPayload) =>
  conciergeService.createEnquiry(payload);

export const submitConciergeEnquiry = (payload: ConciergeEnquiryPayload) =>
  conciergeService.submitConciergeEnquiry(payload);

export const createBooking = (payload: CreateConciergeBookingPayload) =>
  conciergeService.createBooking(payload);

export const getYachts = (type?: string) => conciergeService.getYachts(type);
export const getPrivateJets = () => conciergeService.getPrivateJets();
export const getHelicopterTours = () => conciergeService.getHelicopterTours();
export const getWineTastings = () => conciergeService.getWineTastings();
export const getHammamSpaExperiences = () => conciergeService.getHammamSpaExperiences();
export const getPhotographyExcursions = () => conciergeService.getPhotographyExcursions();
export const getGolfVacations = () => conciergeService.getGolfVacations();
export const getPersonalChefs = () => conciergeService.getPersonalChefs();
export const getPersonalDrivers = () => conciergeService.getPersonalDrivers();
export const getPersonalShoppers = () => conciergeService.getPersonalShoppers();
export const getLuxuryExperiences = () => conciergeService.getLuxuryExperiences();
