import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('directory')
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @Get()
  async getDirectoryListings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.directoryService.getDirectoryListings(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      category,
      sortBy,
    );
  }

  @Get('restaurants')
  async getRestaurantsListings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.directoryService.getDirectoryListings(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      'restaurants',
    );
  }

  @Get('search')
  async searchDirectoryListings(
    @Query('query') query: string,
    @Query('category') categoryId?: string,
    @Query('location') location?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.directoryService.searchDirectoryListings(
      query,
      categoryId,
      location,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 40,
    );
  }

  // Landing Page endpoints
  @Get('landing/free')
  async getFreeListings() {
    return this.directoryService.getFreeListings();
  }

  @Get('landing/premium')
  async getPremiumListings() {
    return this.directoryService.getPremiumListings();
  }

  @Get('landing/signature')
  async getSignatureListings() {
    return this.directoryService.getSignatureListings();
  }

  @Get('landing/recent')
  async getRecentlyClaimedListings(@Query('limit') limit?: string) {
    return this.directoryService.getRecentlyClaimedListings(
      limit ? parseInt(limit) : 6,
    );
  }

  // Admin / Moderation
  @Get('admin/status/:status')
  @UseGuards(AuthGuard)
  async getDirectoryListingsByStatus(
    @Param('status') status: 'approved' | 'rejected',
    @Query('category') category?: string,
  ) {
    return this.directoryService.getDirectoryListingsByStatus(status, category);
  }

  @Get('admin/pending')
  @UseGuards(AuthGuard)
  async getPendingDirectoryListings() {
    return this.directoryService.getPendingDirectoryListings();
  }

  @Post(':id/approve')
  @UseGuards(AuthGuard)
  async approveDirectoryListing(@Param('id') id: string, @Req() req: any) {
    return this.directoryService.approveDirectoryListing(id, req.user.id);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard)
  async rejectDirectoryListing(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.directoryService.rejectDirectoryListing(
      id,
      reason,
      req.user.id,
    );
  }

  // Analytics
  @Get('analytics/owner')
  @UseGuards(AuthGuard)
  async getDirectoryAnalyticsForOwner(
    @Query('days') days: string,
    @Req() req: any,
  ) {
    return this.directoryService.getDirectoryAnalyticsForOwner(
      days ? parseInt(days) : 30,
      req.user.id,
    );
  }

  @Get('analytics/category/:categoryId')
  async getCategoryAnalyticsAverage(
    @Param('categoryId') categoryId: string,
    @Query('days') days?: string,
  ) {
    return this.directoryService.getCategoryAnalyticsAverage(
      categoryId,
      days ? parseInt(days) : 30,
    );
  }

  @Post(':id/track/view')
  async trackListingView(@Param('id') id: string) {
    return this.directoryService.trackListingView(id);
  }

  @Post(':id/track/click')
  async trackListingClick(
    @Param('id') id: string,
    @Body('clickType') clickType: string,
  ) {
    return this.directoryService.trackListingClick(id, clickType);
  }

  // Voting
  @Post(':id/vote')
  @UseGuards(AuthGuard)
  async voteForListing(
    @Param('id') id: string,
    @Body('vote') vote: 1 | -1,
    @Req() req: any,
  ) {
    return this.directoryService.voteForListing(id, vote, req.user.id);
  }

  @Post('votes/batch')
  @UseGuards(AuthGuard)
  async getUserVotesBatch(
    @Body('listingIds') listingIds: string[],
    @Req() req: any,
  ) {
    return this.directoryService.getUserVotesBatch(listingIds, req.user.id);
  }

  @Delete(':id/vote')
  @UseGuards(AuthGuard)
  async removeListingVote(@Param('id') id: string, @Req() req: any) {
    return this.directoryService.removeListingVote(id, req.user.id);
  }

  // Claims
  @Post('claims')
  @UseGuards(AuthGuard)
  async submitListingClaim(@Body() claim: any, @Req() req: any) {
    return this.directoryService.submitListingClaim(claim, req.user.id);
  }

  @Get('claims/verify')
  async verifyClaimEmail(@Query('token') token: string) {
    return this.directoryService.verifyClaimEmail(token);
  }

  @Get('claims')
  @UseGuards(AuthGuard)
  async getListingClaims(@Req() req: any) {
    return this.directoryService.getListingClaims(req.user.id);
  }

  @Post('claims/:id/approve')
  @UseGuards(AuthGuard)
  async approveListingClaim(@Param('id') id: string, @Req() req: any) {
    return this.directoryService.approveListingClaim(id, req.user.id);
  }

  @Post('claims/:id/reject')
  @UseGuards(AuthGuard)
  async rejectListingClaim(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.directoryService.rejectListingClaim(id, reason, req.user.id);
  }

  // Addons
  @Get(':id/addons')
  async getListingAddons(@Param('id') id: string) {
    return this.directoryService.getListingAddons(id);
  }

  @Post(':id/addons/checkout')
  @UseGuards(AuthGuard)
  async createAddonCheckout(
    @Param('id') id: string,
    @Body('addonType') addonType: string,
    @Req() req: any,
  ) {
    return this.directoryService.createAddonCheckout(
      id,
      addonType,
      req.user.id,
    );
  }

  // Payment instructions
  @Post('payment/instructions')
  @UseGuards(AuthGuard)
  async sendListingPaymentInstructions(
    @Body('businessName') businessName: string,
    @Body('tier') tier: string,
    @Req() req: any,
  ) {
    return this.directoryService.sendListingPaymentInstructions(
      businessName,
      tier,
      req.user.id,
    );
  }

  // User Listings
  @Get('me/listings')
  @UseGuards(AuthGuard)
  async getMyDirectoryListings(@Req() req: any) {
    return this.directoryService.getMyDirectoryListings(req.user.id);
  }

  @Get('slug/:slug')
  async getDirectoryListingBySlug(@Param('slug') slug: string) {
    return this.directoryService.getDirectoryListingBySlug(slug);
  }

  @Get('category/:id')
  async getDirectoryListingsByCategory(@Param('id') categoryId: string) {
    return this.directoryService.getDirectoryListingsByCategory(categoryId);
  }

  @Get(':id')
  async getDirectoryListing(@Param('id') id: string) {
    return this.directoryService.getDirectoryListing(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createDirectoryListing(
    @Body('listing') listing: any,
    @Body('locationIds') locationIds: string[],
    @Req() req: any,
  ) {
    return this.directoryService.createDirectoryListing(
      listing,
      locationIds,
      req.user.id,
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateDirectoryListing(
    @Param('id') id: string,
    @Body('updates') updates: any,
    @Body('locationIds') locationIds: string[],
    @Req() req: any,
  ) {
    return this.directoryService.updateDirectoryListing(
      id,
      updates,
      locationIds,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteDirectoryListing(@Param('id') id: string, @Req() req: any) {
    return this.directoryService.deleteDirectoryListing(id, req.user.id);
  }
}
