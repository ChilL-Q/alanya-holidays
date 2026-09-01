import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  directoryService,
  mapBackendListingToBusiness,
  mapBackendReviewToBusinessReview,
  getListings,
  getCategories,
  normalizeBusinessCategory,
  type DirectoryListingRecord,
  type BackendReview,
  type SubmitClaimPayload,
} from "./directory.service";
import { apiClient, ApiError } from "@/lib/api-client";

describe("directory.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Mappers", () => {
    it.each([
      ["restaurants", "restaurants"],
      ["cafes", "restaurants"],
      ["accommodations", "hotels"],
      ["apartments", "hotels"],
      ["villas", "hotels"],
      ["tours", "activities"],
      ["nature", "nature"],
      ["transport", "transport"],
      ["car-rental", "transport"],
      ["medical", "wellness"],
      ["spa-hamam", "wellness"],
      ["hair-beauty", "wellness"],
      ["real-estate", "real-estate"],
      ["shopping", "shopping"],
    ])("normalizes raw directory category %s to %s", (raw, canonical) => {
      expect(normalizeBusinessCategory(raw)).toBe(canonical);
    });

    it("mapBackendListingToBusiness should format raw backend listing properly", () => {
      const backendListing: DirectoryListingRecord = {
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
        reviews_average: 4.3,
        reviews_count: 7,
        google_rating: 4.9,
        google_review_count: 120,
        gallery: ["https://example.com/kale.jpg"],
        is_featured: true,
        can_claim: true,
        price_level: 3,
      };

      const result = mapBackendListingToBusiness(backendListing);
      expect(result.id).toBe("biz-uuid-1");
      expect(result.name).toBe("Kale Panorama");
      expect(result.category).toBe("restaurants");
      expect(result.subcategory).toBe("Turkish Cuisine");
      expect(result.description).toBe("Top restaurant in Alanya");
      expect(result.googleRating).toBe(4.9);
      expect(result.googleReviewCount).toBe(120);
      expect(result.rating).toBe(4.3);
      expect(result.reviewCount).toBe(7);
      expect(result.image).toBe("https://example.com/kale.jpg");
      expect(result.tags).toEqual([]);
      expect(result.featured).toBe(true);
      expect(result.can_claim).toBe(true);
      expect(result.priceRange).toBe("$$$");
      expect(result.lat).toBe(36.5437);
      expect(result.lng).toBe(31.9998);
    });

    it("mapBackendListingToBusiness should apply canonical defaults for missing fields", () => {
      const backendListing: DirectoryListingRecord = {
        id: "biz-uuid-2",
        name: "Beach Cafe",
      };

      const result = mapBackendListingToBusiness(backendListing);
      expect(result.tags).toEqual([]);
      expect(result.priceRange).toBe("$$");
      expect(result.rating).toBe(0);
      expect(result.reviewCount).toBe(0);
      expect(result.googleRating).toBeNull();
      expect(result.googleReviewCount).toBeNull();
      expect(result.openingHours).toBe("09:00 - 18:00");
      expect(result.image).toContain("ui-avatars.com");
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
      expect(result).not.toBeNull();
      expect(result!.id).toBe("rev-uuid-1");
      expect(result!.businessId).toBe("biz-001");
      expect(result!.rating).toBe(5);
      expect(result!.content).toBe("Excellent dinner and views!");
      expect(result!.reviewerName).toBe("Sarah Connor");
      expect(result!.reviewerAvatar).toBe("https://example.com/sarah.jpg");
      expect(result!.date).toBe("2026-07-20");
      expect(result!.title).toBeNull();
      expect(result!.visitType).toBeNull();
    });

    it.each([
      ["zero", 0],
      ["null", null],
      ["missing", undefined],
      ["negative", -1],
      ["over five", 6],
      ["fractional", 4.5],
      ["NaN", Number.NaN],
      ["infinite", Number.POSITIVE_INFINITY],
    ])("rejects a %s review rating instead of fabricating five stars", (_label, rating) => {
      const review = {
        id: `invalid-${_label}`,
        listing_id: "biz-001",
        rating,
        comment: "Malformed rating must not be published.",
      } as unknown as BackendReview;

      expect(mapBackendReviewToBusinessReview(review, "biz-001")).toBeNull();
    });

    it("preserves a valid review without inventing author or provenance fields", () => {
      const review = {
        id: "review-without-author",
        listing_id: "biz-001",
        rating: 4,
        comment: "Valid community feedback.",
        user: null,
      } as BackendReview;

      const result = mapBackendReviewToBusinessReview(review, "biz-001");

      expect(result).toMatchObject({
        rating: 4,
        reviewerName: null,
        reviewerAvatar: null,
        date: null,
        title: null,
        visitType: null,
      });
      expect(JSON.stringify(result)).not.toContain("Verified Traveler");
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
          category: "restaurants,restaurants-cafes,cafes",
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

    it("should propagate ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Network Error", 500, "Internal Server Error")
      );

      await expect(directoryService.getListings({ category: "restaurants-cafes" })).rejects.toThrow(ApiError);
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
          category: "restaurants,restaurants-cafes,cafes",
          location: undefined,
          page: 1,
          limit: 40,
        },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Search Hit Cafe");
    });

    it("should propagate ApiError on search API error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Offline", 500, "Internal Server Error")
      );

      await expect(directoryService.searchListings("Panorama")).rejects.toThrow(ApiError);
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

    it("should return local fallback on 404 when sync fallback is allowed", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not Found", 404, "Not Found")
      );

      const result = await directoryService.getListingById("biz-001");
      expect(result?.id).toBe("biz-001");
    });

    it("should return null on 404 in strict live mode", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not Found", 404, "Not Found")
      );

      const result = await directoryService.getListingById("biz-001", {
        allowSyncFallback: false,
      });
      expect(result).toBeNull();
    });

    it("should propagate ApiError on 500 error in strict live mode", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Server Error", 500, "Internal Server Error")
      );

      await expect(
        directoryService.getListingById("biz-001", { allowSyncFallback: false })
      ).rejects.toThrow(ApiError);
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

    it("should return null on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not Found", 404, "Not Found")
      );

      const result = await directoryService.getListingBySlug("missing-slug");
      expect(result).toBeNull();
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

    it("filters malformed ratings without fabricating five-star community reviews", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: [
          {
            id: "valid-review",
            listing_id: "biz-001",
            rating: 4,
            comment: "Legitimate review",
            user: { full_name: "Known Author" },
          },
          { id: "zero-review", listing_id: "biz-001", rating: 0, comment: "Invalid" },
          { id: "null-review", listing_id: "biz-001", rating: null, comment: "Invalid" },
          { id: "missing-review", listing_id: "biz-001", comment: "Invalid" },
          { id: "high-review", listing_id: "biz-001", rating: 6, comment: "Invalid" },
        ],
        count: 5,
      });

      const reviews = await directoryService.getListingReviews("biz-001");

      expect(reviews).toHaveLength(1);
      expect(reviews[0]).toMatchObject({ rating: 4, reviewerName: "Known Author" });
      expect(JSON.stringify(reviews)).not.toContain("Verified Traveler");
    });

    it("should return empty array on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not Found", 404, "Not Found")
      );

      const reviews = await directoryService.getListingReviews("biz-404");
      expect(reviews).toEqual([]);
    });

    it("should propagate ApiError on 500", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Internal Error", 500, "Internal Server Error")
      );

      await expect(directoryService.getListingReviews("biz-500")).rejects.toThrow(ApiError);
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

    it("should throw ApiError if submitReview fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("Server Error", 500, "Internal Server Error")
      );

      await expect(directoryService.submitReview("biz-001", 4, "Good ambience")).rejects.toThrow(ApiError);
    });

    it("rejects a malformed submitted-review response instead of fabricating five stars", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        id: "malformed-new-review",
        listing_id: "biz-001",
        rating: null,
        comment: "Server response without a valid rating",
      });

      await expect(
        directoryService.submitReview("biz-001", 4, "Good ambience")
      ).rejects.toMatchObject({
        name: "ApiError",
        status: 502,
      });
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

  describe("verifyClaim", () => {
    it("posts the token in the JSON body and never in the URL", async () => {
      const mockVerification = { success: true };
      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockVerification);

      const result = await directoryService.verifyClaim("claim/token?secret=yes");

      expect(apiClient.post).toHaveBeenCalledWith("/directory/claims/verify", {
        token: "claim/token?secret=yes",
      });
      expect(result).toEqual(mockVerification);
      expect(apiClient.post).not.toHaveBeenCalledWith(expect.stringContaining("claim%2Ftoken"), expect.anything());
      expect(apiClient.post).not.toHaveBeenCalledWith(expect.stringContaining("secret"), expect.anything());
    });
  });

  describe("category taxonomy", () => {
    it.each([
      ["restaurants-cafes", "restaurants"],
      ["hotels-accommodation", "hotels"],
      ["tours-activities", "activities"],
      ["health-wellness", "wellness"],
      ["boat-tours", "boat-tours"],
    ])("normalizes legacy category %s to %s", (category, expected) => {
      expect(normalizeBusinessCategory(category)).toBe(expected);
    });

    it("normalizes legacy categories while mapping backend listings", () => {
      const business = mapBackendListingToBusiness({
        id: "legacy-1",
        name: "Legacy Hotel",
        category_id: "hotels-accommodation",
      });

      expect(business.category).toBe("hotels");
    });
  });

  describe("getCategories", () => {
    it("should return the canonical backend directory category IDs", async () => {
      const categories = await directoryService.getCategories();
      expect(categories.map((category) => category.id)).toEqual([
        "all",
        "restaurants",
        "hotels",
        "activities",
        "nature",
        "boat-tours",
        "water-sports",
        "transport",
        "real-estate",
        "wellness",
        "shopping",
        "services",
        "nightlife",
      ]);
    });

    it("uses an available Remix Icon for Water Sports", async () => {
      const categories = await directoryService.getCategories();

      expect(categories.find((category) => category.id === "water-sports")?.icon).toBe(
        "ri-water-flash-line"
      );
    });
  });

  describe("saveDraft", () => {
    it("should post draft payload to /directory/draft and return mapped Business", async () => {
      const mockBackendDraft: DirectoryListingRecord = {
        id: "draft-123",
        name: "Draft Cafe",
        category_id: "restaurants",
        status: "draft",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockBackendDraft);

      const result = await directoryService.saveDraft({
        name: "Draft Cafe",
        category: "restaurants",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/directory/draft", {
        listing: expect.objectContaining({
          name: "Draft Cafe",
          category_id: "restaurants",
          status: "draft",
        }),
        draftId: undefined,
        locationIds: [],
      });
      expect(result.id).toBe("draft-123");
      expect(result.name).toBe("Draft Cafe");
      expect(result.status).toBe("draft");
    });

    it("should pass draftId when updating an existing draft", async () => {
      const mockBackendDraft: DirectoryListingRecord = {
        id: "draft-456",
        name: "Updated Draft Cafe",
        status: "draft",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockBackendDraft);

      const result = await directoryService.saveDraft(
        { name: "Updated Draft Cafe" },
        "draft-456"
      );

      expect(apiClient.post).toHaveBeenCalledWith("/directory/draft", {
        listing: expect.objectContaining({
          name: "Updated Draft Cafe",
          status: "draft",
        }),
        draftId: "draft-456",
        locationIds: [],
      });
      expect(result.id).toBe("draft-456");
    });
  });

  describe("publishDraft", () => {
    it("should post publish payload to /directory/:id/publish", async () => {
      const mockPublished: DirectoryListingRecord = {
        id: "draft-123",
        name: "Published Restaurant",
        category_id: "restaurants",
        status: "pending",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockPublished);

      const result = await directoryService.publishDraft("draft-123", {
        name: "Published Restaurant",
        category: "restaurants",
        description: "Full details for publication.",
        address: "Alanya Beach",
        phone: "+90 242 000 0000",
        email: "contact@published.test",
        tier: "explorer",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/directory/draft-123/publish", {
        name: "Published Restaurant",
        category_id: "restaurants",
        description: "Full details for publication.",
        short_description: "Full details for publication.",
        location: "Alanya Beach",
        address: "Alanya Beach",
        phone: "+90 242 000 0000",
        email: "contact@published.test",
        tier: "explorer",
        gallery: [],
        status: "pending",
        locationIds: [],
      });
      expect(result.status).toBe("pending");
    });
  });

  describe("getMyListings", () => {
    it("should call /directory/me/listings with status parameter when provided", async () => {
      const mockListings = [
        {
          id: "listing-1",
          name: "My Draft",
          status: "draft",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockListings);

      const result = await directoryService.getMyListings("draft");

      expect(apiClient.get).toHaveBeenCalledWith("/directory/me/listings", {
        params: { status: "draft" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("My Draft");
      expect(result[0].status).toBe("draft");
    });
  });

  describe("getMyClaims", () => {
    it("should call /directory/me/claims and return claims array", async () => {
      const mockClaims = [
        {
          id: "claim-101",
          listing_id: "biz-001",
          business_name: "Alanya Sun Hotel",
          status: "pending",
          created_at: "2026-08-10T12:00:00Z",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockClaims);

      const result = await directoryService.getMyClaims();

      expect(apiClient.get).toHaveBeenCalledWith("/directory/me/claims");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("claim-101");
      expect(result[0].business_name).toBe("Alanya Sun Hotel");
      expect(result[0].status).toBe("pending");
    });

    it("should return empty array on 401/404 API error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Unauthorized", 401, "Unauthorized")
      );

      const result = await directoryService.getMyClaims();
      expect(result).toEqual([]);
    });
  });

  describe("getOwnerAnalytics", () => {
    it("should call /directory/analytics/owner with days parameter and return summary", async () => {
      const mockAnalytics = [
        {
          total_views: 1250,
          total_whatsapp_clicks: 84,
          total_website_clicks: 142,
          total_map_clicks: 65,
          daily_data: [
            {
              date: "2026-08-19",
              views: 45,
              whatsapp_clicks: 3,
              website_clicks: 5,
              map_clicks: 2,
            },
          ],
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockAnalytics);

      const result = await directoryService.getOwnerAnalytics(30);

      expect(apiClient.get).toHaveBeenCalledWith("/directory/analytics/owner", {
        params: { days: 30 },
      });
      expect(result.total_views).toBe(1250);
      expect(result.total_whatsapp_clicks).toBe(84);
      expect(result.daily_data).toHaveLength(1);
    });

    it("should return empty structure on 401/404 API error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Unauthorized", 401, "Unauthorized")
      );

      const result = await directoryService.getOwnerAnalytics(7);

      expect(result.total_views).toBe(0);
      expect(result.total_whatsapp_clicks).toBe(0);
      expect(result.daily_data).toBeDefined();
    });
  });

  describe("updateListing and deleteListing", () => {
    it("should call PUT /directory/:id when updating listing", async () => {
      const mockUpdated: DirectoryListingRecord = {
        id: "biz-123",
        name: "Updated Name",
        status: "approved",
      };

      vi.spyOn(apiClient, "put").mockResolvedValueOnce(mockUpdated);

      const result = await directoryService.updateListing("biz-123", {
        name: "Updated Name",
      });

      expect(apiClient.put).toHaveBeenCalledWith("/directory/biz-123", {
        updates: expect.objectContaining({ name: "Updated Name" }),
        locationIds: [],
      });
      expect(result.name).toBe("Updated Name");
    });

    it("should call DELETE /directory/:id when deleting listing", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      const result = await directoryService.deleteListing("biz-123");

      expect(apiClient.delete).toHaveBeenCalledWith("/directory/biz-123");
      expect(result).toEqual({ success: true });
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
