import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  servicesService,
  getServices,
  getProperties,
  getPropertyById,
  getServiceById,
  checkAvailability,
  createBooking,
  submitConciergeEnquiry,
  createOrder,
  luxuryExperiences,
} from "./services.service";
import { apiClient, ApiError } from "@/lib/api-client";
import { villas as mockVillas } from "@/mocks/villas";
import { yachts as mockYachts } from "@/mocks/yachts";
import { helicopterTours as mockHelicopterTours } from "@/mocks/helicopter-tours";
import { wineTastings as mockWineTastings } from "@/mocks/wine-tastings";

describe("services.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getServices", () => {
    it("should return data from API when successful", async () => {
      const mockBackendServices = [
        {
          id: "srv-001",
          title: "VIP Yacht Trip",
          type: "yacht",
          price: 900,
          currency: "EUR",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBackendServices);

      const result = await servicesService.getServices("yacht", { limit: 10 });
      expect(apiClient.get).toHaveBeenCalledWith("/services", {
        params: { type: "yacht", limit: 10 },
      });
      expect(result).toEqual(mockBackendServices);
    });

    it("should handle { data: [...] } format from API", async () => {
      const mockBackendResponse = {
        data: [
          {
            id: "srv-002",
            title: "Helicopter Flight",
            type: "helicopter",
            price: 250,
          },
        ],
        count: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBackendResponse);

      const result = await getServices("helicopter");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("srv-002");
    });

    it("should gracefully fall back to yacht showcase items when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network failure"));

      const result = await getServices("yacht-charters");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockYachts[0].name);
      expect(result[0].type).toBe("yacht");
    });

    it("should gracefully fall back to helicopter tours when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network failure"));

      const result = await getServices("helicopter-tours");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockHelicopterTours[0].name);
      expect(result[0].type).toBe("helicopter");
    });

    it("should gracefully fall back to wine tastings when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network failure"));

      const result = await getServices("wine-tastings");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockWineTastings[0].name);
    });

    it("should fall back to combined showcase items when category is not specified", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network failure"));

      const result = await getServices();
      expect(result.length).toBeGreaterThan(20);
    });
  });

  describe("getProperties", () => {
    it("should return properties from API when successful", async () => {
      const mockProps = [
        {
          id: "prop-1",
          title: "Sea Castle Villa",
          price_per_night: 500,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProps);

      const result = await servicesService.getProperties({ location: "Alanya Center" });
      expect(apiClient.get).toHaveBeenCalledWith("/properties", {
        params: { filters: JSON.stringify({ location: "Alanya Center" }) },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("prop-1");
      expect(result[0].title).toBe("Sea Castle Villa");
      expect(result[0].pricePerNight).toBe(500);
    });

    it("should gracefully fall back to mock villas when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API offline"));

      const result = await getProperties();
      expect(result.length).toBe(mockVillas.length);
      expect(result[0].title).toBe(mockVillas[0].name);
      expect(result[0].price_per_night).toBe(mockVillas[0].pricePerNight);
    });
  });

  describe("getPropertyById", () => {
    it("should return property from API when found", async () => {
      const mockProp = {
        id: "prop-123",
        title: "Sunset Villa",
        price_per_night: 400,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProp);

      const result = await servicesService.getPropertyById("prop-123");
      expect(apiClient.get).toHaveBeenCalledWith("/properties/prop-123");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("prop-123");
      expect(result?.title).toBe("Sunset Villa");
      expect(result?.pricePerNight).toBe(400);
    });

    it("should fall back to mock villas matching id when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getPropertyById(mockVillas[0].id);
      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockVillas[0].name);
    });

    it("should return null when property is not in API or mock data", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getPropertyById("non-existent-id-999");
      expect(result).toBeNull();
    });
  });

  describe("getServiceById", () => {
    it("should return service from API when found", async () => {
      const mockService = {
        id: "srv-555",
        title: "Exclusive Private Flight",
        type: "jet",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockService);

      const result = await servicesService.getServiceById("srv-555");
      expect(apiClient.get).toHaveBeenCalledWith("/services/srv-555");
      expect(result).toEqual(mockService);
    });

    it("should fall back to showcase items matching id when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getServiceById(mockYachts[0].id);
      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockYachts[0].name);
    });

    it("should return null when service is not in API or mock data", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getServiceById("non-existent-service-999");
      expect(result).toBeNull();
    });
  });

  describe("checkAvailability", () => {
    it("should call /bookings/check-conflict and return result", async () => {
      const mockConflictResult = {
        has_conflict: false,
        message: "Available",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockConflictResult);

      const result = await servicesService.checkAvailability(
        "villa-001",
        "property",
        "2026-09-01",
        "2026-09-07"
      );

      expect(apiClient.get).toHaveBeenCalledWith("/bookings/check-conflict", {
        params: {
          itemId: "villa-001",
          itemType: "property",
          checkIn: "2026-09-01",
          checkOut: "2026-09-07",
        },
      });
      expect(result).toEqual(mockConflictResult);
    });

    it("should fall back to /bookings/conflict on 404", async () => {
      const mockConflictResult = {
        has_conflict: true,
        message: "Dates are already booked",
      };

      vi.spyOn(apiClient, "get")
        .mockRejectedValueOnce(new ApiError("Not Found", 404, "NotFound", null, "/bookings/check-conflict"))
        .mockResolvedValueOnce(mockConflictResult);

      const result = await checkAvailability(
        "villa-002",
        "property",
        "2026-09-01",
        "2026-09-05"
      );

      expect(result).toEqual(mockConflictResult);
    });

    it("should return available when API call fails completely", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network down"));

      const result = await checkAvailability(
        "villa-001",
        "property",
        "2026-09-01",
        "2026-09-07"
      );

      expect(result).toEqual({ has_conflict: false, message: "Available" });
    });
  });

  describe("createBooking", () => {
    it("should call POST /bookings and return booking ID", async () => {
      const mockResponse = { id: "bk-uuid-12345", data: "bk-uuid-12345" };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockResponse);

      const payload = {
        item_id: "00000000-0000-0000-0000-000000000001",
        user_id: "00000000-0000-0000-0000-000000000002",
        check_in: "2026-09-01",
        check_out: "2026-09-05",
        total_price: 1200,
        guests: 4,
        payment_method: "card",
        item_type: "property",
      };

      const result = await servicesService.createBooking(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/bookings", payload);
      expect(result.id).toBe("bk-uuid-12345");
      expect(result.success).toBe(true);
    });

    it("should return fallback booking confirmation if API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Server error"));

      const payload = {
        item_id: "villa-001",
        user_id: "user-001",
        check_in: "2026-09-01",
        check_out: "2026-09-05",
        total_price: 800,
        guests: 2,
      };

      const result = await createBooking(payload);
      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^bk-/);
    });
  });

  describe("submitConciergeEnquiry", () => {
    it("should submit enquiry via /enquiries endpoint", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, id: "enq-999" });

      const result = await submitConciergeEnquiry({
        name: "Elena Rostova",
        email: "elena@example.com",
        experience_type: "Yacht Charter",
        item_name: "Aegean Queen",
        preferred_contact: "whatsapp",
        phone: "5551234567",
        notes: "Anniversary celebration",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/enquiries",
        expect.objectContaining({
          name: "Elena Rostova",
          email: "elena@example.com",
          enquiry_type: "Yacht Charter",
          service_type: "Aegean Queen",
          preferred_contact: "whatsapp",
        })
      );
      expect(result.success).toBe(true);
      expect(result.id).toBe("enq-999");
    });

    it("should succeed gracefully when /enquiries endpoint fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Service unavailable"));

      const result = await submitConciergeEnquiry({
        name: "John Doe",
        email: "john@example.com",
        experience_type: "Wine Tasting",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });
  });

  describe("createOrder", () => {
    it("should call API and return order ID", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ id: 1042 });

      const result = await createOrder({
        recipientName: "Jane Doe",
        recipientEmail: "jane@example.com",
        senderName: "John Doe",
        senderEmail: "john@example.com",
        subtotal: 150,
        items: [
          {
            productName: "Turkish Coffee Set",
            quantity: 1,
            price: "€150",
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toBe(1042);
    });

    it("should generate fallback order ID on API error", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Order API failed"));

      const result = await createOrder({
        recipientName: "Jane Doe",
        recipientEmail: "jane@example.com",
        senderName: "John Doe",
        senderEmail: "john@example.com",
        subtotal: 100,
        items: [],
      });

      expect(result.success).toBe(true);
      expect(typeof result.orderId === "number" || typeof result.orderId === "string").toBe(true);
    });
  });

  describe("Convenience Getters", () => {
    it("should return villas filtered by location", async () => {
      const allVillas = await servicesService.getVillas();
      expect(allVillas.length).toBe(mockVillas.length);

      const mahmutlarVillas = await servicesService.getVillas("Mahmutlar");
      expect(mahmutlarVillas.every((v) => v.location === "Mahmutlar")).toBe(true);
    });

    it("should return yachts filtered by type", async () => {
      const gulets = await servicesService.getYachts("Gulet");
      expect(gulets.every((y) => y.type === "Gulet")).toBe(true);
    });

    it("should return luxury experiences list", () => {
      const experiences = servicesService.getLuxuryExperiences();
      expect(experiences).toEqual(luxuryExperiences);
      expect(experiences.length).toBeGreaterThanOrEqual(10);
    });
  });
});
