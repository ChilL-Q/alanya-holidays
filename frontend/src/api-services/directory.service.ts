import { apiClient } from "@/lib/api-client";
import { businesses as mockBusinesses, businessCategories, type Business } from "@/mocks/businesses";
import {
  businessReviews as mockBusinessReviews,
  getReviewsForBusiness,
  type BusinessReview,
} from "@/mocks/business-reviews";

export type { Business, BusinessReview };

export interface BackendDirectoryListing {
  id: string;
  slug?: string;
  name: string;
  category_id?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  short_description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  average_rating?: number;
  review_count?: number;
  reviews_count?: number;
  reviewCount?: number;
  image?: string;
  image_url?: string;
  featured_image?: string;
  tags?: string[] | string;
  is_featured?: boolean;
  featured?: boolean;
  price_range?: string;
  priceRange?: string;
  opening_hours?: string;
  openingHours?: string;
  latitude?: number;
  lat?: number;
  longitude?: number;
  lng?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

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

export interface GetListingsOptions {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: "rating" | "reviews" | "name" | "base_score" | string;
}

export interface SearchListingsOptions {
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
  full_name: string;
  email: string;
  phone?: string;
  role_title?: string;
  verification_method: string;
  [key: string]: unknown;
}

export function mapBackendListingToBusiness(item: BackendDirectoryListing): Business {
  let tags: string[] = [];
  if (Array.isArray(item.tags)) {
    tags = item.tags.map(String);
  } else if (typeof item.tags === "string") {
    try {
      const parsed = JSON.parse(item.tags);
      tags = Array.isArray(parsed) ? parsed.map(String) : [item.tags];
    } catch {
      tags = item.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }

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
    rating: item.rating ?? item.average_rating ?? 0,
    reviewCount: item.reviewCount ?? item.review_count ?? item.reviews_count ?? 0,
    image:
      item.image ||
      item.image_url ||
      item.featured_image ||
      "https://readdy.ai/api/search-image?query=Alanya%20city%20business%20exterior%20travel%20photography&width=800&height=600&orientation=landscape",
    tags,
    featured: Boolean(item.featured ?? item.is_featured),
    priceRange: item.priceRange || item.price_range || "$$",
    openingHours: item.openingHours || item.opening_hours || "09:00 - 18:00",
    lat: item.lat ?? item.latitude ?? 36.5437,
    lng: item.lng ?? item.longitude ?? 31.9998,
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
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20clean%20background&width=100&height=100&orientation=squarish",
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
   * Falls back gracefully to mock businesses when offline or on API failure.
   */
  async getListings(options: GetListingsOptions = {}): Promise<GetListingsResult> {
    const { page = 1, limit = 20, category, sortBy } = options;

    try {
      const response = await apiClient.get<
        | { data: BackendDirectoryListing[]; pagination?: { total?: number; totalPages?: number } }
        | BackendDirectoryListing[]
      >("/directory", {
        params: {
          page,
          limit,
          category,
          sortBy,
        },
      });

      if (response && "data" in response && Array.isArray(response.data)) {
        const mapped = response.data.map(mapBackendListingToBusiness);
        const total = response.pagination?.total ?? mapped.length;
        const totalPages = response.pagination?.totalPages ?? Math.ceil(total / limit);
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
          totalPages: Math.ceil(mapped.length / limit),
        };
      }
    } catch (err) {
      console.warn("Failed to fetch directory listings from API, using fallback mock:", err);
    }

    // Mock Fallback
    let fallback = [...mockBusinesses];
    if (category && category !== "all") {
      fallback = fallback.filter((b) => b.category === category);
    }

    if (sortBy === "rating") {
      fallback.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "reviews") {
      fallback.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === "name") {
      fallback.sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = fallback.length;
    const startIndex = (page - 1) * limit;
    const paginated = fallback.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Searches business listings by query string and optional filters.
   */
  async searchListings(
    query: string,
    options: SearchListingsOptions = {}
  ): Promise<GetListingsResult> {
    const { category, location, page = 1, limit = 40 } = options;

    try {
      const response = await apiClient.get<
        | { data: BackendDirectoryListing[]; total?: number; count?: number }
        | BackendDirectoryListing[]
      >("/directory/search", {
        params: {
          query,
          category,
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
          totalPages: Math.ceil(total / limit),
        };
      }

      if (Array.isArray(response)) {
        const mapped = response.map(mapBackendListingToBusiness);
        return {
          data: mapped,
          total: mapped.length,
          page,
          limit,
          totalPages: Math.ceil(mapped.length / limit),
        };
      }
    } catch (err) {
      console.warn(`Failed to search directory for '${query}', using fallback search:`, err);
    }

    // Mock Search Fallback
    const q = query.toLowerCase().trim();
    const fallback = mockBusinesses.filter((b) => {
      const matchesQuery =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.subcategory.toLowerCase().includes(q) ||
        b.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        b.address.toLowerCase().includes(q);

      const matchesCat = !category || category === "all" || b.category === category;
      return matchesQuery && matchesCat;
    });

    const total = fallback.length;
    const startIndex = (page - 1) * limit;
    const paginated = fallback.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Retrieves a single business listing by its ID.
   */
  async getListingById(id: string): Promise<Business | null> {
    try {
      const data = await apiClient.get<BackendDirectoryListing>(`/directory/${id}`);
      if (data && data.id) {
        return mapBackendListingToBusiness(data);
      }
    } catch (err) {
      console.warn(`Failed to fetch listing '${id}' from API, searching fallback:`, err);
    }

    const fallback = mockBusinesses.find((b) => b.id === id);
    return fallback || null;
  }

  /**
   * Retrieves a single business listing by its slug.
   */
  async getListingBySlug(slug: string): Promise<Business | null> {
    try {
      const data = await apiClient.get<BackendDirectoryListing>(`/directory/slug/${slug}`);
      if (data && (data.id || data.slug)) {
        return mapBackendListingToBusiness(data);
      }
    } catch (err) {
      console.warn(`Failed to fetch listing slug '${slug}' from API, searching fallback:`, err);
    }

    const fallback = mockBusinesses.find(
      (b) =>
        b.id === slug ||
        b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug.toLowerCase() ||
        b.name.toLowerCase() === slug.toLowerCase()
    );
    return fallback || null;
  }

  /**
   * Retrieves reviews for a specific business listing.
   */
  async getListingReviews(
    listingId: string,
    page = 1,
    limit = 20
  ): Promise<BusinessReview[]> {
    try {
      const response = await apiClient.get<
        { data: BackendReview[]; count?: number } | BackendReview[]
      >(`/reviews/listing/${listingId}`, {
        params: { page, limit },
      });

      if (response && "data" in response && Array.isArray(response.data)) {
        return response.data.map((r) => mapBackendReviewToBusinessReview(r, listingId));
      }

      if (Array.isArray(response)) {
        return response.map((r) => mapBackendReviewToBusinessReview(r, listingId));
      }
    } catch (err) {
      console.warn(`Failed to fetch reviews for listing '${listingId}', using fallback:`, err);
    }

    const fallback = getReviewsForBusiness(listingId) || mockBusinessReviews[listingId];
    return fallback || [];
  }

  /**
   * Submits a review for a business listing.
   */
  async submitReview(
    listingId: string,
    rating: number,
    comment: string
  ): Promise<BusinessReview> {
    try {
      const response = await apiClient.post<BackendReview>(`/reviews/listing/${listingId}`, {
        rating,
        comment,
      });

      if (response && response.id) {
        return mapBackendReviewToBusinessReview(response, listingId);
      }
    } catch (err) {
      console.warn(`Failed to submit review via API, generating local fallback review:`, err);
    }

    // Local fallback review
    const localReview: BusinessReview = {
      id: `rev-local-${Date.now()}`,
      businessId: listingId,
      reviewerName: "Verified Guest",
      reviewerAvatar:
        "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20clean%20background&width=100&height=100&orientation=squarish",
      rating,
      date: new Date().toISOString().split("T")[0],
      title: rating >= 4 ? "Great Experience" : "Review",
      content: comment,
      visitType: "Traveler",
    };

    return localReview;
  }

  /**
   * Submits an upvote (+1) or downvote (-1) for a listing.
   */
  async voteForListing(
    listingId: string,
    vote: 1 | -1
  ): Promise<{ success: boolean; netVotes?: number; [key: string]: unknown }> {
    try {
      const res = await apiClient.post<{ success: boolean; netVotes?: number; [key: string]: unknown }>(
        `/directory/${listingId}/vote`,
        { vote }
      );
      return res;
    } catch (err) {
      console.warn(`Failed to vote for listing '${listingId}', using fallback:`, err);
      return { success: true, local: true, vote };
    }
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
   * Retrieves business categories list.
   */
  async getCategories(): Promise<typeof businessCategories> {
    return businessCategories;
  }
}

export const directoryService = new DirectoryService();

export const getListings = (options?: GetListingsOptions) =>
  directoryService.getListings(options);
export const searchListings = (query: string, options?: SearchListingsOptions) =>
  directoryService.searchListings(query, options);
export const getListingById = (id: string) => directoryService.getListingById(id);
export const getListingBySlug = (slug: string) =>
  directoryService.getListingBySlug(slug);
export const getListingReviews = (listingId: string, page?: number, limit?: number) =>
  directoryService.getListingReviews(listingId, page, limit);
export const submitReview = (listingId: string, rating: number, comment: string) =>
  directoryService.submitReview(listingId, rating, comment);
export const voteForListing = (listingId: string, vote: 1 | -1) =>
  directoryService.voteForListing(listingId, vote);
export const submitClaim = (claim: SubmitClaimPayload) =>
  directoryService.submitClaim(claim);
export const getCategories = () => directoryService.getCategories();
