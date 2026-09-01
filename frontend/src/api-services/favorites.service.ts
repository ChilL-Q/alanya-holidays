import { apiClient, ApiError } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export interface FavoriteActionResponse {
  success: boolean;
  message?: string;
}

export interface SyncFavoritesPayload {
  item_ids: string[];
}

export interface SyncFavoritesResponse {
  success?: boolean;
  favorites?: string[];
}

export class FavoritesService {
  /**
   * Fetches the authenticated user's saved favorite item IDs from the cloud API.
   * Gracefully falls back to empty array if unauthenticated or offline.
   */
  async getFavorites(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[] | { favorites: string[] }>("/favorites");
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.favorites)) {
        return response.favorites;
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        return [];
      }
      logger.warn("Failed to fetch favorites from cloud API:", err);
    }
    return [];
  }

  /**
   * Adds an item to the user's cloud favorites.
   */
  async addFavorite(itemId: string): Promise<FavoriteActionResponse> {
    try {
      const response = await apiClient.post<FavoriteActionResponse>("/favorites", {
        item_id: itemId,
      });
      return response || { success: true };
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        return { success: true };
      }
      logger.warn(`Failed to add favorite ${itemId} to cloud:`, err);
      return { success: false };
    }
  }

  /**
   * Removes an item from the user's cloud favorites.
   */
  async removeFavorite(itemId: string): Promise<FavoriteActionResponse> {
    try {
      const response = await apiClient.delete<FavoriteActionResponse>(
        `/favorites/${encodeURIComponent(itemId)}`
      );
      return response || { success: true };
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        return { success: true };
      }
      logger.warn(`Failed to remove favorite ${itemId} from cloud:`, err);
      return { success: false };
    }
  }

  /**
   * Bulk synchronizes / merges local favorite IDs with the cloud database.
   * Returns the merged list of favorite item IDs.
   */
  async syncFavorites(itemIds: string[]): Promise<string[]> {
    try {
      const response = await apiClient.post<string[] | SyncFavoritesResponse>(
        "/favorites/sync",
        { item_ids: itemIds }
      );
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.favorites)) {
        return response.favorites;
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        return itemIds;
      }
      logger.warn("Failed to sync favorites with cloud API:", err);
    }
    // Fallback to locally provided items if network or unauthenticated
    return itemIds;
  }
}

export const favoritesService = new FavoritesService();
