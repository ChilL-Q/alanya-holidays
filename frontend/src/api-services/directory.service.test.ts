import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  directoryService,
  mapBackendListingToBusiness,
  mapBackendReviewToBusinessReview,
  getListings,
  getCategories,
  type BackendDirectoryListing,
  type BackendReview,
  type SubmitClaimPayload,
} from "./directory.service";
import { apiClient } from "@/lib/api-client";
import { businessCategories } from "@/mocks/businesses";

describe("directory.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Mappers", () => {
    it("mapBackendListingToBusiness should format raw backend listing properly", () => {
      const backendListing: BackendDirectoryListing = {
        id: "biz-uuid-1",
        slug: "kale-panorama",
        name: "Kale Panorama",
        category_id: "restaurants-cafes",
        subcategory: "Turkish Cuisine",
        short_description: "Top restaurant in Alanya",
        address: "Kale Cad. 12",
        phone: "+90 555 123 4567",
        email: "info@kale.com",
        website: "https://kale.com",
        average_rating: 4.9,
        reviews_count: 120,
        featured_image: "https://example.com/kale.jpg",
        tags: '["Terrace", "View", "Fine Dining"]',
        is_featured: true,
        price_range: "$$$",
        opening_hours: "10:00 - 23:00",
        latitude: 36.5361,
        longitude: 31.9956,
      };

      const result = mapBackendListingToBusiness(backendListing);
      expect(result.id).toBe("biz-uuid-1");
      expect(result.name).toBe("Kale Panorama");
      expect(result.category).toBe("restaurants-cafes");
      expect(result.subcategory).toBe("Turkish Cuisine");
      expect(result.description).toBe("Top restaurant in Alanya");
      expect(result.rating).toBe(4.9);
      expect(result.reviewCount).toBe(120);
      expect(result.image).toBe("https://example.com/kale.jpg");
      expect(result.tags).toEqual(["Terrace", "View", "Fine Dining"]);
      expect(result.featured).toBe(true);
      expect(result.priceRange).toBe("$$$");
      expect(result.lat).toBe(36.5361);
      expect(result.lng).toBe(31.9956);
    });

    it("mapBackendListingToBusiness should handle comma-separated string tags and defaults", () => {
      const backendListing: BackendDirectoryListing = {
        id: "biz-uuid-2",
        name: "Beach Cafe",
        tags: "Beach, Sun, Drinks",
      };

      const result = mapBackendListingToBusiness(backendListing);
      expect(result.tags).toEqual(["Beach", "Sun", "Drinks"]);
      expect(result.priceRange).toBe("$$");
      expect(result.rating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });

    it("mapBackendReviewToBusinessReview should format backend review properly", () => {
      const backendReview: BackendReview = {
        id: "rev-uuid-1",
        listing_id: "biz-001",
        rating: 5,
        comment: "Excellent dinner and views!",
        created_at: "2026-07-20T12:00:00.000Z",
        user: {
          full_name: "Sarah Connor",
          avatar_url: "https://example.com/sarah.jpg",
        },
      };

      const result = mapBackendReviewToBusinessReview(backendReview, "biz-001");
      expect(result.id).toBe("rev-uuid-1");
      expect(result.businessId).toBe("biz-001");
      expect(result.rating).toBe(5);
      expect(result.content).toBe("Excellent dinner and views!");
      expect(result.reviewerName).toBe("Sarah Connor");
      expect(result.reviewerAvatar).toBe("https://example.com/sarah.jpg");
      expect(result.date).toBe("2026-07-20");
    });
  });

  describe("getListings", () => {
    it("should return mapped listings when API responds with paginated data", async () => {
      const mockApiData = {
        data: [
          {
            id: "biz-api-1",
            name: "API Restaurant",
            category_id: "restaurants-cafes",
            average_rating: 4.7,
            reviews_count: 55,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockApiData);

      const result = await directoryService.getListings({ category: "restaurants-cafes" });

      expect(apiClient.get).toHaveBeenCalledWith("/directory", {
        params: {
          page: 1,
          limit: 20,
          category: "restaurants-cafes",
          sortBy: undefined,
        },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("biz-api-1");
      expect(result.data[0].name).toBe("API Restaurant");
      expect(result.total).toBe(1);
    });

    it("should return mapped listings when API responds with flat array", async () => {
      const mockApiArray = [
        {
          id: "biz-api-2",
          name: "API Hotel",
          category_id: "hotels-accommodation",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockApiArray);

      const result = await directoryService.getListings();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("API Hotel");
      expect(result.total).toBe(1);
    });

    it("should gracefully fallback to mock businesses on API error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await directoryService.getListings({ category: "restaurants-cafes" });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every((b) => b.category === "restaurants-cafes")).toBe(true);
      expect(result.total).toBe(result.data.length);
    });

    it("should sort mock businesses properly on fallback", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await directoryService.getListings({ sortBy: "rating" });
      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].rating).toBeGreaterThanOrEqual(result.data[i + 1].rating);
      }
    });
  });

  describe("searchListings", () => {
    it("should call /directory/search with search query and parameters", async () => {
      const mockSearchData = {
        data: [
          {
            id: "biz-search-1",
            name: "Search Hit Cafe",
          },
        ],
        total: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockSearchData);

      const result = await directoryService.searchListings("Cafe", {
        category: "restaurants-cafes",
        page: 1,
        limit: 40,
      });

      expect(apiClient.get).toHaveBeenCalledWith("/directory/search", {
        params: {
          query: "Cafe",
          category: "restaurants-cafes",
          location: undefined,
          page: 1,
          limit: 40,
        },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Search Hit Cafe");
    });

    it("should fallback to filtering mock businesses on search API error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Offline"));

      const result = await directoryService.searchListings("Panorama");

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some((b) => b.name.includes("Panorama"))).toBe(true);
    });
  });

  describe("getListingById", () => {
    it("should retrieve business by id via API", async () => {
      const mockListing = {
        id: "biz-123",
        name: "Direct API Business",
        category_id: "shopping",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockListing);

      const result = await directoryService.getListingById("biz-123");

      expect(apiClient.get).toHaveBeenCalledWith("/directory/biz-123");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("biz-123");
      expect(result?.name).toBe("Direct API Business");
    });

    it("should fallback to mock businesses if API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API Down"));

      const result = await directoryService.getListingById("biz-001");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("biz-001");
      expect(result?.name).toBe("Kale Panorama Restaurant");
    });

    it("should return null if business not found in API or mock", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(null);

      const result = await directoryService.getListingById("non-existent-biz-id");
      expect(result).toBeNull();
    });
  });

  describe("getListingBySlug", () => {
    it("should retrieve business by slug via API", async () => {
      const mockListing = {
        id: "biz-456",
        slug: "cleopatra-beach-club",
        name: "Cleopatra Beach Club",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockListing);

      const result = await directoryService.getListingBySlug("cleopatra-beach-club");

      expect(apiClient.get).toHaveBeenCalledWith("/directory/slug/cleopatra-beach-club");
      expect(result?.name).toBe("Cleopatra Beach Club");
    });

    it("should fallback to mock businesses matching id or slug name", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API Down"));

      const result = await directoryService.getListingBySlug("biz-002");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Cleopatra Beach Club");
    });
  });

  describe("getListingReviews", () => {
    it("should retrieve reviews from API for listing", async () => {
      const mockReviewsData = {
        data: [
          {
            id: "rev-api-1",
            listing_id: "biz-001",
            rating: 5,
            comment: "Loved the food!",
            created_at: "2026-08-01T10:00:00Z",
            user: { full_name: "John Doe" },
          },
        ],
        count: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockReviewsData);

      const reviews = await directoryService.getListingReviews("biz-001");

      expect(apiClient.get).toHaveBeenCalledWith("/reviews/listing/biz-001", {
        params: { page: 1, limit: 20 },
      });
      expect(reviews).toHaveLength(1);
      expect(reviews[0].reviewerName).toBe("John Doe");
      expect(reviews[0].content).toBe("Loved the food!");
    });

    it("should fallback to mock reviews when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const reviews = await directoryService.getListingReviews("biz-001");

      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews[0].businessId).toBe("biz-001");
    });

    it("should return empty array if no mock reviews exist for business", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const reviews = await directoryService.getListingReviews("biz-999-unknown");
      expect(reviews).toEqual([]);
    });
  });

  describe("submitReview", () => {
    it("should post review to API", async () => {
      const mockReviewResponse = {
        id: "new-rev-1",
        listing_id: "biz-001",
        rating: 5,
        comment: "Outstanding service",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockReviewResponse);

      const result = await directoryService.submitReview("biz-001", 5, "Outstanding service");

      expect(apiClient.post).toHaveBeenCalledWith("/reviews/listing/biz-001", {
        rating: 5,
        comment: "Outstanding service",
      });
      expect(result.id).toBe("new-rev-1");
      expect(result.rating).toBe(5);
    });

    it("should create local fallback review if API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Unauthorized or Offline"));

      const result = await directoryService.submitReview("biz-001", 4, "Good ambience");

      expect(result.businessId).toBe("biz-001");
      expect(result.rating).toBe(4);
      expect(result.content).toBe("Good ambience");
      expect(result.reviewerName).toBe("Verified Guest");
    });
  });

  describe("voteForListing", () => {
    it("should post vote to API", async () => {
      const mockVoteRes = { success: true, netVotes: 12 };
      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockVoteRes);

      const result = await directoryService.voteForListing("biz-001", 1);

      expect(apiClient.post).toHaveBeenCalledWith("/directory/biz-001/vote", { vote: 1 });
      expect(result).toEqual(mockVoteRes);
    });

    it("should return fallback vote response if API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Offline"));

      const result = await directoryService.voteForListing("biz-001", -1);

      expect(result).toEqual({ success: true, local: true, vote: -1 });
    });
  });

  describe("submitClaim", () => {
    it("should post claim payload to API", async () => {
      const claimPayload: SubmitClaimPayload = {
        listing_id: "biz-001",
        full_name: "Owner Name",
        email: "owner@kalepanorama.com",
        phone: "+90 555 999 8877",
        role_title: "General Manager",
        verification_method: "official_email",
      };

      const mockClaimRes = { id: "claim-1", status: "pending" };
      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockClaimRes);

      const result = await directoryService.submitClaim(claimPayload);

      expect(apiClient.post).toHaveBeenCalledWith("/directory/claims", claimPayload);
      expect(result).toEqual(mockClaimRes);
    });
  });

  describe("getCategories", () => {
    it("should return business categories", async () => {
      const categories = await directoryService.getCategories();
      expect(categories).toEqual(businessCategories);
    });
  });

  describe("Standalone Helper Exports", () => {
    it("should export top-level helpers that proxy to directoryService", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: [{ id: "biz-p-1", name: "Proxied Biz" }],
        total: 1,
      });

      const res = await getListings();
      expect(res.data[0].id).toBe("biz-p-1");

      const cats = await getCategories();
      expect(cats.length).toBeGreaterThan(0);
    });
  });
});
