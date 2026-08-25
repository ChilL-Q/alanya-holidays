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
} from '@nestjs/common';
import { DirectoryListingService } from '../application/directory-listing.service';
import { ListingClaimService } from '../application/listing-claim.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthUser } from '../../auth/types/auth-user.interface';
import { SubmitClaimDto } from '../dto/submit-claim.dto';
import { SaveListingDraftDto } from '../dto/save-listing-draft.dto';
import { DirectoryListingRecord } from '../types/directory.types';
import {
  PaginationDto,
  LimitQueryDto,
  DaysQueryDto,
} from '../../common/dto/pagination.dto';

@Controller('directory')
export class DirectoryController {
  constructor(
    private readonly listingService: DirectoryListingService,
    private readonly claimService: ListingClaimService,
  ) {}

  @Get()
  async getDirectoryListings(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const page = pagination?.page ?? (pageStr ? parseInt(pageStr, 10) : 1);
    const limit = pagination?.limit ?? (limitStr ? parseInt(limitStr, 10) : 20);
    return this.listingService.getDirectoryListings(
      page,
      limit,
      category,
      sortBy,
    );
  }

  @Get('restaurants')
  async getRestaurantsListings(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const page = pagination?.page ?? (pageStr ? parseInt(pageStr, 10) : 1);
    const limit = pagination?.limit ?? (limitStr ? parseInt(limitStr, 10) : 20);
    return this.listingService.getDirectoryListings(page, limit, 'restaurants');
  }

  @Get('search')
  async searchDirectoryListings(
    @Query('query') query: string,
    @Query('category') categoryId?: string,
    @Query('location') location?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const page = pagination?.page ?? (pageStr ? parseInt(pageStr, 10) : 1);
    const limit = pagination?.limit ?? (limitStr ? parseInt(limitStr, 10) : 40);
    return this.listingService.searchDirectoryListings(
      query,
      categoryId,
      location,
      page,
      limit,
    );
  }

  // ---------------------------------------------------------------------------
  // Landing Page Endpoints
  // ---------------------------------------------------------------------------
  @Get('landing/free')
  async getFreeListings() {
    return this.listingService.getFreeListings();
  }

  @Get('landing/premium')
  async getPremiumListings() {
    return this.listingService.getPremiumListings();
  }

  @Get('landing/signature')
  async getSignatureListings() {
    return this.listingService.getSignatureListings();
  }

  @Get('landing/recent')
  async getRecentlyClaimedListings(@Query() query?: LimitQueryDto | string) {
    let limit = 6;
    if (typeof query === 'string') {
      limit = parseInt(query, 10) || 6;
    } else if (query?.limit !== undefined) {
      limit = Number(query.limit) || 6;
    }
    return this.listingService.getRecentlyClaimedListings(limit);
  }

  // ---------------------------------------------------------------------------
  // Analytics & Tracking
  // ---------------------------------------------------------------------------
  @Get('analytics/owner')
  @UseGuards(AuthGuard)
  async getDirectoryAnalyticsForOwner(
    @Query('days') daysParam: string | undefined,
    @CurrentUser() user: AuthUser,
    @Query() query?: DaysQueryDto,
  ) {
    let days = 30;
    if (query?.days !== undefined) {
      days = Number(query.days);
    } else if (daysParam !== undefined) {
      days = parseInt(daysParam, 10) || 30;
    }
    return this.listingService.getDirectoryAnalyticsForOwner(days, user.id);
  }

  @Get('analytics/category/:categoryId')
  async getCategoryAnalyticsAverage(
    @Param('categoryId') categoryId: string,
    @Query('days') daysParam?: string,
    @Query() query?: DaysQueryDto,
  ) {
    let days = 30;
    if (query?.days !== undefined) {
      days = Number(query.days);
    } else if (daysParam !== undefined) {
      days = parseInt(daysParam, 10) || 30;
    }
    return this.listingService.getCategoryAnalyticsAverage(categoryId, days);
  }

  @Post(':id/track/view')
  async trackListingView(@Param('id') id: string) {
    return this.listingService.trackListingView(id);
  }

  @Post(':id/track/click')
  async trackListingClick(
    @Param('id') id: string,
    @Body('clickType') clickType: string,
  ) {
    return this.listingService.trackListingClick(id, clickType);
  }

  // ---------------------------------------------------------------------------
  // Voting
  // ---------------------------------------------------------------------------
  @Post(':id/vote')
  @UseGuards(AuthGuard)
  async voteForListing(
    @Param('id') id: string,
    @Body('vote') vote: 1 | -1,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.voteForListing(id, vote, user.id);
  }

  @Post('votes/batch')
  @UseGuards(AuthGuard)
  async getUserVotesBatch(
    @Body('listingIds') listingIds: string[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.getUserVotesBatch(listingIds, user.id);
  }

  @Delete(':id/vote')
  @UseGuards(AuthGuard)
  async removeListingVote(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.removeListingVote(id, user.id);
  }

  // ---------------------------------------------------------------------------
  // Public Claims Submission & Verification
  // ---------------------------------------------------------------------------
  @Post('claims')
  @UseGuards(AuthGuard)
  async submitListingClaim(
    @Body() claim: SubmitClaimDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimService.submitListingClaim(claim, user.id);
  }

  @Get('claims/verify')
  async verifyClaimEmail(@Query('token') token: string) {
    return this.claimService.verifyClaimEmail(token);
  }

  // ---------------------------------------------------------------------------
  // Addons & Payment
  // ---------------------------------------------------------------------------
  @Get(':id/addons')
  async getListingAddons(@Param('id') id: string) {
    return this.listingService.getListingAddons(id);
  }

  @Post(':id/addons/checkout')
  @UseGuards(AuthGuard)
  async createAddonCheckout(
    @Param('id') id: string,
    @Body('addonType') addonType: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.createAddonCheckout(id, addonType, user.id);
  }

  @Post('payment/instructions')
  @UseGuards(AuthGuard)
  sendListingPaymentInstructions(
    @Body('businessName') businessName: string,
    @Body('tier') tier: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.sendListingPaymentInstructions(
      businessName,
      tier,
      user.id,
    );
  }

  // ---------------------------------------------------------------------------
  // User Listings & Claims
  // ---------------------------------------------------------------------------
  @Get('me/listings')
  @UseGuards(AuthGuard)
  async getMyDirectoryListings(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ) {
    return this.listingService.getMyDirectoryListings(user.id, status);
  }

  @Get('me/claims')
  @UseGuards(AuthGuard)
  async getMyListingClaims(@CurrentUser() user: AuthUser) {
    return this.claimService.getMyListingClaims(user.id);
  }

  @Post('draft')
  @UseGuards(AuthGuard)
  async saveDraft(
    @Body() body: SaveListingDraftDto,
    @CurrentUser() user: AuthUser,
  ) {
    const locationIds = body.locationIds || [];
    const draftId = body.draftId;
    return this.listingService.saveDraft(body, locationIds, user.id, draftId);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  async publishDraft(
    @Param('id') id: string,
    @Body()
    body: Partial<DirectoryListingRecord> & { locationIds?: string[] },
    @CurrentUser() user: AuthUser,
  ) {
    const locationIds = body.locationIds || [];
    return this.listingService.publishDraft(id, body, locationIds, user.id);
  }

  @Get('slug/:slug')
  async getDirectoryListingBySlug(@Param('slug') slug: string) {
    return this.listingService.getDirectoryListingBySlug(slug);
  }

  @Get('category/:id')
  async getDirectoryListingsByCategory(@Param('id') categoryId: string) {
    return this.listingService.getDirectoryListingsByCategory(categoryId);
  }

  @Get(':id')
  async getDirectoryListing(@Param('id') id: string) {
    return this.listingService.getDirectoryListing(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createDirectoryListing(
    @Body('listing') listing: Partial<DirectoryListingRecord>,
    @Body('locationIds') locationIds: string[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.createDirectoryListing(
      listing,
      locationIds,
      user.id,
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateDirectoryListing(
    @Param('id') id: string,
    @Body('updates') updates: Partial<DirectoryListingRecord>,
    @Body('locationIds') locationIds: string[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.updateDirectoryListing(
      id,
      updates,
      locationIds,
      user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteDirectoryListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.deleteDirectoryListing(id, user.id);
  }
}
