import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface FavoriteItemRecord {
  item_id: string;
}

@Injectable()
export class FavoritesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async upsertFavorite(itemId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('favorites')
      .upsert([{ user_id: userId, item_id: itemId }], {
        onConflict: 'user_id,item_id',
        ignoreDuplicates: true,
      });

    if (error) throw new Error(error.message);
  }

  async upsertFavorites(itemIds: string[], userId: string): Promise<void> {
    if (!itemIds.length) return;
    const records = itemIds.map((itemId) => ({
      user_id: userId,
      item_id: itemId,
    }));
    const { error } = await this.client.from('favorites').upsert(records, {
      onConflict: 'user_id,item_id',
      ignoreDuplicates: true,
    });

    if (error) throw new Error(error.message);
  }

  async deleteFavorite(itemId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId);

    if (error) throw new Error(error.message);
  }

  async getFavorites(userId: string): Promise<FavoriteItemRecord[]> {
    const { data, error } = await this.client
      .from('favorites')
      .select('item_id')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
