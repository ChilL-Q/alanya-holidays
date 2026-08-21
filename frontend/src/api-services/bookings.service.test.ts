import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  bookingsService,
  getUserBookings,
  cancelBooking,
  type BookingItem,
} from "./bookings.service";
import { apiClient } from "@/lib/api-client";

describe("bookings.service (Clean Architecture)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockBookings: BookingItem[] = [
    {
      id: "booking-101",
      user_id: "user-123",
      item_id: "villa-cleopatra-id",
      item_type: "property",
      check_in: "2026-09-01",
      check_out: "2026-09-08",
      total_price: 1400,
      guests: 4,
      status: "confirmed",
      payment_status: "paid",
      created_at: "2026-08-15T10:00:00.000Z",
      itemTitle: "Luxury Villa Cleopatra with Infinity Pool",
      property: {
        id: "villa-cleopatra-id",
        title: "Luxury Villa Cleopatra with Infinity Pool",
        images: ["https://example.com/villa.jpg"],
        price_per_night: 200,
        location: "Kargicak, Alanya",
        host_id: "host-456",
      },
      service: null,
      user: {
        id: "user-123",
        full_name: "John Doe",
        email: "test@example.com",
        phone: "+905551234567",
      },
    },
    {
      id: "booking-102",
      user_id: "user-123",
      item_id: "yacht-tour-id",
      item_type: "service",
      check_in: "2026-09-10",
      check_out: "2026-09-10",
      total_price: 350,
      guests: 2,
      status: "pending",
      payment_status: "unpaid",
      created_at: "2026-08-18T14:30:00.000Z",
      itemTitle: "Sunset Luxury Yacht Cruise",
      property: null,
      service: {
        id: "yacht-tour-id",
        title: "Sunset Luxury Yacht Cruise",
        images: ["https://example.com/yacht.jpg"],
        price: 350,
        type: "concierge",
        provider_id: "provider-789",
      },
      user: {
        id: "user-123",
        full_name: "John Doe",
        email: "test@example.com",
      },
    },
  ];

  describe("getUserBookings", () => {
    it("should fetch user bookings via GET /bookings/my-bookings", async () => {
      const getSpy = vi
        .spyOn(apiClient, "get")
        .mockResolvedValueOnce(mockBookings);

      const result = await bookingsService.getUserBookings();

      expect(getSpy).toHaveBeenCalledWith("/bookings/my-bookings");
      expect(result).toEqual(mockBookings);
    });

    it("should unwrap { data: BookingItem[] } if API returns wrapped response", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: mockBookings,
      });

      const result = await getUserBookings();

      expect(result).toEqual(mockBookings);
    });

    it("should return empty array if API returns null/empty or non-array", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(null);

      const result = await getUserBookings();

      expect(result).toEqual([]);
    });

    it("should return empty array and log warning on error", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new Error("Network failure")
      );

      const result = await bookingsService.getUserBookings();

      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("cancelBooking", () => {
    it("should dispatch DELETE /bookings/:id and return success", async () => {
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
        success: true,
        message: "Booking cancelled successfully",
      });

      const result = await bookingsService.cancelBooking("booking-101");

      expect(deleteSpy).toHaveBeenCalledWith("/bookings/booking-101");
      expect(result).toEqual({
        success: true,
        message: "Booking cancelled successfully",
      });
    });

    it("should handle default success message when backend does not supply one", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
        success: true,
      });

      const result = await cancelBooking("booking-102");

      expect(result.success).toBe(true);
      expect(result.message).toContain("cancelled");
    });

    it("should propagate error when cancellation fails on backend", async () => {
      vi.spyOn(apiClient, "delete").mockRejectedValueOnce(
        new Error("Booking cannot be cancelled in its current state")
      );

      await expect(
        bookingsService.cancelBooking("booking-101")
      ).rejects.toThrow("Booking cannot be cancelled in its current state");
    });
  });
});
