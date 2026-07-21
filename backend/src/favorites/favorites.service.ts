import { Injectable } from '@nestjs/common';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async addFavorite(itemId: string, userId: string) {
    await this.favoritesRepository.upsertFavorite(itemId, userId);
    return { success: true };
  }

  async removeFavorite(itemId: string, userId: string) {
    await this.favoritesRepository.deleteFavorite(itemId, userId);
    return { success: true };
  }

  async getFavorites(userId: string) {
    const data = await this.favoritesRepository.getFavorites(userId);
    return data.map((f: any) => f.item_id);
  }
}
