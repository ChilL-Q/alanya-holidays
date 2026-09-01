import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";
import { villas as domainVillas, type Villa } from "@/domain/villas";

export type { Villa };

export const villaLocations = [
  { id: "all", name: "All Locations", icon: "ri-map-pin-line" },
  { id: "alanya-center", name: "Alanya Center", icon: "ri-building-line" },
  { id: "mahmutlar", name: "Mahmutlar", icon: "ri-home-4-line" },
  { id: "kargicak", name: "Kargıcak", icon: "ri-landscape-line" },
  { id: "konakli", name: "Konaklı", icon: "ri-hotel-line" },
  { id: "tosmur", name: "Tosmur", icon: "ri-community-line" },
];

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

export interface PropertyFilterParams extends RequestOptions {
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

export function mapBackendPropertyToPropertyItem(
  item: Record<string, unknown>
): PropertyItem {
  const images = Array.isArray(item.images)
    ? (item.images as string[])
    : typeof item.image === "string"
      ? [item.image]
      : typeof item.image_url === "string"
        ? [item.image_url]
        : [];

  const mainImage =
    typeof item.image === "string" && item.image
      ? item.image
      : typeof item.image_url === "string" && item.image_url
        ? item.image_url
        : images[0] ||
          "/images/placeholder-business.svg";

  return {
    id: String(item.id || item.slug || ""),
    title: String(item.title || item.name || "Alanya Property"),
    name: String(item.name || item.title || "Alanya Property"),
    description: String(item.description || ""),
    type: String(item.type || "villa"),
    location: String(item.location || "Alanya"),
    pricePerNight: Number(item.price_per_night ?? item.pricePerNight ?? 0),
    price_per_night: Number(item.price_per_night ?? item.pricePerNight ?? 0),
    currency: String(item.currency || "EUR"),
    bedrooms: Number(item.bedrooms ?? 0),
    bathrooms: Number(item.bathrooms ?? 0),
    maxGuests: Number(item.max_guests ?? item.maxGuests ?? 0),
    max_guests: Number(item.max_guests ?? item.maxGuests ?? 0),
    hasPool: Boolean(item.has_pool ?? item.hasPool),
    has_pool: Boolean(item.has_pool ?? item.hasPool),
    hasSeaView: Boolean(item.has_sea_view ?? item.hasSeaView),
    has_sea_view: Boolean(item.has_sea_view ?? item.hasSeaView),
    images,
    image: mainImage,
    image_url: mainImage,
    amenities: Array.isArray(item.amenities)
      ? (item.amenities as string[])
      : [],
    rating: Number(item.rating ?? 0),
    reviewCount: Number(item.review_count ?? item.reviewCount ?? 0),
    review_count: Number(item.review_count ?? item.reviewCount ?? 0),
    featured: Boolean(item.featured),
    minStay: Number(item.min_stay ?? item.min_stay_nights ?? item.minStay ?? 0),
    min_stay: Number(item.min_stay ?? item.min_stay_nights ?? item.minStay ?? 0),
    distanceToBeach: String(item.distance_to_beach ?? item.distanceToBeach ?? ""),
    distance_to_beach: String(item.distance_to_beach ?? item.distanceToBeach ?? ""),
    status: typeof item.status === "string" ? item.status : undefined,
    host_id: item.host_id ? String(item.host_id) : undefined,
    cleaningFee: item.cleaning_fee ? Number(item.cleaning_fee) : undefined,
    beds: item.beds ? Number(item.beds) : undefined,
  };
}

export function mapVillaToPropertyItem(v: Villa): PropertyItem {
  return {
    id: v.id,
    title: v.name,
    name: v.name,
    description: v.description,
    type: v.type || "villa",
    location: v.location,
    pricePerNight: v.pricePerNight,
    price_per_night: v.pricePerNight,
    currency: v.currency,
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    maxGuests: v.maxGuests,
    max_guests: v.maxGuests,
    hasPool: v.hasPool,
    has_pool: v.hasPool,
    hasSeaView: v.hasSeaView,
    has_sea_view: v.hasSeaView,
    images: v.images || (v.image ? [v.image] : []),
    image: v.image,
    image_url: v.image,
    amenities: v.amenities,
    rating: v.rating,
    reviewCount: v.reviewCount,
    review_count: v.reviewCount,
    featured: v.featured,
    minStay: v.minStay,
    min_stay: v.minStay,
    distanceToBeach: v.distanceToBeach,
    distance_to_beach: v.distanceToBeach,
  };
}

export class PropertiesService {
  /**
   * Synchronous lookup for curated domain villas.
   */
  getVillasSync(): Villa[] {
    return domainVillas;
  }
  /**
   * Retrieves all properties or filtered properties from live backend.
   */
  async getProperties(
    params?: PropertyFilterParams
  ): Promise<{ data: PropertyItem[]; total: number }> {
    const {
      location,
      type,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      guests,
      hasPool,
      hasSeaView,
      featured,
      page,
      limit,
      sort,
      filters,
      allowedIds,
      params: extraParams,
      signal,
      headers,
      ...restOptions
    } = params || {};

    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params) {
      if (location && location !== "all") queryParams.location = location;
      if (minPrice !== undefined) queryParams.minPrice = minPrice;
      if (maxPrice !== undefined) queryParams.maxPrice = maxPrice;
      if (bedrooms !== undefined) queryParams.bedrooms = bedrooms;
      if (bathrooms !== undefined) queryParams.bathrooms = bathrooms;
      if (guests !== undefined) queryParams.guests = guests;
      if (hasPool !== undefined) queryParams.hasPool = hasPool;
      if (hasSeaView !== undefined) queryParams.hasSeaView = hasSeaView;
      if (featured !== undefined) queryParams.featured = featured;
      if (page !== undefined) queryParams.page = page;
      if (limit !== undefined) queryParams.limit = limit;
      if (sort !== undefined) queryParams.sort = sort;
      if (allowedIds !== undefined) {
        queryParams.allowedIds = Array.isArray(allowedIds)
          ? allowedIds.join(",")
          : String(allowedIds);
      }
      if (filters) {
        queryParams.filters =
          typeof filters === "string"
            ? filters
            : JSON.stringify(filters);
      } else if (type && type !== "all") {
        queryParams.filters = JSON.stringify({ types: [type] });
      }
    }

    const reqConfig: RequestOptions = {
      ...(signal ? { signal } : {}),
      ...(headers ? { headers } : {}),
      ...restOptions,
      params: { ...extraParams, ...queryParams },
    };

    const response = await apiClient.get<
      | { data: Record<string, unknown>[]; count?: number; total?: number }
      | Record<string, unknown>[]
    >("/properties", reqConfig);

    if (Array.isArray(response)) {
      const mapped = response.map(mapBackendPropertyToPropertyItem);
      return {
        data: mapped,
        total: mapped.length,
      };
    }

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      const mapped = response.data.map(mapBackendPropertyToPropertyItem);
      return {
        data: mapped,
        total: response.total ?? response.count ?? mapped.length,
      };
    }

    return {
      data: [],
      total: 0,
    };
  }

  /**
   * Retrieves a single property by its ID.
   */
  async getProperty(id: string, options?: RequestOptions): Promise<PropertyItem | null> {
    try {
      const data = options
        ? await apiClient.get<Record<string, unknown>>(`/properties/${id}`, options)
        : await apiClient.get<Record<string, unknown>>(`/properties/${id}`);
      if (data && data.id) {
        return mapBackendPropertyToPropertyItem(data);
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
   * Retrieves available properties for a date range.
   */
  async getAvailableProperties(
    checkIn: string,
    checkOut: string,
    options?: RequestOptions
  ): Promise<PropertyItem[]> {
    const response = options
      ? await apiClient.post<
          Record<string, unknown>[] | { data: Record<string, unknown>[] }
        >("/properties/available", { checkIn, checkOut }, options)
      : await apiClient.post<
          Record<string, unknown>[] | { data: Record<string, unknown>[] }
        >("/properties/available", { checkIn, checkOut });

    if (Array.isArray(response)) {
      return response.map(mapBackendPropertyToPropertyItem);
    }

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      return response.data.map(mapBackendPropertyToPropertyItem);
    }

    return [];
  }

  /**
   * Checks whether a property is available for given dates.
   */
  async checkAvailability(
    id: string,
    checkIn: string,
    checkOut: string,
    options?: RequestOptions
  ): Promise<boolean> {
    const response = await apiClient.get<
      | Array<{ status?: string; is_available?: boolean; has_conflict?: boolean }>
      | { has_conflict?: boolean }
    >(`/properties/${id}/availability`, {
      ...options,
      params: { ...options?.params, startDate: checkIn, endDate: checkOut },
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
  }

  /**
   * Retrieves active property types.
   */
  async getPropertyTypes(options?: RequestOptions): Promise<string[]> {
    try {
      const response = options
        ? await apiClient.get<string[]>("/properties/types", options)
        : await apiClient.get<string[]>("/properties/types");
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
      return ["villa", "apartment", "penthouse", "estate", "studio", "house"];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return ["villa", "apartment", "penthouse", "estate", "studio", "house"];
      }
      throw err;
    }
  }

}

export const propertiesService = new PropertiesService();

export const getProperties = (params?: PropertyFilterParams) =>
  propertiesService.getProperties(params);
export const getProperty = (id: string, options?: RequestOptions) =>
  propertiesService.getProperty(id, options);
export const getAvailableProperties = (checkIn: string, checkOut: string, options?: RequestOptions) =>
  propertiesService.getAvailableProperties(checkIn, checkOut, options);
export const checkAvailability = (id: string, checkIn: string, checkOut: string, options?: RequestOptions) =>
  propertiesService.checkAvailability(id, checkIn, checkOut, options);
export const getPropertyTypes = (options?: RequestOptions) =>
  propertiesService.getPropertyTypes(options);
