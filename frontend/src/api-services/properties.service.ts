import { apiClient } from "@/lib/api-client";
import { villas as mockVillas, type Villa } from "@/mocks/villas";

export type { Villa };

export interface PropertyItem {
  id: string;
  title: string;
  name?: string;
  description?: string;
  type?: string;
  location?: string;
  price_per_night?: number;
  pricePerNight?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  maxGuests?: number;
  has_pool?: boolean;
  hasPool?: boolean;
  has_sea_view?: boolean;
  hasSeaView?: boolean;
  images?: string[];
  image?: string;
  image_url?: string;
  amenities?: string[];
  rating?: number;
  review_count?: number;
  reviewCount?: number;
  featured?: boolean;
  min_stay?: number;
  minStay?: number;
  distance_to_beach?: string;
  distanceToBeach?: string;
  status?: string;
  host_id?: string;
  cleaning_fee?: number;
  cleaningFee?: number;
  beds?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface PropertyFilterParams {
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  guests?: number;
  hasPool?: boolean;
  hasSeaView?: boolean;
  amenities?: string[];
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  allowedIds?: string[];
  filters?: Record<string, unknown> | string;
}

export interface PropertyAvailabilityResult {
  property_id?: string;
  date?: string;
  status?: string;
  price?: number;
  has_conflict?: boolean;
  is_available?: boolean;
  message?: string;
  [key: string]: unknown;
}

export type PropertyTypesResponse = string[];

export interface CreatePropertyBookingPayload {
  propertyId?: string;
  itemId?: string;
  item_id?: string;
  userId?: string;
  user_id?: string;
  checkIn: string;
  checkOut: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  totalPrice?: number;
  total_price?: number;
  currency?: string;
  message?: string;
  paymentMethod?: string;
  payment_method?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface CreatePropertyBookingResult {
  success: boolean;
  bookingId?: string;
  id?: string;
  message?: string;
}

/**
 * Converts a raw backend property record or Supabase row into a normalized PropertyItem.
 */
export function mapBackendPropertyToPropertyItem(raw: Record<string, unknown>): PropertyItem {
  const id = String(raw.id ?? "");
  const title = String(raw.title || raw.name || "Property");
  const name = String(raw.name || raw.title || title);
  const description = typeof raw.description === "string" ? raw.description : "";
  const type = typeof raw.type === "string" ? raw.type : "villa";
  const location = typeof raw.location === "string" ? raw.location : "Alanya";

  const pricePerNight =
    typeof raw.pricePerNight === "number"
      ? raw.pricePerNight
      : typeof raw.price_per_night === "number"
        ? raw.price_per_night
        : typeof raw.price_per_night === "string"
          ? parseFloat(raw.price_per_night) || 0
          : typeof raw.price === "number"
            ? raw.price
            : 0;

  const currency = typeof raw.currency === "string" && raw.currency.trim() ? raw.currency.trim().toUpperCase() : "EUR";
  const bedrooms = typeof raw.bedrooms === "number" ? raw.bedrooms : Number(raw.bedrooms) || 0;
  const bathrooms = typeof raw.bathrooms === "number" ? raw.bathrooms : Number(raw.bathrooms) || 0;
  const maxGuests =
    typeof raw.maxGuests === "number"
      ? raw.maxGuests
      : typeof raw.max_guests === "number"
        ? raw.max_guests
        : Number(raw.max_guests) || 1;

  const hasPool =
    typeof raw.hasPool === "boolean"
      ? raw.hasPool
      : typeof raw.has_pool === "boolean"
        ? raw.has_pool
        : false;

  const hasSeaView =
    typeof raw.hasSeaView === "boolean"
      ? raw.hasSeaView
      : typeof raw.has_sea_view === "boolean"
        ? raw.has_sea_view
        : false;

  const images = Array.isArray(raw.images)
    ? raw.images.filter((img): img is string => typeof img === "string")
    : typeof raw.image === "string"
      ? [raw.image]
      : typeof raw.image_url === "string"
        ? [raw.image_url]
        : [];

  const image = images[0] || (typeof raw.image === "string" ? raw.image : typeof raw.image_url === "string" ? raw.image_url : "");

  const amenities = Array.isArray(raw.amenities)
    ? raw.amenities.filter((a): a is string => typeof a === "string")
    : [];

  const rating = typeof raw.rating === "number" ? raw.rating : Number(raw.rating) || 5.0;
  const reviewCount =
    typeof raw.reviewCount === "number"
      ? raw.reviewCount
      : typeof raw.review_count === "number"
        ? raw.review_count
        : Number(raw.review_count) || 0;

  const featured = Boolean(raw.featured ?? raw.is_featured ?? false);
  const minStay =
    typeof raw.minStay === "number"
      ? raw.minStay
      : typeof raw.min_stay === "number"
        ? raw.min_stay
        : typeof raw.min_stay_nights === "number"
          ? raw.min_stay_nights
          : Number(raw.min_stay_nights) || 1;

  const distanceToBeach =
    typeof raw.distanceToBeach === "string"
      ? raw.distanceToBeach
      : typeof raw.distance_to_beach === "string"
        ? raw.distance_to_beach
        : "";

  const status = typeof raw.status === "string" ? raw.status : "approved";
  const hostId = typeof raw.host_id === "string" ? raw.host_id : typeof raw.hostId === "string" ? raw.hostId : undefined;

  return {
    ...raw,
    id,
    title,
    name,
    description,
    type,
    location,
    price_per_night: pricePerNight,
    pricePerNight,
    currency,
    bedrooms,
    bathrooms,
    max_guests: maxGuests,
    maxGuests,
    has_pool: hasPool,
    hasPool,
    has_sea_view: hasSeaView,
    hasSeaView,
    images,
    image,
    image_url: image,
    amenities,
    rating,
    review_count: reviewCount,
    reviewCount,
    featured,
    min_stay: minStay,
    minStay,
    distance_to_beach: distanceToBeach,
    distanceToBeach,
    status,
    host_id: hostId,
  };
}

/**
 * Maps a mock Villa entity to a normalized PropertyItem.
 */
export function mapVillaToPropertyItem(v: Villa): PropertyItem {
  return {
    id: v.id,
    title: v.name,
    name: v.name,
    description: v.description,
    type: "villa",
    location: v.location,
    price_per_night: v.pricePerNight,
    pricePerNight: v.pricePerNight,
    currency: v.currency,
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    max_guests: v.maxGuests,
    maxGuests: v.maxGuests,
    has_pool: v.hasPool,
    hasPool: v.hasPool,
    has_sea_view: v.hasSeaView,
    hasSeaView: v.hasSeaView,
    images: [v.image],
    image: v.image,
    image_url: v.image,
    amenities: v.amenities,
    rating: v.rating,
    review_count: v.reviewCount,
    reviewCount: v.reviewCount,
    featured: v.featured,
    min_stay: v.minStay,
    minStay: v.minStay,
    distance_to_beach: v.distanceToBeach,
    distanceToBeach: v.distanceToBeach,
    status: "approved",
  };
}

export class PropertiesService {
  /**
   * Retrieves paginated and filtered properties.
   * Calls `GET /properties` with parameters and falls back gracefully to mock villas.
   */
  async getProperties(
    params?: PropertyFilterParams
  ): Promise<{ data: PropertyItem[]; total: number }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params) {
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.location !== undefined) queryParams.location = params.location;
      if (params.sort !== undefined) queryParams.sort = params.sort;

      if (typeof params.filters === "string") {
        queryParams.filters = params.filters;
      } else if (params.filters && typeof params.filters === "object") {
        queryParams.filters = JSON.stringify(params.filters);
      } else {
        const filterObj: Record<string, unknown> = {};
        if (params.minPrice !== undefined || params.maxPrice !== undefined) {
          filterObj.priceRange = [params.minPrice ?? 0, params.maxPrice ?? 1000000];
        }
        if (params.guests !== undefined) {
          filterObj.minGuests = params.guests;
        }
        if (params.bedrooms !== undefined) {
          filterObj.minBedrooms = params.bedrooms;
        }
        if (params.bathrooms !== undefined) {
          filterObj.minBathrooms = params.bathrooms;
        }
        if (params.type !== undefined) {
          filterObj.types = [params.type];
        }
        if (Object.keys(filterObj).length > 0) {
          queryParams.filters = JSON.stringify(filterObj);
        }
      }
    }

    try {
      const response = await apiClient.get<
        { data?: Record<string, unknown>[]; count?: number | null } | Record<string, unknown>[]
      >("/properties", { params: queryParams });

      if (Array.isArray(response) && response.length > 0) {
        return {
          data: response.map(mapBackendPropertyToPropertyItem),
          total: response.length,
        };
      }

      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        return {
          data: response.data.map(mapBackendPropertyToPropertyItem),
          total: response.count ?? response.data.length,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch properties from API, using mock fallback:", err);
    }

    // Mock fallback handling with filter simulation
    let fallback = mockVillas.map(mapVillaToPropertyItem);

    if (params?.location && params.location !== "all") {
      const locLower = params.location.toLowerCase();
      fallback = fallback.filter((v) =>
        (v.location || "").toLowerCase().includes(locLower)
      );
    }

    if (params?.type) {
      const typeLower = params.type.toLowerCase();
      fallback = fallback.filter((v) =>
        (v.type || "villa").toLowerCase().includes(typeLower)
      );
    }

    if (params?.minPrice !== undefined) {
      fallback = fallback.filter(
        (v) => (v.pricePerNight ?? 0) >= (params.minPrice ?? 0)
      );
    }

    if (params?.maxPrice !== undefined) {
      fallback = fallback.filter(
        (v) => (v.pricePerNight ?? 0) <= (params.maxPrice ?? Infinity)
      );
    }

    if (params?.bedrooms !== undefined) {
      fallback = fallback.filter(
        (v) => (v.bedrooms ?? 0) >= (params.bedrooms ?? 0)
      );
    }

    if (params?.bathrooms !== undefined) {
      fallback = fallback.filter(
        (v) => (v.bathrooms ?? 0) >= (params.bathrooms ?? 0)
      );
    }

    if (params?.guests !== undefined) {
      fallback = fallback.filter(
        (v) => (v.maxGuests ?? 0) >= (params.guests ?? 0)
      );
    }

    if (params?.hasPool !== undefined) {
      fallback = fallback.filter((v) => v.hasPool === params.hasPool);
    }

    if (params?.hasSeaView !== undefined) {
      fallback = fallback.filter((v) => v.hasSeaView === params.hasSeaView);
    }

    if (params?.featured !== undefined) {
      fallback = fallback.filter((v) => v.featured === params.featured);
    }

    const total = fallback.length;

    if (params?.page && params?.limit) {
      const startIndex = (params.page - 1) * params.limit;
      fallback = fallback.slice(startIndex, startIndex + params.limit);
    } else if (params?.limit) {
      fallback = fallback.slice(0, params.limit);
    }

    return {
      data: fallback,
      total,
    };
  }

  /**
   * Retrieves a single property by its ID.
   * Calls `GET /properties/:id`, falling back to mock villas.
   */
  async getProperty(id: string): Promise<PropertyItem | null> {
    try {
      const data = await apiClient.get<Record<string, unknown>>(`/properties/${id}`);
      if (data && data.id) {
        return mapBackendPropertyToPropertyItem(data);
      }
    } catch (err) {
      console.warn(`Failed to fetch property '${id}' from API, searching fallback:`, err);
    }

    const fallbackVilla = mockVillas.find(
      (v) =>
        v.id === id ||
        v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id.toLowerCase() ||
        v.id.replace(/-/g, "") === id.replace(/-/g, "")
    );

    return fallbackVilla ? mapVillaToPropertyItem(fallbackVilla) : null;
  }

  /**
   * Retrieves available properties for a date range.
   * Calls `POST /properties/available`, falling back to mock villas.
   */
  async getAvailableProperties(
    checkIn: string,
    checkOut: string
  ): Promise<PropertyItem[]> {
    try {
      const response = await apiClient.post<
        Record<string, unknown>[] | { data: Record<string, unknown>[] }
      >("/properties/available", { checkIn, checkOut });

      if (Array.isArray(response) && response.length > 0) {
        return response.map(mapBackendPropertyToPropertyItem);
      }

      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data.map(mapBackendPropertyToPropertyItem);
      }
    } catch (err) {
      console.warn("Failed to fetch available properties from API, using fallback:", err);
    }

    return mockVillas.map(mapVillaToPropertyItem);
  }

  /**
   * Checks whether a property is available for given dates.
   * Calls `GET /properties/:id/availability`, falling back to `/bookings/conflict` or default available.
   */
  async checkAvailability(
    id: string,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    try {
      const response = await apiClient.get<
        | Array<{ status?: string; is_available?: boolean; has_conflict?: boolean }>
        | { has_conflict?: boolean }
      >(`/properties/${id}/availability`, {
        params: { startDate: checkIn, endDate: checkOut },
      });

      if (Array.isArray(response)) {
        const hasConflict = response.some(
          (rec) =>
            rec.status === "booked" ||
            rec.status === "blocked" ||
            rec.status === "unavailable" ||
            rec.is_available === false ||
            rec.has_conflict === true
        );
        return !hasConflict;
      }

      if (
        response &&
        typeof response === "object" &&
        typeof response.has_conflict === "boolean"
      ) {
        return !response.has_conflict;
      }

      return true;
    } catch {
      try {
        const conflictRes = await apiClient.get<{ has_conflict?: boolean }>(
          "/bookings/conflict",
          {
            params: {
              itemId: id,
              itemType: "property",
              checkIn,
              checkOut,
            },
          }
        );
        if (conflictRes && typeof conflictRes.has_conflict === "boolean") {
          return !conflictRes.has_conflict;
        }
      } catch (err) {
        console.warn(
          `Failed to check availability for property '${id}', assuming available fallback:`,
          err
        );
      }

      return true;
    }
  }

  /**
   * Retrieves active property types.
   * Calls `GET /properties/types`, falling back to standard accommodation types.
   */
  async getPropertyTypes(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>("/properties/types");
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
    } catch (err) {
      console.warn("Failed to fetch property types from API, using fallback:", err);
    }

    return ["villa", "apartment", "penthouse", "estate", "studio", "house"];
  }

  /**
   * Creates a direct booking for a property.
   * Calls `POST /bookings`, falling back to simulated confirmation.
   */
  async createBooking(
    payload: CreatePropertyBookingPayload
  ): Promise<{ success: boolean; bookingId?: string }> {
    const propertyId = payload.propertyId || payload.itemId || payload.item_id || "";
    const checkIn = payload.checkIn || payload.check_in || "";
    const checkOut = payload.checkOut || payload.check_out || "";
    const totalPrice = payload.totalPrice || payload.total_price || 0;
    const guests = payload.guests || 1;
    const userId = payload.userId || payload.user_id || "guest";
    const paymentMethod = payload.paymentMethod || payload.payment_method || "credit_card";

    const requestBody = {
      item_id: propertyId,
      user_id: userId,
      check_in: checkIn,
      check_out: checkOut,
      total_price: totalPrice,
      guests,
      item_type: "property",
      message: payload.message,
      payment_method: paymentMethod,
      name: payload.customerName,
      email: payload.customerEmail,
      phone: payload.customerPhone,
    };

    try {
      const res = await apiClient.post<{
        id?: string;
        bookingId?: string;
        data?: string;
        success?: boolean;
      }>("/bookings", requestBody);

      const bookingId = res.bookingId || res.id || res.data || `bk-${Date.now()}`;
      return {
        success: res.success !== false,
        bookingId,
      };
    } catch (err) {
      console.warn(
        "Failed to create property booking via API, generating fallback confirmation:",
        err
      );
      const fallbackId = `bk-${Date.now()}`;
      return {
        success: true,
        bookingId: fallbackId,
      };
    }
  }
}

export const propertiesService = new PropertiesService();

export const getProperties = (params?: PropertyFilterParams) =>
  propertiesService.getProperties(params);
export const getProperty = (id: string) => propertiesService.getProperty(id);
export const getAvailableProperties = (checkIn: string, checkOut: string) =>
  propertiesService.getAvailableProperties(checkIn, checkOut);
export const checkAvailability = (id: string, checkIn: string, checkOut: string) =>
  propertiesService.checkAvailability(id, checkIn, checkOut);
export const getPropertyTypes = () => propertiesService.getPropertyTypes();
export const createBooking = (payload: CreatePropertyBookingPayload) =>
  propertiesService.createBooking(payload);
