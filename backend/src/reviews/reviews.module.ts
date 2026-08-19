import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { SupabaseReviewsRepository } from './infrastructure/repositories/supabase-reviews.repository';
import { REVIEWS_REPOSITORY } from './domain/repositories/reviews.repository.interface';

@Module({
  providers: [
    ReviewsService,
    ReviewsRepository,
    SupabaseReviewsRepository,
    {
      provide: REVIEWS_REPOSITORY,
      useExisting: ReviewsRepository,
    },
  ],
  controllers: [ReviewsController],
  exports: [
    ReviewsService,
    ReviewsRepository,
    SupabaseReviewsRepository,
    REVIEWS_REPOSITORY,
  ],
})
export class ReviewsModule {}
