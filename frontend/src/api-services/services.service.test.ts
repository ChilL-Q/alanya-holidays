import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  servicesService,
  getServices,
  getProperties,
  getPropertyById,
  getServiceById,
  createBooking,
  submitConciergeEnquiry,
  createOrder,
  luxuryExperiences,
} from "./services.service";
import { apiClient, ApiError } from "@/lib/api-client";

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

    it("should throw ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Network failure", 500, "Internal Server Error")
      );

      await expect(getServices("yacht-charters")).rejects.toThrow(ApiError);
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

    it("should throw ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("API offline", 500, "Internal Server Error")
      );

      await expect(getProperties()).rejects.toThrow(ApiError);
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

    it("should return null on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

      const result = await getPropertyById("missing-id");
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

    it("should return null on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

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
  });

  describe("createBooking", () => {
    it("should call POST /bookings and return booking ID", async () => {
      const mockResponse = { id: "bk-uuid-12345", data: "bk-uuid-12345" };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockResponse);

      const payload = {
        item_id: "00000000-0000-0000-0000-000000000001",
        check_in: "2026-09-01",
        check_out: "2026-09-05",
        total_price: 1200,
        guests: 4,
        payment_method: "card",
        item_type: "property",
      };

      const result = await servicesService.createBooking(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/bookings", {
        item_id: "00000000-0000-0000-0000-000000000001",
        check_in: "2026-09-01",
        check_out: "2026-09-05",
        guests: 4,
        payment_method: "card",
        item_type: "property",
        message: undefined,
      });
      expect(result.id).toBe("bk-uuid-12345");
      expect(result.success).toBe(true);
    });

    it("should throw ApiError on booking API failure", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("Server error", 500, "Internal Server Error")
      );

      const payload = {
        item_id: "villa-001",
        check_in: "2026-09-01",
        check_out: "2026-09-05",
        total_price: 800,
        guests: 2,
      };

      await expect(createBooking(payload)).rejects.toThrow(ApiError);
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

    it("should throw ApiError when /enquiries endpoint fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("Service unavailable", 500, "Internal Server Error")
      );

      const payload = {
        name: "John Doe",
        email: "john@example.com",
        experience_type: "Wine Tasting",
      };

      await expect(submitConciergeEnquiry(payload)).rejects.toThrow(ApiError);
    });
  });

  describe("createOrder", () => {
    it("should call API and return order ID", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ id: 1042 });

      const result = await createOrder({
        recipientName: "Jane Doe",
        recipientEmail: "jane@example.com",
        recipientPhone: "+905551112233",
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

    it("should propagate error on API error without fake fallback", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Order API failed"));

      await expect(
        createOrder({
          recipientName: "Jane Doe",
          recipientEmail: "jane@example.com",
          recipientPhone: "+905551112233",
          senderName: "John Doe",
          senderEmail: "john@example.com",
          subtotal: 100,
          items: [],
        }),
      ).rejects.toThrow("Order API failed");
    });
  });

  describe("Convenience Getters", () => {
    it("should return luxury experiences list", () => {
      const experiences = servicesService.getLuxuryExperiences();
      expect(experiences).toEqual(luxuryExperiences);
      expect(experiences.length).toBeGreaterThanOrEqual(10);
    });
  });
});
