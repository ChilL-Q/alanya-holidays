import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FavoritesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async upsertFavorite(itemId: string, userId: string) {
    const { error } = await this.client
      .from('favorites')
      .upsert([{ user_id: userId, item_id: itemId }], {
        onConflict: 'user_id,item_id',
        ignoreDuplicates: true,
      });

    if (error) throw new Error(error.message);
  }

  async deleteFavorite(itemId: string, userId: string) {
    const { error } = await this.client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId);

    if (error) throw new Error(error.message);
  }

  async getFavorites(userId: string) {
    const { data, error } = await this.client
      .from('favorites')
      .select('item_id')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
