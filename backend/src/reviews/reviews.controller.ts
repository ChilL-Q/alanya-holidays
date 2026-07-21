import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('listing/:id')
  async getListingReviews(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.reviewsService.getListingReviews(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('listing/:id')
  @UseGuards(AuthGuard)
  async submitListingReview(
    @Param('id') id: string,
    @Body() body: { rating: number; comment: string },
    @Req() req: any,
  ) {
    return this.reviewsService.submitListingReview(
      id,
      body.rating,
      body.comment,
      req.user.id,
    );
  }

  @Get('user/listing/:id')
  @UseGuards(AuthGuard)
  async getUserReviewForListing(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.getUserReviewForListing(id, req.user.id);
  }

  @Get('admin/pending')
  @UseGuards(AuthGuard)
  async getPendingReviews(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    return this.reviewsService.getPendingReviews(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      req.user.id,
    );
  }

  @Get('admin/status/:status')
  @UseGuards(AuthGuard)
  async getReviewsByStatus(
    @Param('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    return this.reviewsService.getReviewsByStatus(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      req.user.id,
    );
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard)
  async approveReview(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.approveReview(id, req.user.id);
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard)
  async rejectReview(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.rejectReview(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteReview(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.deleteReview(id, req.user.id);
  }
}
