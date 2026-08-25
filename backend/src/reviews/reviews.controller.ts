import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { SubmitReviewDto } from './dto/submit-review.dto';
import {
  PaginatedReviewsResponse,
  ReviewOperationResult,
} from './types/review.types';
import { PaginationDto, parsePagination } from '../common/dto/pagination.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('listing/:id')
  async getListingReviews(
    @Param('id') id: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<PaginatedReviewsResponse> {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
    );
    return this.reviewsService.getListingReviews(id, page, limit);
  }

  @Post('listing/:id')
  @UseGuards(AuthGuard)
  async submitListingReview(
    @Param('id') id: string,
    @Body() body: SubmitReviewDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.reviewsService.submitListingReview(
      id,
      body.rating,
      body.comment,
      user.id,
    );
  }

  @Get('user/listing/:id')
  @UseGuards(AuthGuard)
  async getUserReviewForListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown> | null> {
    return this.reviewsService.getUserReviewForListing(id, user.id);
  }

  @Get('admin/pending')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getPendingReviews(
    @CurrentUser() user: AuthUser,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<PaginatedReviewsResponse> {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
      { limit: 50 },
    );
    return this.reviewsService.getPendingReviews(page, limit, user.id);
  }

  @Get('admin/status/:status')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getReviewsByStatus(
    @Param('status') status: string,
    @CurrentUser() user: AuthUser,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<PaginatedReviewsResponse> {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
      { limit: 50 },
    );
    return this.reviewsService.getReviewsByStatus(status, page, limit, user.id);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async approveReview(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewOperationResult> {
    return this.reviewsService.approveReview(id, user.id);
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async rejectReview(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewOperationResult> {
    return this.reviewsService.rejectReview(id, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async deleteReview(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewOperationResult> {
    return this.reviewsService.deleteReview(id, user.id);
  }
}
