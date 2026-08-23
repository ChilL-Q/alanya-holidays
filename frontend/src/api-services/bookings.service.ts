import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export interface BookingPropertySummary {
  id: string;
  title: string;
  images?: string[] | null;
  price_per_night?: number | null;
  location?: string | null;
  host_id?: string | null;
}

export interface BookingServiceSummary {
  id: string;
  title: string;
  images?: string[] | null;
  price?: number | null;
  type?: string | null;
  provider_id?: string | null;
}

export interface BookingUserSummary {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
}

export interface BookingItem {
  id: string;
  user_id?: string | null;
  item_id?: string | null;
  item_type?: "property" | "service" | string | null;
  check_in: string;
  check_out: string;
  total_price: number;
  guests?: number | null;
  status: "pending" | "confirmed" | "cancelled" | "completed" | string;
  payment_status?: string | null;
  stripe_session_id?: string | null;
  payment_intent_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  itemTitle?: string;
  property?: BookingPropertySummary | null;
  service?: BookingServiceSummary | null;
  user?: BookingUserSummary | null;
  [key: string]: unknown;
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
}

export class BookingsService {
  /**
   * Retrieves all bookings for the authenticated user (properties & concierge services).
   * Dispatches GET /bookings/my-bookings via apiClient.
   */
  async getUserBookings(): Promise<BookingItem[]> {
    try {
      const response = await apiClient.get<
        BookingItem[] | { data: BookingItem[] }
      >("/bookings/my-bookings");

      if (Array.isArray(response)) {
        return response;
      }

      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        return response.data;
      }

      return [];
    } catch (err: unknown) {
      logger.warn("Failed to fetch user bookings from API:", err);
      return [];
    }
  }

  /**
   * Cancels a pending or confirmed booking by ID.
   * Dispatches DELETE /bookings/:id via apiClient.
   */
  async cancelBooking(bookingId: string): Promise<CancelBookingResponse> {
    const result = await apiClient.delete<{
      success?: boolean;
      message?: string;
    }>(`/bookings/${encodeURIComponent(bookingId)}`);

    return {
      success: result?.success ?? true,
      message: result?.message || "Booking cancelled successfully",
    };
  }
}

export const bookingsService = new BookingsService();

export const getUserBookings = () => bookingsService.getUserBookings();

export const cancelBooking = (bookingId: string) =>
  bookingsService.cancelBooking(bookingId);
