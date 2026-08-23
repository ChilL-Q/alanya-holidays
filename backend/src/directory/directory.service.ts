import { Injectable, Optional } from '@nestjs/common';
import { DirectoryListingService } from './application/directory-listing.service';
import { ListingClaimService } from './application/listing-claim.service';
import { DirectoryRepository } from './directory.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { RedisService } from '../common/redis/redis.service';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import {
  DirectoryListingRecord,
  DirectoryListResponse,
  DirectoryClaimRecord,
} from './types/directory.types';

@Injectable()
export class DirectoryService {
  private readonly listingService!: DirectoryListingService;
  private readonly claimService!: ListingClaimService;

  constructor(
    @Optional() directoryListingService?: DirectoryListingService,
    @Optional() listingClaimService?: ListingClaimService,
    @Optional() directoryRepository?: DirectoryRepository,
    @Optional() redisService?: RedisService,
    @Optional() userRolesRepo?: UserRolesRepository,
  ) {
    if (directoryListingService && listingClaimService) {
      this.listingService = directoryListingService;
      this.claimService = listingClaimService;
    } else if (directoryRepository && redisService && userRolesRepo) {
      this.listingService = new DirectoryListingService(
        directoryRepository,
        redisService,
        userRolesRepo,
      );
      this.claimService = new ListingClaimService(
        directoryRepository,
        userRolesRepo,
      );
    } else if (directoryListingService) {
      this.listingService = directoryListingService;
      if (directoryRepository && userRolesRepo) {
        this.claimService = new ListingClaimService(
          directoryRepository,
          userRolesRepo,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Directory Listings Delegation
  // ---------------------------------------------------------------------------
  async getDirectoryListings(
    page = 1,
    limit = 20,
    category?: string,
    sortBy = 'base_score',
  ): Promise<DirectoryListResponse> {
    return this.listingService.getDirectoryListings(
      page,
      limit,
      category,
      sortBy,
    );
  }

  async getDirectoryListing(
    id: string,
  ): Promise<DirectoryListingRecord | null> {
    return this.listingService.getDirectoryListing(id);
  }

  async getDirectoryListingBySlug(
    slug: string,
  ): Promise<DirectoryListingRecord | null> {
    return this.listingService.getDirectoryListingBySlug(slug);
  }

  async getDirectoryListingsByCategory(
    categoryId: string,
  ): Promise<DirectoryListingRecord[]> {
    return this.listingService.getDirectoryListingsByCategory(categoryId);
  }

  async searchDirectoryListings(
    query: string,
    categoryId?: string,
    location?: string,
    page = 1,
    limit = 40,
  ): Promise<{ data: DirectoryListingRecord[]; total: number }> {
    return this.listingService.searchDirectoryListings(
      query,
      categoryId,
      location,
      page,
      limit,
    );
  }

  async getFreeListings(): Promise<DirectoryListingRecord[]> {
    return this.listingService.getFreeListings();
  }

  async getPremiumListings(): Promise<DirectoryListingRecord[]> {
    return this.listingService.getPremiumListings();
  }

  async getSignatureListings(): Promise<DirectoryListingRecord[]> {
    return this.listingService.getSignatureListings();
  }

  async getRecentlyClaimedListings(
    limit = 6,
  ): Promise<DirectoryListingRecord[]> {
    return this.listingService.getRecentlyClaimedListings(limit);
  }

  async voteForListing(
    listingId: string,
    vote: 1 | -1,
    userId: string,
  ): Promise<{ netVotes: number; userVote: number }> {
    return this.listingService.voteForListing(listingId, vote, userId);
  }

  async getUserVotesBatch(
    listingIds: string[],
    userId: string,
  ): Promise<Record<string, 1 | -1>> {
    return this.listingService.getUserVotesBatch(listingIds, userId);
  }

  async removeListingVote(
    listingId: string,
    userId: string,
  ): Promise<{ netVotes: number }> {
    return this.listingService.removeListingVote(listingId, userId);
  }

  async getMyDirectoryListings(
    userId: string,
    status?: string,
  ): Promise<DirectoryListingRecord[]> {
    return this.listingService.getMyDirectoryListings(userId, status);
  }

  async saveDraft(
    listing: Partial<DirectoryListingRecord>,
    locationIds: string[] = [],
    userId: string,
    draftId?: string,
  ): Promise<DirectoryListingRecord> {
    return this.listingService.saveDraft(listing, locationIds, userId, draftId);
  }

  async publishDraft(
    id: string,
    updates: Partial<DirectoryListingRecord>,
    locationIds: string[] = [],
    userId: string,
  ): Promise<DirectoryListingRecord> {
    return this.listingService.publishDraft(id, updates, locationIds, userId);
  }

  async createDirectoryListing(
    listing: Partial<DirectoryListingRecord>,
    locationIds: string[],
    userId: string,
  ): Promise<DirectoryListingRecord> {
    return this.listingService.createDirectoryListing(
      listing,
      locationIds,
      userId,
    );
  }

  async updateDirectoryListing(
    id: string,
    updates: Partial<DirectoryListingRecord>,
    locationIds: string[],
    userId: string,
  ): Promise<DirectoryListingRecord> {
    return this.listingService.updateDirectoryListing(
      id,
      updates,
      locationIds,
      userId,
    );
  }

  async deleteDirectoryListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.listingService.deleteDirectoryListing(id, userId);
  }

  async trackListingView(listingId: string): Promise<{ success: boolean }> {
    return this.listingService.trackListingView(listingId);
  }

  async trackListingClick(
    listingId: string,
    clickType: string,
  ): Promise<{ success: boolean }> {
    return this.listingService.trackListingClick(listingId, clickType);
  }

  async getDirectoryListingsAdmin(
    filters: { status?: string; category?: string; query?: string },
    userId: string,
  ): Promise<DirectoryListingRecord[]> {
    return this.listingService.getDirectoryListingsAdmin(filters, userId);
  }

  async getDirectoryListingsByStatus(
    status: 'approved' | 'rejected',
    category?: string,
  ): Promise<DirectoryListingRecord[]> {
    return this.listingService.getDirectoryListingsByStatus(status, category);
  }

  async getPendingDirectoryListings(): Promise<DirectoryListingRecord[]> {
    return this.listingService.getPendingDirectoryListings();
  }

  async approveDirectoryListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.listingService.approveDirectoryListing(id, userId);
  }

  async rejectDirectoryListing(
    id: string,
    reason: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.listingService.rejectDirectoryListing(id, reason, userId);
  }

  async getDirectoryAnalyticsForOwner(
    days = 30,
    userId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.listingService.getDirectoryAnalyticsForOwner(days, userId);
  }

  async getCategoryAnalyticsAverage(
    categoryId: string,
    days = 30,
  ): Promise<Record<string, unknown> | null> {
    return this.listingService.getCategoryAnalyticsAverage(categoryId, days);
  }

  async getListingAddons(
    listingId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.listingService.getListingAddons(listingId);
  }

  async createAddonCheckout(
    listingId: string,
    addonType: string,
    userId: string,
  ): Promise<{ url: string }> {
    return this.listingService.createAddonCheckout(
      listingId,
      addonType,
      userId,
    );
  }

  sendListingPaymentInstructions(
    businessName: string,
    tier: string,
    userId: string,
  ): { success: boolean } {
    return this.listingService.sendListingPaymentInstructions(
      businessName,
      tier,
      userId,
    );
  }

  // ---------------------------------------------------------------------------
  // Listing Claims Delegation
  // ---------------------------------------------------------------------------
  async submitListingClaim(
    claim: SubmitClaimDto,
    userId: string,
  ): Promise<DirectoryClaimRecord> {
    return this.claimService.submitListingClaim(claim, userId);
  }

  async verifyClaimEmail(token: string): Promise<DirectoryClaimRecord | null> {
    return this.claimService.verifyClaimEmail(token);
  }

  async getListingClaims(userId?: string): Promise<DirectoryClaimRecord[]> {
    return this.claimService.getListingClaims(userId);
  }

  async getMyListingClaims(userId: string): Promise<DirectoryClaimRecord[]> {
    return this.claimService.getMyListingClaims(userId);
  }

  async approveListingClaim(
    claimId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.claimService.approveListingClaim(claimId, userId);
  }

  async rejectListingClaim(
    claimId: string,
    reason: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.claimService.rejectListingClaim(claimId, reason, userId);
  }
}
