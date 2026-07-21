import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async addFavorite(itemId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('favorites')
      .upsert([{ user_id: userId, item_id: itemId }], { onConflict: 'user_id,item_id', ignoreDuplicates: true });

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async removeFavorite(itemId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getFavorites(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('favorites')
      .select('item_id')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data.map((f: any) => f.item_id);
  }
}
