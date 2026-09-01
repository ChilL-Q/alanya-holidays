import { Injectable } from '@nestjs/common';
import {
  FavoritesRepository,
  FavoriteItemRecord,
} from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async addFavorite(
    itemId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await this.favoritesRepository.upsertFavorite(itemId, userId);
    return { success: true };
  }

  async removeFavorite(
    itemId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await this.favoritesRepository.deleteFavorite(itemId, userId);
    return { success: true };
  }

  async getFavorites(userId: string): Promise<string[]> {
    const data = await this.favoritesRepository.getFavorites(userId);
    return data.map((f: FavoriteItemRecord) => f.item_id);
  }

  async syncFavorites(itemIds: string[], userId: string): Promise<string[]> {
    if (itemIds && itemIds.length > 0) {
      await this.favoritesRepository.upsertFavorites(itemIds, userId);
    }
    return this.getFavorites(userId);
  }
}
