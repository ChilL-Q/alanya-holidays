import { apiClient, ApiError } from "@/lib/api-client";
import { yachtTypes, type Yacht, type CrewMember } from "@/domain/yachts";

export type { Yacht, CrewMember };
export { yachtTypes };

export interface PrivateJet {
  id: string;
  name: string;
  company: string;
  type: "Light Jet" | "Midsize Jet" | "Heavy Jet" | "VIP Airliner" | string;
  capacity: number;
  range: string;
  speed: string;
  pricePerHour: number;
  currency: string;
  minHours: number;
  image: string;
  description: string;
  amenities: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  base: string;
}

export const jetTypes = [
  { id: "all", name: "All Aircraft", icon: "ri-plane-line" },
  { id: "light-jet", name: "Light Jets", icon: "ri-flight-takeoff-line" },
  { id: "midsize-jet", name: "Midsize Jets", icon: "ri-flight-land-line" },
  { id: "heavy-jet", name: "Heavy Jets", icon: "ri-rocket-line" },
  { id: "vip-airliner", name: "VIP Airliners", icon: "ri-vip-crown-line" },
];

export interface HelicopterTour {
  id: string;
  name: string;
  company?: string;
  type?: "Scenic Coastal Tour" | "Mountain & Canyon Safari" | "Sunset Romantic Flight" | "VIP Private Charter" | string;
  duration: string;
  maxPassengers: number;
  pricePerPerson: number;
  privatePrice: number;
  currency: string;
  aircraft: string;
  departurePoint: string;
  image: string;
  description: string;
  highlights: string[];
  route: string | string[];
  includes: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
}

export const helicopterTypes = [
  { id: "all", name: "All Tours", icon: "ri-flight-takeoff-line" },
  { id: "scenic-coastal-tour", name: "Scenic Coastal", icon: "ri-landscape-line" },
  { id: "mountain-canyon-safari", name: "Mountain & Canyon", icon: "ri-treasure-map-line" },
  { id: "sunset-romantic-flight", name: "Sunset Romantic", icon: "ri-heart-line" },
  { id: "vip-private-charter", name: "VIP Private", icon: "ri-vip-crown-line" },
];

export const tourDurations = [
  { id: "all", name: "All Durations", icon: "ri-time-line" },
  { id: "15-min", name: "15 Mins", icon: "ri-timer-line" },
  { id: "30-min", name: "30 Mins", icon: "ri-timer-line" },
  { id: "45-min", name: "45 Mins", icon: "ri-timer-line" },
  { id: "60-min", name: "60 Mins", icon: "ri-timer-line" },
];

export interface PersonalChef {
  id: string;
  name: string;
  title?: string;
  cuisine?: string[];
  cuisines?: string[];
  experienceYears?: number;
  experience?: string;
  languages?: string[];
  language?: string[];
  location?: string;
  specialty?: string;
  specialties?: string[];
  menuStyle?: string;
  duration?: string;
  groupSize?: string;
  description?: string;
  pricePerPerson?: number;
  pricePerEvent?: number;
  priceIncludes?: string[];
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  bio?: string;
  sampleMenu?: Array<{ course: string; dish: string; description: string }>;
  servicesOffered?: string[];
  featured: boolean;
}

export const chefCuisines = [
  { id: "all", name: "All Cuisines", icon: "ri-restaurant-2-line" },
  { id: "mediterranean", name: "Mediterranean & Seafood", icon: "ri-drop-line" },
  { id: "ottoman", name: "Ottoman Royal Cuisine", icon: "ri-copper-diamond-line" },
  { id: "modern-fusion", name: "Modern Turkish Fusion", icon: "ri-sparkling-line" },
  { id: "plant-based", name: "Plant-Based & Vegan", icon: "ri-plant-line" },
  { id: "bbq-grill", name: "Private BBQ & Grill", icon: "ri-fire-line" },
];

export const chefStyles = chefCuisines;

export interface PersonalDriver {
  id: string;
  name: string;
  company?: string;
  vehicle: string;
  vehicleType: string;
  vehicleCapacity?: number;
  capacity?: number;
  languages: string[];
  base?: string;
  description?: string;
  experienceYears?: number;
  experience?: string;
  location?: string;
  dailyRate?: number;
  hourlyRate?: number;
  pricePerDay?: number;
  pricePerHour?: number;
  airportTransferRate?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  vehicleImage?: string;
  bio?: string;
  amenities?: string[];
  includes?: string[];
  popularRoutes?: Array<{ name: string; duration: string; price: number }>;
  featured: boolean;
}

export const driverVehicleTypes = [
  { id: "all", name: "All Vehicles", icon: "ri-car-line" },
  { id: "luxury-sedan", name: "Luxury Sedans (Mercedes S/E)", icon: "ri-car-fill" },
  { id: "vip-minivan", name: "VIP Minivans (Mercedes V-Class)", icon: "ri-bus-fill" },
  { id: "executive-suv", name: "Executive SUVs (Range Rover)", icon: "ri-roadster-line" },
  { id: "limousine", name: "Chauffeured Limousines", icon: "ri-vip-crown-fill" },
];

export const driverTypes = driverVehicleTypes;

export interface PersonalShopper {
  id: string;
  name: string;
  title?: string;
  specialty: string | string[];
  style?: string;
  languages: string[];
  experience?: string;
  experienceYears?: number;
  minHours?: number;
  description?: string;
  location?: string;
  areas?: string[];
  includes?: string[];
  pricePerPerson?: number;
  pricePerHour?: number;
  hourlyRate?: number;
  halfDayRate?: number;
  fullDayRate?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  bio?: string;
  exclusivePerks?: string[];
  curatedBoutiques?: Array<{ name: string; category: string; discount: string }>;
  featured: boolean;
}

export const shopperCategories = [
  { id: "all", name: "All Categories", icon: "ri-shopping-bag-3-line" },
  { id: "carpets-textiles", name: "Artisan Carpets & Textiles", icon: "ri-palette-line" },
  { id: "designer-fashion", name: "Designer Fashion & Boutiques", icon: "ri-t-shirt-line" },
  { id: "jewelry-gold", name: "Fine Jewelry & Gold", icon: "ri-vip-diamond-line" },
  { id: "leather-goods", name: "Luxury Leather Goods", icon: "ri-handbag-line" },
  { id: "spices-gourmet", name: "Turkish Gourmet & Spices", icon: "ri-cup-line" },
];

export const shopperStyles = shopperCategories;

export interface WineTasting {
  id: string;
  name: string;
  venue: string;
  sommelier?: string;
  type?: "Classic Tasting" | "Premium Tasting" | "Sunset Vineyard Tour" | "Private Sommelier Masterclass" | string;
  duration: string;
  groupSize: string;
  pricePerPerson: number;
  currency: string;
  image: string;
  description: string;
  winesIncluded: number | string;
  wineTypes: string[];
  foodPairing: string | string[];
  includes: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  language: string | string[];
}

export const wineTastingTypes = [
  { id: "all", name: "All Tastings", icon: "ri-cup-line" },
  { id: "classic-tasting", name: "Classic Tasting", icon: "ri-goblet-line" },
  { id: "premium-tasting", name: "Premium Reserve", icon: "ri-vip-crown-line" },
  { id: "sunset-vineyard-tour", name: "Sunset Vineyard Tour", icon: "ri-sun-line" },
  { id: "private-sommelier-masterclass", name: "Sommelier Masterclass", icon: "ri-award-line" },
];

export const tastingStyles = wineTastingTypes;

export interface HammamSpa {
  id: string;
  name: string;
  venue?: string;
  location?: string;
  type: "Traditional Turkish Bath" | "VIP Luxury Package" | "Couples Ritual" | "Aromatherapy & Massage" | string;
  duration: string;
  pricePerPerson: number;
  couplesPrice?: number;
  openingHours?: string;
  currency: string;
  image: string;
  description: string;
  treatments?: string[];
  facilities?: string[];
  includes?: string[];
  oils?: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  privateSuiteAvailable?: boolean;
}

export type HammamSpaExperience = HammamSpa;

export const hammamSpaTypes = [
  { id: "all", name: "All Experiences", icon: "ri-heart-pulse-line" },
  { id: "traditional-turkish-bath", name: "Traditional Hammam", icon: "ri-drop-line" },
  { id: "vip-luxury-package", name: "VIP Luxury Suite", icon: "ri-vip-crown-line" },
  { id: "couples-ritual", name: "Couples Ritual", icon: "ri-hearts-line" },
  { id: "aromatherapy-massage", name: "Aromatherapy Massage", icon: "ri-magic-line" },
];

export const spaTypes = hammamSpaTypes;

export interface GolfVacation {
  id: string;
  name: string;
  course?: string;
  location: string;
  type?: "Championship 18-Hole" | "All-Inclusive Golf & Stay" | "PGA Pro Coaching" | "Executive 9-Hole & Spa" | string;
  holes?: number;
  par?: number;
  designer?: string;
  greenFee?: number;
  packagePrice?: number;
  pricePerPerson?: number;
  duration?: string;
  club?: string;
  difficulty?: string;
  groupSize?: string;
  language?: string;
  courses?: string[];
  priceIncludes?: string[];
  currency?: string;
  image: string;
  description: string;
  courseFeatures?: string[];
  amenities?: string[];
  includes?: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  handicapRequired?: string;
}

export const golfTypes = [
  { id: "all", name: "All Packages", icon: "ri-golf-ball-line" },
  { id: "championship-18-hole", name: "Championship 18-Hole", icon: "ri-flag-line" },
  { id: "all-inclusive-golf-stay", name: "Golf & Stay All-Inclusive", icon: "ri-hotel-bed-line" },
  { id: "pga-pro-coaching", name: "PGA Pro Coaching", icon: "ri-user-star-line" },
  { id: "executive-9-hole-spa", name: "Executive 9-Hole & Spa", icon: "ri-heart-pulse-line" },
];

export const golfStyles = golfTypes;

export interface PhotographyExcursion {
  id: string;
  name: string;
  photographer?: string;
  type?: "Sunset & Landscape" | "Old Town & Culture" | "Drone & Aerial" | "Couples & Portrait" | "Private VIP Session" | string;
  focus?: string;
  bestTime?: string;
  privatePrice?: number;
  duration: string;
  groupSize: string;
  photosDelivered?: number;
  editedPhotos?: number;
  deliveryTimeDays?: number;
  pricePerPerson: number;
  currency: string;
  image: string;
  description: string;
  locations: string[];
  gearIncluded?: string[];
  includes: string[];
  skillLevel?: string;
  guide?: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
}

export const photographyTypes = [
  { id: "all", name: "All Excursions", icon: "ri-camera-lens-line" },
  { id: "sunset-landscape", name: "Sunset & Landscape", icon: "ri-sun-foggy-line" },
  { id: "old-town-culture", name: "Old Town & Culture", icon: "ri-ancient-gate-line" },
  { id: "drone-aerial", name: "Drone & Aerial", icon: "ri-flight-takeoff-line" },
  { id: "couples-portrait", name: "Couples & Portrait", icon: "ri-heart-line" },
  { id: "private-vip-session", name: "Private VIP Session", icon: "ri-vip-crown-line" },
];

export const excursionTypes = photographyTypes;

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
  custom_fields?: Record<string, unknown>;
}

export type CreateConciergeEnquiryPayload = ConciergeEnquiryPayload;

export interface ConciergeEnquiryResult {
  success: boolean;
  id?: number | string;
  message?: string;
}

export type CreateConciergeEnquiryResult = ConciergeEnquiryResult;




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

export class ConciergeService {
  /**
   * Retrieves concierge offerings filtered by type/category from live backend.
   */
  async getConciergeOfferings(
    type?: string,
    params?: Record<string, unknown>
  ): Promise<ConciergeServiceItem[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (type && type !== "all") {
      queryParams.type = type;
    }
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          queryParams[key] = val as string | number | boolean;
        }
      });
    }

    const response = await apiClient.get<
      { data?: ConciergeServiceItem[]; count?: number } | ConciergeServiceItem[]
    >("/services", { params: queryParams });

    if (Array.isArray(response)) {
      return response;
    }
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }

    return [];
  }

  /**
   * Retrieves a concierge service item by ID from live backend.
   */
  async getServiceById(id: string, _categoryHint?: string): Promise<ConciergeServiceItem | null> {
    try {
      const data = await apiClient.get<ConciergeServiceItem>(`/services/${id}`);
      if (data && data.id) {
        return data;
      }
      return null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Retrieves typed luxury category items (e.g. Yacht[], PrivateJet[], etc.)
   */
  async getOfferingsByCategory<T>(category: string): Promise<T[]> {
    const response = await apiClient.get<T[] | { data?: T[] }>("/services", {
      params: { type: category },
    });

    if (Array.isArray(response)) {
      return response;
    }
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }

    return [];
  }

  /**
   * Submits a concierge enquiry request.
   */
  async submitConciergeEnquiry(payload: ConciergeEnquiryPayload): Promise<ConciergeEnquiryResult> {
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
      success: res?.success !== false,
      id: res?.id,
      message: res?.message || "Enquiry submitted successfully",
    };
  }

  /**
   * Alias for submitConciergeEnquiry (canonical name).
   */
  async createEnquiry(payload: ConciergeEnquiryPayload): Promise<ConciergeEnquiryResult> {
    return this.submitConciergeEnquiry(payload);
  }


  // ============================================
  // Category-specific convenience getters
  // ============================================

  getYachtsSync(): Yacht[] {
    return [];
  }

  async getYachts(type?: string): Promise<Yacht[]> {
    const items = await this.getOfferingsByCategory<Yacht>("yacht");
    if (!type || type === "all") {
      return items;
    }
    return items.filter((y) => (y.type || "").toLowerCase() === type.toLowerCase());
  }

  async getPrivateJets(): Promise<PrivateJet[]> {
    return this.getOfferingsByCategory<PrivateJet>("private-jet");
  }

  async getHelicopterTours(): Promise<HelicopterTour[]> {
    return this.getOfferingsByCategory<HelicopterTour>("helicopter");
  }

  async getWineTastings(): Promise<WineTasting[]> {
    return this.getOfferingsByCategory<WineTasting>("wine-tasting");
  }

  async getHammamSpaExperiences(): Promise<HammamSpa[]> {
    return this.getOfferingsByCategory<HammamSpa>("hammam-spa");
  }

  async getPhotographyExcursions(): Promise<PhotographyExcursion[]> {
    return this.getOfferingsByCategory<PhotographyExcursion>("photography");
  }

  async getGolfVacations(): Promise<GolfVacation[]> {
    return this.getOfferingsByCategory<GolfVacation>("golf");
  }

  async getPersonalChefs(): Promise<PersonalChef[]> {
    return this.getOfferingsByCategory<PersonalChef>("personal-chef");
  }

  async getPersonalDrivers(): Promise<PersonalDriver[]> {
    return this.getOfferingsByCategory<PersonalDriver>("personal-driver");
  }

  async getPersonalShoppers(): Promise<PersonalShopper[]> {
    return this.getOfferingsByCategory<PersonalShopper>("personal-shopper");
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
