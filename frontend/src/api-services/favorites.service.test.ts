import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { favoritesService } from "./favorites.service";
import { apiClient } from "@/lib/api-client";

describe("favorites.service (Clean Architecture & Resilient Cloud Sync)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getFavorites", () => {
    it("should fetch favorites array via apiClient.get", async () => {
      const mockFavorites = ["biz-001", "biz-002", "hotel-123"];
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockFavorites);

      const result = await favoritesService.getFavorites();

      expect(result).toEqual(mockFavorites);
      expect(getSpy).toHaveBeenCalledWith("/favorites");
    });

    it("should handle { favorites: string[] } object response format", async () => {
      const mockPayload = { favorites: ["biz-001", "product-99"] };
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockPayload);

      const result = await favoritesService.getFavorites();

      expect(result).toEqual(["biz-001", "product-99"]);
    });

    it("should return empty array gracefully when API request fails or user is unauthenticated", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Unauthorized 401"));

      const result = await favoritesService.getFavorites();

      expect(result).toEqual([]);
    });
  });

  describe("addFavorite", () => {
    it("should post favorite itemId to /favorites and return success", async () => {
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });

      const result = await favoritesService.addFavorite("biz-001");

      expect(result).toEqual({ success: true });
      expect(postSpy).toHaveBeenCalledWith("/favorites", { item_id: "biz-001" });
    });

    it("should gracefully handle API failure and return success: false without crashing", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Network disconnect"));

      const result = await favoritesService.addFavorite("biz-001");

      expect(result).toEqual({ success: false });
    });
  });

  describe("removeFavorite", () => {
    it("should call delete on /favorites/:itemId and return success", async () => {
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      const result = await favoritesService.removeFavorite("biz-001");

      expect(result).toEqual({ success: true });
      expect(deleteSpy).toHaveBeenCalledWith("/favorites/biz-001");
    });

    it("should encode special characters in itemId properly", async () => {
      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      const result = await favoritesService.removeFavorite("item/with/slashes");

      expect(result).toEqual({ success: true });
      expect(deleteSpy).toHaveBeenCalledWith("/favorites/item%2Fwith%2Fslashes");
    });

    it("should gracefully handle API deletion failure and return success: false", async () => {
      vi.spyOn(apiClient, "delete").mockRejectedValueOnce(new Error("Server error 500"));

      const result = await favoritesService.removeFavorite("biz-001");

      expect(result).toEqual({ success: false });
    });
  });

  describe("syncFavorites", () => {
    it("should post local itemIds to /favorites/sync and return merged cloud list", async () => {
      const localIds = ["biz-001", "biz-002"];
      const mergedList = ["biz-001", "biz-002", "biz-003", "hotel-555"];
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce(mergedList);

      const result = await favoritesService.syncFavorites(localIds);

      expect(result).toEqual(mergedList);
      expect(postSpy).toHaveBeenCalledWith("/favorites/sync", { item_ids: localIds });
    });

    it("should handle { favorites: string[] } wrapped response from /favorites/sync", async () => {
      const localIds = ["biz-001"];
      const responsePayload = { favorites: ["biz-001", "biz-cloud-1"], success: true };
      vi.spyOn(apiClient, "post").mockResolvedValueOnce(responsePayload);

      const result = await favoritesService.syncFavorites(localIds);

      expect(result).toEqual(["biz-001", "biz-cloud-1"]);
    });

    it("should fallback gracefully to input localIds if sync API fails or is offline", async () => {
      const localIds = ["biz-offline-1", "biz-offline-2"];
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Network timeout"));

      const result = await favoritesService.syncFavorites(localIds);

      expect(result).toEqual(localIds);
    });
  });
});
