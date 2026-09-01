import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  propertiesService,
  getProperties,
  getProperty,
  getAvailableProperties,
  checkAvailability,
  getPropertyTypes,
  mapBackendPropertyToPropertyItem,
  mapVillaToPropertyItem,
  type Villa,
} from "./properties.service";
import { apiClient, ApiError } from "@/lib/api-client";

const sampleVilla: Villa = {
  id: "villa-001",
  name: "Cleopatra Luxury Villa",
  location: "Cleopatra Beach, Alanya",
  bedrooms: 5,
  bathrooms: 4,
  maxGuests: 10,
  pricePerNight: 450,
  currency: "EUR",
  hasPool: true,
  hasSeaView: true,
  image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  description: "Stunning cliffside luxury villa with private infinity pool.",
  amenities: ["Infinity Pool", "Jacuzzi", "High-Speed WiFi", "Air Conditioning"],
  rating: 4.9,
  reviewCount: 38,
  featured: true,
  minStay: 3,
  distanceToBeach: "150m",
};

describe("properties.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("mapBackendPropertyToPropertyItem", () => {
    it("should map snake_case and nested fields properly", () => {
      const raw = {
        id: "prop-123",
        title: "Sunset Villa Alanya",
        description: "Panoramic sea view villa",
        type: "villa",
        location: "Kargıcak",
        price_per_night: 450,
        currency: "EUR",
        bedrooms: 4,
        bathrooms: 3,
        max_guests: 8,
        has_pool: true,
        has_sea_view: true,
        images: ["https://example.com/v1.jpg", "https://example.com/v2.jpg"],
        amenities: ["WiFi", "Pool", "AC"],
        rating: 4.9,
        review_count: 22,
        featured: true,
        min_stay_nights: 3,
        distance_to_beach: "400m",
        status: "approved",
      };

      const mapped = mapBackendPropertyToPropertyItem(raw);
      expect(mapped.id).toBe("prop-123");
      expect(mapped.title).toBe("Sunset Villa Alanya");
      expect(mapped.name).toBe("Sunset Villa Alanya");
      expect(mapped.pricePerNight).toBe(450);
      expect(mapped.price_per_night).toBe(450);
      expect(mapped.maxGuests).toBe(8);
      expect(mapped.hasPool).toBe(true);
      expect(mapped.hasSeaView).toBe(true);
      expect(mapped.images).toEqual(["https://example.com/v1.jpg", "https://example.com/v2.jpg"]);
      expect(mapped.image).toBe("https://example.com/v1.jpg");
      expect(mapped.minStay).toBe(3);
      expect(mapped.distanceToBeach).toBe("400m");
    });

    it("should handle missing or fallback fields gracefully", () => {
      const mapped = mapBackendPropertyToPropertyItem({});
      expect(mapped.id).toBe("");
      expect(mapped.title).toBe("Alanya Property");
      expect(mapped.pricePerNight).toBe(0);
      expect(mapped.currency).toBe("EUR");
      expect(mapped.bedrooms).toBe(0);
      expect(mapped.bathrooms).toBe(0);
      expect(mapped.maxGuests).toBe(0);
      expect(mapped.hasPool).toBe(false);
      expect(mapped.hasSeaView).toBe(false);
      expect(mapped.images).toEqual([]);
      expect(mapped.amenities).toEqual([]);
      expect(mapped.rating).toBe(0);
      expect(mapped.reviewCount).toBe(0);
      expect(mapped.minStay).toBe(0);
      expect(mapped.status).toBeUndefined();
    });
  });

  describe("mapVillaToPropertyItem", () => {
    it("should map villa to PropertyItem format", () => {
      const mapped = mapVillaToPropertyItem(sampleVilla);

      expect(mapped.id).toBe(sampleVilla.id);
      expect(mapped.title).toBe(sampleVilla.name);
      expect(mapped.name).toBe(sampleVilla.name);
      expect(mapped.location).toBe(sampleVilla.location);
      expect(mapped.pricePerNight).toBe(sampleVilla.pricePerNight);
      expect(mapped.bedrooms).toBe(sampleVilla.bedrooms);
      expect(mapped.bathrooms).toBe(sampleVilla.bathrooms);
      expect(mapped.maxGuests).toBe(sampleVilla.maxGuests);
      expect(mapped.hasPool).toBe(sampleVilla.hasPool);
      expect(mapped.hasSeaView).toBe(sampleVilla.hasSeaView);
      expect(mapped.image).toBe(sampleVilla.image);
      expect(mapped.amenities).toEqual(sampleVilla.amenities);
      expect(mapped.rating).toBe(sampleVilla.rating);
      expect(mapped.reviewCount).toBe(sampleVilla.reviewCount);
      expect(mapped.featured).toBe(sampleVilla.featured);
      expect(mapped.minStay).toBe(sampleVilla.minStay);
      expect(mapped.distanceToBeach).toBe(sampleVilla.distanceToBeach);
    });
  });

  describe("getProperties", () => {
    it("serializes property types through the backend-supported filters contract", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: [], count: 0 });

      await propertiesService.getProperties({ type: "villa" });

      expect(apiClient.get).toHaveBeenCalledWith("/properties", {
        params: { filters: JSON.stringify({ types: ["villa"] }) },
      });
    });

    it("should return mapped properties and total when API returns object with data array and count", async () => {
      const mockApiResponse = {
        data: [
          {
            id: "prop-1",
            title: "Azure Haven",
            location: "Mahmutlar",
            price_per_night: 350,
            bedrooms: 3,
            bathrooms: 2,
            max_guests: 6,
            has_pool: true,
          },
        ],
        count: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockApiResponse);

      const result = await propertiesService.getProperties({ location: "Mahmutlar", page: 1, limit: 10 });
      expect(apiClient.get).toHaveBeenCalledWith("/properties", {
        params: expect.objectContaining({
          location: "Mahmutlar",
          page: 1,
          limit: 10,
        }),
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("prop-1");
      expect(result.data[0].title).toBe("Azure Haven");
      expect(result.data[0].pricePerNight).toBe(350);
      expect(result.total).toBe(1);
    });

    it("should return mapped properties when API returns a raw array", async () => {
      const mockRawArray = [
        {
          id: "prop-2",
          title: "Hillside Mansion",
          location: "Konaklı",
          price_per_night: 500,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockRawArray);

      const result = await getProperties();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("prop-2");
      expect(result.total).toBe(1);
    });

    it("should propagate ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Connection error", 500, "Internal Server Error")
      );

      await expect(getProperties()).rejects.toThrow(ApiError);
    });
  });

  describe("getProperty", () => {
    it("should return mapped property when API succeeds", async () => {
      const mockDetail = {
        id: "prop-99",
        title: "Presidential Villa",
        location: "Kargıcak",
        price_per_night: 1200,
        bedrooms: 7,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockDetail);

      const result = await propertiesService.getProperty("prop-99");
      expect(apiClient.get).toHaveBeenCalledWith("/properties/prop-99");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("prop-99");
      expect(result?.title).toBe("Presidential Villa");
      expect(result?.pricePerNight).toBe(1200);
    });

    it("should return null on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

      const result = await getProperty("non-existent-id");
      expect(result).toBeNull();
    });

    it("should propagate ApiError on 500", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Server error", 500, "Internal Server Error")
      );

      await expect(getProperty("err-id")).rejects.toThrow(ApiError);
    });
  });

  describe("getAvailableProperties", () => {
    it("should call POST /properties/available and return data", async () => {
      const mockAvailable = [
        {
          id: "prop-avail-1",
          title: "Available Villa",
          price_per_night: 300,
        },
      ];

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockAvailable);

      const result = await propertiesService.getAvailableProperties("2026-07-01", "2026-07-07");
      expect(apiClient.post).toHaveBeenCalledWith("/properties/available", {
        checkIn: "2026-07-01",
        checkOut: "2026-07-07",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("prop-avail-1");
    });

    it("should throw ApiError when POST /properties/available fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("API Error", 500, "Internal Server Error")
      );

      await expect(getAvailableProperties("2026-07-01", "2026-07-07")).rejects.toThrow(ApiError);
    });
  });

  describe("checkAvailability", () => {
    it("should return true when property has no conflicts on API", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce([
        { date: "2026-07-01", status: "available" },
        { date: "2026-07-02", status: "available" },
      ]);

      const available = await propertiesService.checkAvailability("villa-001", "2026-07-01", "2026-07-03");
      expect(apiClient.get).toHaveBeenCalledWith("/properties/villa-001/availability", {
        params: { startDate: "2026-07-01", endDate: "2026-07-03" },
      });
      expect(available).toBe(true);
    });

    it("should return false when API returns booked status or conflict", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce([
        { date: "2026-07-01", status: "booked" },
      ]);

      const available = await checkAvailability("villa-001", "2026-07-01", "2026-07-03");
      expect(available).toBe(false);
    });
  });

  describe("getPropertyTypes", () => {
    it("should return property types from API when available", async () => {
      const mockTypes = ["villa", "mansion", "penthouse"];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockTypes);

      const types = await propertiesService.getPropertyTypes();
      expect(apiClient.get).toHaveBeenCalledWith("/properties/types");
      expect(types).toEqual(mockTypes);
    });

    it("should return default types when API returns 404", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

      const types = await getPropertyTypes();
      expect(types).toContain("villa");
      expect(types).toContain("apartment");
      expect(types).toContain("penthouse");
    });
  });

});
