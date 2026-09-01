import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  usersService,
  getUserProfile,
  updateUserProfile,
  getPublicProfile,
  type UserProfile,
  type UpdateUserProfilePayload,
} from "./users.service";
import { apiClient } from "@/lib/api-client";

describe("users.service (Clean Architecture)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUserProfile: UserProfile = {
    id: "user-123",
    email: "test@example.com",
    full_name: "John Doe",
    avatar_url: "https://example.com/avatar.jpg",
    phone: "+905551234567",
    company_name: "Alanya Holidays LLC",
    bio: "Passionate traveler & villa host in Alanya.",
    role: "host",
    social_links: {
      instagram: "https://instagram.com/johndoe",
      website: "https://johndoe.com",
    },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-08-19T00:00:00.000Z",
  };

  describe("getUserProfile", () => {
    it("should fetch user profile by ID via GET /users/:id", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockUserProfile);

      const result = await usersService.getUserProfile("user-123");

      expect(getSpy).toHaveBeenCalledWith("/users/user-123");
      expect(result).toEqual(mockUserProfile);
    });

    it("should unwrap { data: UserProfile } if backend returns wrapped object", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        success: true,
        data: mockUserProfile,
      });

      const result = await getUserProfile("user-123");

      expect(result).toEqual(mockUserProfile);
    });

    it("should propagate error when user profile is not found or API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("User not found"));

      await expect(usersService.getUserProfile("non-existent-id")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("updateUserProfile", () => {
    const payload: UpdateUserProfilePayload = {
      full_name: "Jane Doe",
      phone: "+905559876543",
      bio: "Updated bio description",
      company_name: "Alanya Elite Villas",
      social_links: {
        instagram: "https://instagram.com/janedoe",
      },
    };

    it("should send PUT /users/:id with updates payload", async () => {
      const putSpy = vi.spyOn(apiClient, "put").mockResolvedValueOnce({
        success: true,
        data: {
          ...mockUserProfile,
          ...payload,
        },
      });

      const result = await usersService.updateUserProfile("user-123", payload);

      expect(putSpy).toHaveBeenCalledWith("/users/user-123", payload);
      expect(result).toEqual(
        expect.objectContaining({
          id: "user-123",
          full_name: "Jane Doe",
          company_name: "Alanya Elite Villas",
          bio: "Updated bio description",
        })
      );
    });

    it("should handle { success: true } response by returning success object or updated profile", async () => {
      vi.spyOn(apiClient, "put").mockResolvedValueOnce({
        success: true,
      });

      const result = await updateUserProfile("user-123", { full_name: "Jane Doe" });

      expect(result).toBeDefined();
    });

    it("should propagate error when update fails", async () => {
      vi.spyOn(apiClient, "put").mockRejectedValueOnce(
        new Error("Unauthorized to update profile")
      );

      await expect(
        usersService.updateUserProfile("user-123", payload)
      ).rejects.toThrow("Unauthorized to update profile");
    });
  });

  describe("getPublicProfile", () => {
    it("should retrieve public profile using getUserProfile endpoint", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockUserProfile);

      const result = await getPublicProfile("user-123");

      expect(getSpy).toHaveBeenCalledWith("/users/user-123");
      expect(result).toEqual(mockUserProfile);
    });
  });
});
