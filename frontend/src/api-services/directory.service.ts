import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";
import { businesses as domainBusinesses, type Business } from "@/domain/directory-businesses";
import type { DirectoryListingRecord } from "@alanya-holidays/shared";

export type { Business };
export type { DirectoryListingRecord };

export interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
}

export type TaxonomyCategory = BusinessCategory;

export interface BusinessReview {
  id: string;
  businessId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  visitType: string;
}

export const businessCategories: BusinessCategory[] = [
  { id: "all", name: "All Businesses", icon: "ri-store-2-line" },
  { id: "restaurants-cafes", name: "Restaurants & Cafés", icon: "ri-restaurant-2-line" },
  { id: "hotels-accommodation", name: "Hotels & Accommodation", icon: "ri-hotel-line" },
  { id: "tours-activities", name: "Tours & Activities", icon: "ri-ship-line" },
  { id: "real-estate", name: "Real Estate", icon: "ri-home-4-line" },
  { id: "car-rental", name: "Car & Scooter Rental", icon: "ri-car-line" },
  { id: "health-wellness", name: "Health & Wellness", icon: "ri-heart-pulse-line" },
  { id: "shopping", name: "Shopping", icon: "ri-shopping-bag-3-line" },
  { id: "services", name: "Professional Services", icon: "ri-briefcase-line" },
  { id: "nightlife", name: "Nightlife & Bars", icon: "ri-goblet-line" },
];

export interface BackendReview {
  id: string;
  listing_id: string;
  user_id?: string;
  rating: number;
  comment: string;
  created_at?: string;
  status?: string;
  title?: string;
  visit_type?: string;
  visitType?: string;
  user?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
  [key: string]: unknown;
}

export interface GetListingsOptions extends RequestOptions {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: "rating" | "reviews" | "name" | "base_score" | string;
}

export interface SearchListingsOptions extends RequestOptions {
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface GetListingsResult {
  data: Business[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmitClaimPayload {
  listing_id: string;
  business_name?: string;
  claimant_name?: string;
  full_name?: string;
  email: string;
  phone?: string;
  contact_phone?: string;
  role?: string;
  role_title?: string;
  verification_method?: string;
  website?: string;
  whatsapp?: string;
  address?: string;
  notes?: string;
  additional_notes?: string;
  id_document_url?: string;
  utility_bill_url?: string;
  business_license_url?: string;
  document_urls?: string[];
  [key: string]: unknown;
}

export interface DirectoryClaim {
  id: string;
  listing_id: string;
  user_id?: string;
  business_name: string;
  contact_phone?: string;
  phone?: string;
  email: string;
  role?: string;
  status: "pending" | "approved" | "rejected" | "verified" | string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  directory_listing?: {
    id: string;
    name: string;
    slug?: string;
    category_id?: string;
    gallery?: string[];
    tier?: string;
    status?: string;
    location?: string;
  };
  [key: string]: unknown;
}

export interface OwnerAnalyticsSummary {
  total_views: number;
  total_whatsapp_clicks: number;
  total_website_clicks: number;
  total_map_clicks: number;
  daily_data: Array<{
    date: string;
    views: number;
    whatsapp_clicks: number;
    website_clicks: number;
    map_clicks: number;
  }>;
}

export type ListingTier = "explorer" | "voyager" | "signature" | "partner";

export interface CreateListingInput {
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  tier: ListingTier;
  price_level?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    tripadvisor?: string;
    whatsapp?: string;
  };
  video_url?: string;
  booking_url?: string;
  images?: string[];
  [key: string]: unknown;
}

export function mapBackendListingToBusiness(
  item: DirectoryListingRecord
): Business {
  const priceLevel = item.price_level;
  const priceRange =
    typeof priceLevel === "number"
      ? "$".repeat(Math.min(Math.max(priceLevel, 1), 4))
      : typeof priceLevel === "string" && priceLevel
        ? priceLevel
        : "$$";

  return {
    id: item.id || item.slug || "biz-unknown",
    name: item.name || "Unnamed Business",
    category: item.category_id || item.category || "all",
    subcategory: item.subcategory || "",
    description: item.description || item.short_description || "",
    address: item.address || "",
    phone: item.phone || "",
    email: item.email || "",
    website: item.website || "",
    rating: item.reviews_average ?? 0,
    reviewCount: item.reviews_count ?? 0,
    image:
      item.gallery?.[0] ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "Business")}&size=800&background=2C6E49&color=fff`,
    tags: [],
    featured: Boolean(item.is_featured),
    priceRange,
    openingHours: "09:00 - 18:00",
    lat: 36.5437,
    lng: 31.9998,
    status: item.status,
    is_claimed: Boolean(item.claimed_at),
    is_verified: item.is_verified,
    claimed_at: item.claimed_at ?? undefined,
    tier: item.tier,
    trustBadge: item.tier === "signature" ? "Signature Collection" : undefined,
  };
}

export function mapBackendReviewToBusinessReview(
  item: BackendReview,
  listingId: string
): BusinessReview {
  return {
    id: item.id,
    businessId: item.listing_id || listingId,
    reviewerName: item.user?.full_name || "Verified Traveler",
    reviewerAvatar:
      item.user?.avatar_url ||
      "/images/placeholder-business.svg",
    rating: item.rating || 5,
    date: item.created_at
      ? item.created_at.split("T")[0]
      : new Date().toISOString().split("T")[0],
    title: item.title || (item.rating >= 4 ? "Great Experience" : "Review"),
    content: item.comment || "",
    visitType: item.visitType || item.visit_type || "Traveler",
  };
}

export class DirectoryService {
  /**
   * Retrieves business listings with optional pagination, category filtering, and sorting.
   * Directly dispatches to API and cleanly propagates errors or results.
   */
  async getListings(options: GetListingsOptions = {}): Promise<GetListingsResult> {
    const { page = 1, limit = 20, category, sortBy, params: extraParams, ...reqConfig } = options;

    const response = await apiClient.get<
      | { data: DirectoryListingRecord[]; pagination?: { total?: number; totalPages?: number } }
      | DirectoryListingRecord[]
    >("/directory", {
      ...reqConfig,
      params: {
        ...extraParams,
        page,
        limit,
        category: category && category !== "all" ? category : undefined,
        sortBy,
      },
    });

    if (response && "data" in response && Array.isArray(response.data)) {
      const mapped = response.data.map(mapBackendListingToBusiness);
      const total = response.pagination?.total ?? mapped.length;
      const totalPages = response.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));
      return {
        data: mapped,
        total,
        page,
        limit,
        totalPages,
      };
    }

    if (Array.isArray(response)) {
      const mapped = response.map(mapBackendListingToBusiness);
      return {
        data: mapped,
        total: mapped.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(mapped.length / limit)),
      };
    }

    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }

  /**
   * Searches business listings by query string and optional filters.
   */
  async searchListings(
    query: string,
    options: SearchListingsOptions = {}
  ): Promise<GetListingsResult> {
    const { category, location, page = 1, limit = 40, params: extraParams, ...reqConfig } = options;

    const response = await apiClient.get<
      | { data: DirectoryListingRecord[]; total?: number; count?: number }
      | DirectoryListingRecord[]
    >("/directory/search", {
      ...reqConfig,
      params: {
        ...extraParams,
        query,
        category: category && category !== "all" ? category : undefined,
        location,
        page,
        limit,
      },
    });

    if (response && "data" in response && Array.isArray(response.data)) {
      const mapped = response.data.map(mapBackendListingToBusiness);
      const total = response.total ?? response.count ?? mapped.length;
      return {
        data: mapped,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    if (Array.isArray(response)) {
      const mapped = response.map(mapBackendListingToBusiness);
      return {
        data: mapped,
        total: mapped.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(mapped.length / limit)),
      };
    }

    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }

  /**
   * Synchronous lookup for curated domain listings.
   */
  getListingByIdSync(id: string): Business | null {
    const found = domainBusinesses.find((b) => b.id === id);
    return found ? (found as Business) : null;
  }

  /**
   * Retrieves a single business listing by its ID.
   */
  async getListingById(id: string, options?: RequestOptions): Promise<Business | null> {
    try {
      const data = options
        ? await apiClient.get<DirectoryListingRecord>(`/directory/${id}`, options)
        : await apiClient.get<DirectoryListingRecord>(`/directory/${id}`);
      if (data && data.id) {
        return mapBackendListingToBusiness(data);
      }
      return this.getListingByIdSync(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return this.getListingByIdSync(id);
      }
      const fallback = this.getListingByIdSync(id);
      if (fallback) return fallback;
      throw err;
    }
  }

  /**
   * Retrieves a single business listing by its slug.
   */
  async getListingBySlug(slug: string, options?: RequestOptions): Promise<Business | null> {
    try {
      const data = options
        ? await apiClient.get<DirectoryListingRecord>(`/directory/slug/${slug}`, options)
        : await apiClient.get<DirectoryListingRecord>(`/directory/slug/${slug}`);
      if (data && (data.id || data.slug)) {
        return mapBackendListingToBusiness(data);
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
   * Retrieves reviews for a specific business listing.
   */
  async getListingReviews(
    listingId: string,
    page = 1,
    limit = 20,
    options?: RequestOptions
  ): Promise<BusinessReview[]> {
    try {
      const response = await apiClient.get<
        { data: BackendReview[]; count?: number } | BackendReview[]
      >(`/reviews/listing/${listingId}`, {
        ...options,
        params: { ...options?.params, page, limit },
      });

      if (response && "data" in response && Array.isArray(response.data)) {
        return response.data.map((r) => mapBackendReviewToBusinessReview(r, listingId));
      }

      if (Array.isArray(response)) {
        return response.map((r) => mapBackendReviewToBusinessReview(r, listingId));
      }

      return [];
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Submits a review for a business listing.
   */
  async submitReview(
    listingId: string,
    rating: number,
    comment: string
  ): Promise<BusinessReview> {
    const response = await apiClient.post<BackendReview>(`/reviews/listing/${listingId}`, {
      rating,
      comment,
    });

    if (response && response.id) {
      return mapBackendReviewToBusinessReview(response, listingId);
    }

    throw new ApiError("Failed to submit review", 500, "Internal Server Error");
  }

  /**
   * Submits an upvote (+1) or downvote (-1) for a listing.
   */
  async voteForListing(
    listingId: string,
    vote: 1 | -1
  ): Promise<{ success: boolean; netVotes?: number; [key: string]: unknown }> {
    return apiClient.post<{ success: boolean; netVotes?: number; [key: string]: unknown }>(
      `/directory/${listingId}/vote`,
      { vote }
    );
  }

  /**
   * Submits an ownership claim for a business listing.
   */
  async submitClaim(
    claim: SubmitClaimPayload
  ): Promise<{ id?: string; status?: string; [key: string]: unknown }> {
    return apiClient.post<{ id?: string; status?: string; [key: string]: unknown }>(
      "/directory/claims",
      claim
    );
  }

  /**
   * Единственный билдер payload листинга для create/draft/publish/update.
   */
  private buildListingFields(
    input: Partial<CreateListingInput>,
    status?: string,
    options: { defaultEmptyGallery?: boolean } = {}
  ) {
    const { defaultEmptyGallery = true } = options;
    return {
      name: input.name,
      category_id: input.category,
      subcategory: input.subcategory,
      short_description: input.description,
      description: input.description,
      location: input.address,
      address: input.address,
      phone: input.phone,
      email: input.email,
      website: input.website,
      tier: input.tier,
      price_level: input.price_level,
      gallery: input.images ?? (defaultEmptyGallery ? [] : undefined),
      video_url: input.video_url,
      booking_url: input.booking_url,
      whatsapp: input.social_links?.whatsapp,
      ...(status ? { status } : {}),
    };
  }

  /**
   * Creates a new business directory listing submission.
   */
  async createListing(input: CreateListingInput): Promise<Business> {
    const response = await apiClient.post<DirectoryListingRecord>("/directory", {
      listing: this.buildListingFields(input, "pending"),
      locationIds: [],
    });

    return mapBackendListingToBusiness(response);
  }

  /**
   * Saves a partial business directory listing as a draft.
   */
  async saveDraft(
    input: Partial<CreateListingInput>,
    draftId?: string
  ): Promise<Business> {
    const response = await apiClient.post<DirectoryListingRecord>("/directory/draft", {
      listing: this.buildListingFields(input, "draft"),
      draftId,
      locationIds: [],
    });

    return mapBackendListingToBusiness(response);
  }

  /**
   * Publishes an existing listing draft.
   */
  async publishDraft(
    id: string,
    input: CreateListingInput
  ): Promise<Business> {
    const response = await apiClient.post<DirectoryListingRecord>(
      `/directory/${id}/publish`,
      {
        ...this.buildListingFields(input, "pending"),
        locationIds: [],
      }
    );

    return mapBackendListingToBusiness(response);
  }

  /**
   * Retrieves directory listings owned by the logged-in user.
   */
  async getMyListings(status?: string): Promise<Business[]> {
    try {
      const response = await apiClient.get<DirectoryListingRecord[]>("/directory/me/listings", {
        params: status ? { status } : undefined,
      });

      if (Array.isArray(response)) {
        return response.map(mapBackendListingToBusiness);
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Retrieves recently claimed and verified business listings.
   */
  async getRecentlyClaimedListings(limit = 6): Promise<Business[]> {
    try {
      const response = await apiClient.get<DirectoryListingRecord[]>(
        `/directory/landing/recent`,
        { params: { limit } }
      );

      if (Array.isArray(response) && response.length > 0) {
        return response.map(mapBackendListingToBusiness);
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 500)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Retrieves business categories list.
   */
  async getCategories(): Promise<typeof businessCategories> {
    return businessCategories;
  }

  /**
   * Retrieves directory claims submitted by the logged-in user.
   */
  async getMyClaims(): Promise<DirectoryClaim[]> {
    try {
      const response = await apiClient.get<DirectoryClaim[]>("/directory/me/claims");
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Retrieves aggregated analytics for all listings owned by the logged-in user.
   */
  async getOwnerAnalytics(days = 30): Promise<OwnerAnalyticsSummary> {
    try {
      const response = await apiClient.get<
        OwnerAnalyticsSummary[] | OwnerAnalyticsSummary
      >("/directory/analytics/owner", {
        params: { days },
      });

      if (Array.isArray(response) && response.length > 0) {
        return response[0];
      }
      if (response && typeof response === "object" && "total_views" in response) {
        return response as OwnerAnalyticsSummary;
      }
      return {
        total_views: 0,
        total_whatsapp_clicks: 0,
        total_website_clicks: 0,
        total_map_clicks: 0,
        daily_data: [],
      };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        return {
          total_views: 0,
          total_whatsapp_clicks: 0,
          total_website_clicks: 0,
          total_map_clicks: 0,
          daily_data: [],
        };
      }
      throw err;
    }
  }

  /**
   * Updates an existing directory listing.
   */
  async updateListing(
    id: string,
    updates: Partial<CreateListingInput>,
    locationIds: string[] = []
  ): Promise<Business> {
    const response = await apiClient.put<DirectoryListingRecord>(`/directory/${id}`, {
      updates: this.buildListingFields(updates, undefined, {
        defaultEmptyGallery: false,
      }),
      locationIds,
    });

    return mapBackendListingToBusiness(response);
  }

  /**
   * Deletes a directory listing owned by the user.
   */
  async deleteListing(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/directory/${id}`);
  }
}

export const directoryService = new DirectoryService();

export const getListings = (options?: GetListingsOptions) =>
  directoryService.getListings(options);
export const searchListings = (query: string, options?: SearchListingsOptions) =>
  directoryService.searchListings(query, options);
export const getListingById = (id: string, options?: RequestOptions) =>
  directoryService.getListingById(id, options);
export const getListingByIdSync = (id: string) => directoryService.getListingByIdSync(id);
export const getListingBySlug = (slug: string, options?: RequestOptions) =>
  directoryService.getListingBySlug(slug, options);
export const getListingReviews = (
  listingId: string,
  page?: number,
  limit?: number,
  options?: RequestOptions
) => directoryService.getListingReviews(listingId, page, limit, options);
export const submitReview = (listingId: string, rating: number, comment: string) =>
  directoryService.submitReview(listingId, rating, comment);
export const voteForListing = (listingId: string, vote: 1 | -1) =>
  directoryService.voteForListing(listingId, vote);
export const submitClaim = (claim: SubmitClaimPayload) =>
  directoryService.submitClaim(claim);
export const createListing = (input: CreateListingInput) =>
  directoryService.createListing(input);
export const saveDraft = (input: Partial<CreateListingInput>, draftId?: string) =>
  directoryService.saveDraft(input, draftId);
export const publishDraft = (id: string, input: CreateListingInput) =>
  directoryService.publishDraft(id, input);
export const getMyListings = (status?: string) =>
  directoryService.getMyListings(status);
export const getMyClaims = () => directoryService.getMyClaims();
export const getOwnerAnalytics = (days?: number) =>
  directoryService.getOwnerAnalytics(days);
export const updateListing = (
  id: string,
  updates: Partial<CreateListingInput>,
  locationIds?: string[]
) => directoryService.updateListing(id, updates, locationIds);
export const deleteListing = (id: string) => directoryService.deleteListing(id);
export const getRecentlyClaimedListings = (limit?: number) =>
  directoryService.getRecentlyClaimedListings(limit);
export const getCategories = () => directoryService.getCategories();
