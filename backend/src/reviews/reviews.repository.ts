import { Injectable } from '@nestjs/common';
import { SupabaseReviewsRepository } from './infrastructure/repositories/supabase-reviews.repository';

/**
 * Backward compatibility wrapper around SupabaseReviewsRepository.
 */
@Injectable()
export class ReviewsRepository extends SupabaseReviewsRepository {}
