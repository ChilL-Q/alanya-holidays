import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';

@Module({
  providers: [ReviewsService, ReviewsRepository],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
