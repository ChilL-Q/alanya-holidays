import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

export interface SavedItineraryRow {
  id: string;
  user_id: string;
  title: string;
  params: Record<string, unknown>;
  itinerary: unknown[];
  created_at: string;
}

@Injectable()
export class ItinerariesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async createItinerary(
    userId: string,
    dto: CreateItineraryDto,
  ): Promise<SavedItineraryRow> {
    const { data, error } = await this.client
      .from('saved_itineraries')
      .insert({
        user_id: userId,
        title: dto.title,
        params: dto.params || {},
        itinerary: dto.itinerary || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SavedItineraryRow;
  }

  async findByUserId(userId: string): Promise<SavedItineraryRow[]> {
    const { data, error } = await this.client
      .from('saved_itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as SavedItineraryRow[];
  }

  async findById(id: string): Promise<SavedItineraryRow | null> {
    const { data, error } = await this.client
      .from('saved_itineraries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as SavedItineraryRow) || null;
  }

  async findCommunity(limit = 20): Promise<SavedItineraryRow[]> {
    const { data, error } = await this.client
      .from('saved_itineraries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data || []) as SavedItineraryRow[];
  }

  async updateItinerary(
    id: string,
    dto: UpdateItineraryDto,
  ): Promise<SavedItineraryRow> {
    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.params !== undefined) updateData.params = dto.params;
    if (dto.itinerary !== undefined) updateData.itinerary = dto.itinerary;

    const { data, error } = await this.client
      .from('saved_itineraries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SavedItineraryRow;
  }

  async deleteItinerary(id: string): Promise<void> {
    const { error } = await this.client
      .from('saved_itineraries')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
