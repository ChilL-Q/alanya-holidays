import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  propertiesService,
  getProperties,
  getProperty,
  getAvailableProperties,
  checkAvailability,
  getPropertyTypes,
  createBooking,
  mapBackendPropertyToPropertyItem,
  mapVillaToPropertyItem,
} from "./properties.service";
import { apiClient } from "@/lib/api-client";
import { villas as mockVillas } from "@/mocks/villas";

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
      expect(mapped.title).toBe("Property");
      expect(mapped.pricePerNight).toBe(0);
      expect(mapped.currency).toBe("EUR");
      expect(mapped.maxGuests).toBe(1);
      expect(mapped.hasPool).toBe(false);
      expect(mapped.hasSeaView).toBe(false);
      expect(mapped.images).toEqual([]);
      expect(mapped.amenities).toEqual([]);
      expect(mapped.rating).toBe(5.0);
    });
  });

  describe("mapVillaToPropertyItem", () => {
    it("should map mock villa to PropertyItem format", () => {
      const sample = mockVillas[0];
      const mapped = mapVillaToPropertyItem(sample);

      expect(mapped.id).toBe(sample.id);
      expect(mapped.title).toBe(sample.name);
      expect(mapped.name).toBe(sample.name);
      expect(mapped.location).toBe(sample.location);
      expect(mapped.pricePerNight).toBe(sample.pricePerNight);
      expect(mapped.bedrooms).toBe(sample.bedrooms);
      expect(mapped.bathrooms).toBe(sample.bathrooms);
      expect(mapped.maxGuests).toBe(sample.maxGuests);
      expect(mapped.hasPool).toBe(sample.hasPool);
      expect(mapped.hasSeaView).toBe(sample.hasSeaView);
      expect(mapped.image).toBe(sample.image);
      expect(mapped.amenities).toEqual(sample.amenities);
      expect(mapped.rating).toBe(sample.rating);
      expect(mapped.reviewCount).toBe(sample.reviewCount);
      expect(mapped.featured).toBe(sample.featured);
      expect(mapped.minStay).toBe(sample.minStay);
      expect(mapped.distanceToBeach).toBe(sample.distanceToBeach);
    });
  });

  describe("getProperties", () => {
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

    it("should fall back to mock villas when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Connection error"));

      const result = await getProperties();
      expect(result.data).toHaveLength(mockVillas.length);
      expect(result.total).toBe(mockVillas.length);
      expect(result.data[0].id).toBe(mockVillas[0].id);
    });

    it("should filter mock fallback by location, price, bedrooms, and amenities", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API offline"));

      const result = await getProperties({
        location: "Mahmutlar",
        minPrice: 400,
        bedrooms: 4,
        hasPool: true,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every((p) => p.location?.includes("Mahmutlar"))).toBe(true);
      expect(result.data.every((p) => (p.pricePerNight ?? 0) >= 400)).toBe(true);
      expect(result.data.every((p) => (p.bedrooms ?? 0) >= 4)).toBe(true);
      expect(result.data.every((p) => p.hasPool === true)).toBe(true);
      expect(result.total).toBe(result.data.length);
    });

    it("should support pagination in fallback mode", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API offline"));

      const result = await getProperties({ page: 2, limit: 3 });
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(mockVillas.length);
      expect(result.data[0].id).toBe(mockVillas[3].id);
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

    it("should fall back to mock villa by ID when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getProperty("villa-001");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("villa-001");
      expect(result?.title).toBe(mockVillas[0].name);
    });

    it("should return null if not found in mock fallback", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getProperty("non-existent-id");
      expect(result).toBeNull();
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

    it("should fall back to mock villas when POST /properties/available fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("API Error"));

      const result = await getAvailableProperties("2026-07-01", "2026-07-07");
      expect(result).toHaveLength(mockVillas.length);
      expect(result[0].id).toBe(mockVillas[0].id);
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

    it("should try /bookings/conflict when /properties/:id/availability fails and return conflict status", async () => {
      vi.spyOn(apiClient, "get")
        .mockRejectedValueOnce(new Error("404 Not Found"))
        .mockResolvedValueOnce({ has_conflict: true });

      const available = await checkAvailability("villa-001", "2026-07-01", "2026-07-03");
      expect(available).toBe(false);
    });

    it("should gracefully default to true when all availability APIs fail", async () => {
      vi.spyOn(apiClient, "get")
        .mockRejectedValueOnce(new Error("Failed 1"))
        .mockRejectedValueOnce(new Error("Failed 2"));

      const available = await checkAvailability("villa-001", "2026-07-01", "2026-07-03");
      expect(available).toBe(true);
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

    it("should fall back to default types list when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network failure"));

      const types = await getPropertyTypes();
      expect(types).toContain("villa");
      expect(types).toContain("apartment");
      expect(types).toContain("penthouse");
    });
  });

  describe("createBooking", () => {
    it("should call POST /bookings and return bookingId on success", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        id: "bk-999",
        data: "bk-999",
        success: true,
      });

      const payload = {
        propertyId: "villa-001",
        checkIn: "2026-08-01",
        checkOut: "2026-08-07",
        totalPrice: 2520,
        guests: 4,
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+905551234567",
      };

      const result = await propertiesService.createBooking(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/bookings", expect.objectContaining({
        item_id: "villa-001",
        check_in: "2026-08-01",
        check_out: "2026-08-07",
        total_price: 2520,
        guests: 4,
        item_type: "property",
      }));
      expect(result.success).toBe(true);
      expect(result.bookingId).toBe("bk-999");
    });

    it("should generate a fallback booking confirmation when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Booking service offline"));

      const payload = {
        propertyId: "villa-002",
        checkIn: "2026-09-01",
        checkOut: "2026-09-05",
        totalPrice: 1120,
      };

      const result = await createBooking(payload);
      expect(result.success).toBe(true);
      expect(result.bookingId).toMatch(/^bk-\d+/);
    });
  });
});
