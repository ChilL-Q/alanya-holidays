import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import {
  IReviewsRepository,
  ReviewListResult,
} from '../../domain/repositories/reviews.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';
import { ReviewMapper } from '../mappers/review.mapper';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class SupabaseReviewsRepository implements IReviewsRepository {
  private readonly logger = new Logger(SupabaseReviewsRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  // ============================================
  // Domain Entity Methods
  // ============================================

  async findById(id: string): Promise<ReviewEntity | null> {
    if (!UUID_RE.test(id)) {
      return null;
    }

    const { data, error } = await this.client
      .from('listing_reviews')
      .select(
        '*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)',
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return ReviewMapper.toDomain(data);
  }

  async save(review: ReviewEntity): Promise<ReviewEntity> {
    const persistenceData = ReviewMapper.toPersistence(review);

    if (review.id) {
      const { data, error } = await this.client
        .from('listing_reviews')
        .update(persistenceData)
        .eq('id', review.id)
        .select(
          '*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)',
        )
        .single();

      if (error) throw new Error(`Failed to update review: ${error.message}`);
      return ReviewMapper.toDomain(data);
    }

    const { data, error } = await this.client
      .from('listing_reviews')
      .insert(persistenceData)
      .select(
        '*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)',
      )
      .single();

    if (error) throw new Error(`Failed to insert review: ${error.message}`);
    return ReviewMapper.toDomain(data);
  }

  // ============================================
  // Query & Direct Persistence Methods
  // ============================================

  async getListingReviews(
    listingId: string,
    from: number,
    to: number,
  ): Promise<ReviewListResult> {
    if (!UUID_RE.test(listingId)) {
      return { data: [], count: 0 };
    }

    const { data, error, count } = await this.client
      .from('listing_reviews')
      .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('listing_id', listingId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') {
        return { data: [], count: 0 };
      }
      throw new Error(error.message);
    }
    return {
      data: data || [],
      count: count || 0,
    };
  }

  async insertListingReview(
    listingId: string,
    rating: number,
    comment: string,
    userId: string,
  ): Promise<Record<string, unknown>> {
    if (!UUID_RE.test(listingId) || !UUID_RE.test(userId)) {
      return {};
    }

    const { data, error } = await this.client
      .from('listing_reviews')
      .insert({ listing_id: listingId, user_id: userId, rating, comment })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') {
        return {};
      }
      throw new Error(error.message);
    }
    return data ?? {};
  }

  async getUserReviewForListing(
    listingId: string,
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!UUID_RE.test(listingId) || !UUID_RE.test(userId)) {
      return null;
    }

    const { data, error } = await this.client
      .from('listing_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116' && error.code !== '22P02') {
      this.logger.error(
        'getUserReviewForListing error:',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
    }
    return data || null;
  }

  async getReviewsByStatus(
    status: string,
    from: number,
    to: number,
    ascending: boolean,
  ): Promise<ReviewListResult> {
    const { data, error, count } = await this.client
      .from('listing_reviews')
      .select(
        '*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)',
        { count: 'exact' },
      )
      .eq('status', status)
      .order('created_at', { ascending })
      .range(from, to);

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') {
        return { data: [], count: 0 };
      }
      throw new Error(error.message);
    }
    return {
      data: data || [],
      count: count || 0,
    };
  }

  async updateReviewStatus(id: string, status: string): Promise<void> {
    if (!UUID_RE.test(id)) return;
    const { error } = await this.client
      .from('listing_reviews')
      .update({ status })
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') return;
      throw new Error(error.message);
    }
  }

  async deleteReview(id: string): Promise<void> {
    if (!UUID_RE.test(id)) return;
    const { error } = await this.client
      .from('listing_reviews')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') return;
      throw new Error(error.message);
    }
  }
}
