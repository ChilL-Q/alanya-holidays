import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, act, screen } from "@testing-library/react";
import { usersService } from "./users.service";
import { bookingsService } from "./bookings.service";
import { apiClient, ApiError } from "@/lib/api-client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        signInWithOAuth: vi.fn(),
        updateUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      })),
    },
  };
});

describe("Milestone 2 Adversarial Stress Tests (Empirical Challenger)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* =========================================================================
   * 1. usersService Adversarial Challenge
   * ========================================================================= */
  describe("usersService — Fault Injection & Malformed Payloads", () => {
    it("should propagate 401 Unauthorized error on getUserProfile", async () => {
      const apiError401 = new ApiError("Unauthorized", 401, "Unauthorized", null, "/users/usr_123");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(apiError401);

      await expect(usersService.getUserProfile("usr_123")).rejects.toThrow("Unauthorized");
    });

    it("should propagate 404 Not Found error on getUserProfile", async () => {
      const apiError404 = new ApiError("User not found", 404, "Not Found", { message: "User not found" }, "/users/non_existing");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(apiError404);

      await expect(usersService.getUserProfile("non_existing")).rejects.toThrow("User not found");
    });

    it("should propagate 500 Internal Server Error on getUserProfile", async () => {
      const apiError500 = new ApiError("Internal server error", 500, "Internal Server Error", null, "/users/usr_123");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(apiError500);

      await expect(usersService.getUserProfile("usr_123")).rejects.toThrow("Internal server error");
    });

    it("should propagate 401 Unauthorized error on updateUserProfile", async () => {
      const apiError401 = new ApiError("Session expired", 401, "Unauthorized", null, "/users/usr_123");
      vi.spyOn(apiClient, "put").mockRejectedValueOnce(apiError401);

      await expect(
        usersService.updateUserProfile("usr_123", { full_name: "Hacker" })
      ).rejects.toThrow("Session expired");
    });

    it("should propagate 500 Server Error on updateUserProfile", async () => {
      const apiError500 = new ApiError("Database connection lost", 500, "Internal Server Error", null, "/users/usr_123");
      vi.spyOn(apiClient, "put").mockRejectedValueOnce(apiError500);

      await expect(
        usersService.updateUserProfile("usr_123", { full_name: "Hacker" })
      ).rejects.toThrow("Database connection lost");
    });

    it("should properly URL-encode special characters in userId to prevent path traversal", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({ id: "safe" });
      const putSpy = vi.spyOn(apiClient, "put").mockResolvedValueOnce({ id: "safe" });

      await usersService.getUserProfile("usr/../../admin?role=super#fragment");
      expect(getSpy).toHaveBeenCalledWith("/users/usr%2F..%2F..%2Fadmin%3Frole%3Dsuper%23fragment");

      await usersService.updateUserProfile("usr/../../admin", { full_name: "Test" });
      expect(putSpy).toHaveBeenCalledWith("/users/usr%2F..%2F..%2Fadmin", { full_name: "Test" });
    });

    it("should safely handle malformed response payload (null data wrapper)", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ success: true, data: null });

      const result = await usersService.getUserProfile("usr_123");
      expect(result).toEqual({ success: true, data: null });
    });

    it("should safely handle primitive/empty response payloads without crashing", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({});
      const resObj = await usersService.getUserProfile("usr_123");
      expect(resObj).toEqual({});

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(null);
      const resNull = await usersService.getUserProfile("usr_123");
      expect(resNull).toBeNull();
    });
  });

  /* =========================================================================
   * 2. bookingsService Adversarial Challenge
   * ========================================================================= */
  describe("bookingsService — Fault Injection & Malformed Payloads", () => {
    it("should gracefully recover with empty array on 401 Unauthorized for getUserBookings", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const apiError401 = new ApiError("Unauthorized", 401, "Unauthorized", null, "/bookings/my-bookings");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(apiError401);

      const result = await bookingsService.getUserBookings();
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it("should gracefully recover with empty array on 404 Not Found for getUserBookings", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const apiError404 = new ApiError("Not Found", 404, "Not Found", null, "/bookings/my-bookings");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(apiError404);

      const result = await bookingsService.getUserBookings();
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it("should gracefully recover with empty array on 500 Server Error for getUserBookings", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const apiError500 = new ApiError("DB Deadlock", 500, "Internal Server Error", null, "/bookings/my-bookings");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(apiError500);

      const result = await bookingsService.getUserBookings();
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it("should gracefully recover with empty array on malformed response payload (non-array data)", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: "INVALID_STRING_NOT_ARRAY" });
      const result1 = await bookingsService.getUserBookings();
      expect(result1).toEqual([]);

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: { message: "error object" } });
      const result2 = await bookingsService.getUserBookings();
      expect(result2).toEqual([]);

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(12345);
      const result3 = await bookingsService.getUserBookings();
      expect(result3).toEqual([]);
    });

    it("should propagate errors when cancelBooking encounters 401, 404, or 500", async () => {
      const apiError404 = new ApiError("Booking not found", 404, "Not Found", null, "/bookings/b_999");
      vi.spyOn(apiClient, "delete").mockRejectedValueOnce(apiError404);

      await expect(bookingsService.cancelBooking("b_999")).rejects.toThrow("Booking not found");

      const apiError500 = new ApiError("Failed to refund stripe payment", 500, "Server Error", null, "/bookings/b_999");
      vi.spyOn(apiClient, "delete").mockRejectedValueOnce(apiError500);

      await expect(bookingsService.cancelBooking("b_999")).rejects.toThrow("Failed to refund stripe payment");
    });

    it("should properly URL-encode bookingId in cancelBooking", async () => {
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
        success: true,
        message: "Cancelled",
      });

      await bookingsService.cancelBooking("booking/123 with spaces#anchor");
      expect(deleteSpy).toHaveBeenCalledWith("/bookings/booking%2F123%20with%20spaces%23anchor");
    });

    it("should handle partial or missing message in cancelBooking response", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
        success: false,
      });

      const res = await bookingsService.cancelBooking("b_123");
      expect(res.success).toBe(false);
      expect(res.message).toBe("Booking cancelled successfully");
    });
  });

  /* =========================================================================
   * 3. AuthContext.updatePassword Adversarial Challenge
   * ========================================================================= */
  describe("AuthContext.updatePassword — Edge Cases & Fault Injection", () => {
    let capturedAuth: ReturnType<typeof useAuth> | null = null;

    const TestHarness: React.FC = () => {
      capturedAuth = useAuth();
      return <div data-testid="auth-loaded">Ready</div>;
    };

    beforeEach(async () => {
      capturedAuth = null;
      (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: "usr_active", email: "user@example.com" },
          },
        },
        error: null,
      });

      render(
        <AuthProvider>
          <TestHarness />
        </AuthProvider>
      );

      await screen.findByTestId("auth-loaded");
    });

    it("should handle empty password input and return Supabase validation error", async () => {
      (supabase.auth.updateUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Password should be at least 6 characters" },
      });

      let res: { error: Error | null } | undefined;
      await act(async () => {
        res = await capturedAuth!.updatePassword("");
      });

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "" });
      expect(res?.error).toBeInstanceOf(Error);
      expect(res?.error?.message).toBe("Password should be at least 6 characters");
    });

    it("should handle weak password (e.g. '12345') and return Supabase validation error", async () => {
      (supabase.auth.updateUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Password should be at least 6 characters" },
      });

      let res: { error: Error | null } | undefined;
      await act(async () => {
        res = await capturedAuth!.updatePassword("12345");
      });

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "12345" });
      expect(res?.error).toBeInstanceOf(Error);
      expect(res?.error?.message).toBe("Password should be at least 6 characters");
    });

    it("should catch network exceptions during updateUser without crashing component tree", async () => {
      (supabase.auth.updateUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network request failed: connection refused")
      );

      let res: { error: Error | null } | undefined;
      await act(async () => {
        res = await capturedAuth!.updatePassword("ValidPassword123!");
      });

      expect(res?.error).toBeInstanceOf(Error);
      expect(res?.error?.message).toBe("Network request failed: connection refused");
    });

    it("should handle non-Error thrown values gracefully", async () => {
      (supabase.auth.updateUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        "String error rejected by runtime"
      );

      let res: { error: Error | null } | undefined;
      await act(async () => {
        res = await capturedAuth!.updatePassword("ValidPassword123!");
      });

      expect(res?.error).toBeInstanceOf(Error);
      expect(res?.error?.message).toBe("Failed to update password");
    });

    it("should successfully return error: null when password update succeeds", async () => {
      (supabase.auth.updateUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { user: { id: "usr_active" } },
        error: null,
      });

      let res: { error: Error | null } | undefined;
      await act(async () => {
        res = await capturedAuth!.updatePassword("StrongNewPassword2026$#");
      });

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "StrongNewPassword2026$#",
      });
      expect(res?.error).toBeNull();
    });

    it("should handle extreme password lengths (stress test 10k characters)", async () => {
      const hugePassword = "A".repeat(10000);
      (supabase.auth.updateUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { user: { id: "usr_active" } },
        error: null,
      });

      let res: { error: Error | null } | undefined;
      await act(async () => {
        res = await capturedAuth!.updatePassword(hugePassword);
      });

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: hugePassword,
      });
      expect(res?.error).toBeNull();
    });
  });
});
