import {
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DirectoryRepository } from '../directory.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { RedisService } from '../../common/redis/redis.service';
import { EmailOutboxRepository } from '../../bookings/email-outbox.repository';
import {
  DirectoryListingRecord,
  DirectoryListResponse,
  VoteResult,
} from '../types/directory.types';
import { UserListingVote } from '../dto/directory-vote.dto';
import {
  UUID_RE,
  validateUUIDs,
  validatePhotoLimit,
  stripProtectedFields,
  normalizeListingInput,
  normalizePriceLevel,
  DEFAULT_UNPRIVILEGED_LISTING_FLAGS,
} from '../domain/listing-input.schema';

@Injectable()
export class DirectoryListingService {
  private readonly logger = new Logger(DirectoryListingService.name);

  constructor(
    private readonly directoryRepository: DirectoryRepository,
    private readonly redisService: RedisService,
    private readonly userRolesRepo: UserRolesRepository,
    @Optional() private readonly emailOutbox?: EmailOutboxRepository,
  ) {}

  private async enqueueAdminNotification(
    listing: Partial<DirectoryListingRecord>,
    ownerEmailOverride?: string | null,
  ): Promise<void> {
    if (!this.emailOutbox) return;
    try {
      const adminEmail =
        process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@alanyaholidays.com';
      const listingId = listing.id ? String(listing.id) : '';
      const listingTitle = listing.name || 'Untitled Listing';
      const ownerEmail =
        ownerEmailOverride ||
        (typeof listing.email === 'string' ? listing.email : '') ||
        '';
      const category =
        (typeof listing.category_id === 'string'
          ? listing.category_id
          : typeof listing.category === 'string'
            ? listing.category
            : '') || 'general';
      const tier =
        (typeof listing.tier === 'string' ? listing.tier : '') || 'explorer';

      await this.emailOutbox.enqueue({
        to: adminEmail,
        type: 'admin_listing_notification',
        data: {
          listingId,
          listingTitle,
          ownerEmail,
          category,
          tier,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to enqueue admin notification for pending listing ${listing?.id}: ${msg}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Public Queries & Landing
  // ---------------------------------------------------------------------------
  async getDirectoryListings(
    page = 1,
    limit = 20,
    category?: string,
    sortBy = 'base_score',
  ): Promise<DirectoryListResponse> {
    const cacheKey = `directory:list:${page}:${limit}:${category || 'all'}:${sortBy}`;
    return this.redisService.getOrFetchSWR(
      cacheKey,
      async () => {
        const result = await this.directoryRepository.getDirectoryListings(
          page,
          limit,
          category,
          sortBy,
        );

        const response: DirectoryListResponse = {
          data: result.data,
          pagination: {
            page,
            limit,
            total: result.count,
            totalPages: Math.ceil(result.count / limit),
          },
        };
        return response;
      },
      { ttlFreshSeconds: 600 },
    );
  }

  async getDirectoryListing(
    id: string,
  ): Promise<DirectoryListingRecord | null> {
    const isUuid = UUID_RE.test(id);
    if (!isUuid) {
      return this.getDirectoryListingBySlug(id);
    }

    const cacheKey = `directory:item:${id}`;
    return this.redisService.getOrFetchSWR(
      cacheKey,
      async () => {
        const data = await this.directoryRepository.getDirectoryListingById(id);
        if (data && data.status && data.status !== 'approved') {
          return null;
        }
        return data;
      },
      { ttlFreshSeconds: 600 },
    );
  }

  async getDirectoryListingBySlug(
    slug: string,
  ): Promise<DirectoryListingRecord | null> {
    const cacheKey = `directory:slug:${slug}`;
    return this.redisService.getOrFetchSWR(
      cacheKey,
      async () => {
        const data =
          await this.directoryRepository.getDirectoryListingBySlug(slug);
        if (data && data.status && data.status !== 'approved') {
          return null;
        }
        return data;
      },
      { ttlFreshSeconds: 600 },
    );
  }

  async getDirectoryListingsByCategory(
    categoryId: string,
  ): Promise<DirectoryListingRecord[]> {
    const cacheKey = `directory:cat:${categoryId}`;
    return this.redisService.getOrFetchSWR(
      cacheKey,
      () => this.directoryRepository.getDirectoryListingsByCategory(categoryId),
      { ttlFreshSeconds: 600 },
    );
  }

  async searchDirectoryListings(
    query: string,
    categoryId?: string,
    location?: string,
    page = 1,
    limit = 40,
  ): Promise<{ data: DirectoryListingRecord[]; total: number }> {
    const result = await this.directoryRepository.searchDirectoryListings(
      query,
      categoryId,
      location,
      page,
      limit,
    );
    return { data: result.data, total: result.count };
  }

  async getFreeListings(): Promise<DirectoryListingRecord[]> {
    return this.directoryRepository.getFreeListings();
  }

  async getPremiumListings(): Promise<DirectoryListingRecord[]> {
    return this.directoryRepository.getPremiumListings();
  }

  async getSignatureListings(): Promise<DirectoryListingRecord[]> {
    return this.directoryRepository.getSignatureListings();
  }

  async getRecentlyClaimedListings(
    limit = 6,
  ): Promise<DirectoryListingRecord[]> {
    return this.directoryRepository.getRecentlyClaimedListings(limit);
  }

  // ---------------------------------------------------------------------------
  // Voting Cluster
  // ---------------------------------------------------------------------------
  async voteForListing(
    listingId: string,
    vote: 1 | -1,
    userId: string,
  ): Promise<{ netVotes: number; userVote: number }> {
    if (!UUID_RE.test(listingId) || !UUID_RE.test(userId)) {
      return { netVotes: 0, userVote: 0 };
    }
    const data: VoteResult[] = await this.directoryRepository.voteForListing(
      listingId,
      vote,
      userId,
    );
    const item: VoteResult | undefined = data[0];
    return {
      netVotes: typeof item?.net_votes === 'number' ? item.net_votes : 0,
      userVote: typeof item?.user_vote === 'number' ? item.user_vote : 0,
    };
  }

  async getUserVotesBatch(
    listingIds: string[],
    userId: string,
  ): Promise<Record<string, 1 | -1>> {
    const data: UserListingVote[] =
      await this.directoryRepository.getUserVotesBatch(listingIds, userId);
    const votes: Record<string, 1 | -1> = {};
    for (const row of data) {
      votes[row.listing_id] = row.vote;
    }
    return votes;
  }

  async removeListingVote(
    listingId: string,
    userId: string,
  ): Promise<{ netVotes: number }> {
    if (!UUID_RE.test(listingId) || !UUID_RE.test(userId)) {
      return { netVotes: 0 };
    }
    const data: VoteResult[] = await this.directoryRepository.removeListingVote(
      listingId,
      userId,
    );
    const item: VoteResult | undefined = data[0];
    return {
      netVotes: typeof item?.net_votes === 'number' ? item.net_votes : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Owner Lifecycle & CRUD
  // ---------------------------------------------------------------------------
  async getMyDirectoryListings(
    userId: string,
    status?: string,
  ): Promise<DirectoryListingRecord[]> {
    return this.directoryRepository.getMyDirectoryListings(userId, status);
  }

  async saveDraft(
    listing: Partial<DirectoryListingRecord>,
    locationIds: string[] = [],
    userId: string,
    draftId?: string,
  ): Promise<DirectoryListingRecord> {
    if (locationIds?.length) validateUUIDs(locationIds);

    const tier = (listing.tier as string) || 'explorer';
    const gallery = Array.isArray(listing.gallery) ? listing.gallery : [];
    validatePhotoLimit(tier, gallery);

    const normalized = normalizeListingInput(listing);

    const safeData: Record<string, unknown> = {
      name: normalized.name || 'Untitled Draft',
      short_description: normalized.short_description,
      description: normalized.description,
      category_id: normalized.category_id,
      website: normalized.website,
      whatsapp: normalized.whatsapp,
      gallery,
      location: normalized.location,
      google_map_url: normalized.google_map_url,
      video_url: normalized.video_url,
      booking_url: normalized.booking_url,
      ...DEFAULT_UNPRIVILEGED_LISTING_FLAGS,
      tier,
      base_score: 0,
      status: 'draft',
      owner_user_id: userId,
      phone: typeof listing.phone === 'string' ? listing.phone : null,
      email: typeof listing.email === 'string' ? listing.email : null,
      ...(normalized.price_level !== undefined
        ? { price_level: normalized.price_level }
        : {}),
    };

    let data: DirectoryListingRecord;

    if (draftId && UUID_RE.test(draftId)) {
      const existing =
        await this.directoryRepository.getDirectoryListingOwner(draftId);
      if (!existing || existing.owner_user_id !== userId) {
        throw new UnauthorizedException('Not authorized to update this draft');
      }
      data = await this.directoryRepository.updateDirectoryListing(
        draftId,
        safeData,
      );
    } else {
      data = await this.directoryRepository.insertDirectoryListing(safeData);
    }

    const effectiveId = draftId || data.id;

    if (locationIds !== undefined && effectiveId) {
      if (locationIds.length) {
        const rows = locationIds.map((lid, i) => ({
          listing_id: effectiveId,
          location_id: lid,
          display_order: i,
        }));
        await this.directoryRepository.upsertListingLocations(rows);
        await this.directoryRepository.deleteListingLocations(
          effectiveId,
          locationIds,
        );
      } else if (draftId) {
        await this.directoryRepository.deleteListingLocations(effectiveId);
      }
    }

    await this.redisService.delByPattern('directory:*');
    return data;
  }

  async publishDraft(
    id: string,
    updates: Partial<DirectoryListingRecord>,
    locationIds: string[] = [],
    userId: string,
  ): Promise<DirectoryListingRecord> {
    if (!UUID_RE.test(id)) {
      throw new Error(`Invalid UUID: ${id}`);
    }

    const existing =
      await this.directoryRepository.getDirectoryListingOwner(id);
    if (!existing || existing.owner_user_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    const rawName = typeof updates.name === 'string' ? updates.name.trim() : '';
    const rawCategory =
      typeof updates.category_id === 'string'
        ? updates.category_id.trim()
        : typeof updates.category === 'string'
          ? updates.category.trim()
          : '';
    const rawDesc =
      typeof updates.description === 'string'
        ? updates.description.trim()
        : typeof updates.short_description === 'string'
          ? updates.short_description.trim()
          : '';
    const rawAddress =
      typeof updates.location === 'string'
        ? updates.location.trim()
        : typeof updates.address === 'string'
          ? updates.address.trim()
          : '';
    const rawEmail =
      typeof updates.email === 'string' ? updates.email.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!rawName || rawName.length < 2) {
      throw new Error('Business name is required to publish');
    }
    if (!rawCategory) {
      throw new Error('Category is required to publish');
    }
    if (!rawDesc) {
      throw new Error('Description is required to publish');
    }
    if (!rawAddress) {
      throw new Error('Address is required to publish');
    }
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      throw new Error('Valid email is required to publish');
    }

    const tier = (updates.tier as string) || 'explorer';
    const gallery = Array.isArray(updates.gallery) ? updates.gallery : [];
    validatePhotoLimit(tier, gallery);

    if (locationIds?.length) validateUUIDs(locationIds);

    const stripped = stripProtectedFields(updates as Record<string, unknown>);

    const safeUpdates: Record<string, unknown> = {
      ...stripped,
      name: rawName,
      category_id: rawCategory,
      description: rawDesc,
      short_description: rawDesc.slice(0, 500),
      location: rawAddress,
      email: rawEmail,
      tier,
      gallery,
      status: 'pending',
      rejection_reason: null,
    };

    if (safeUpdates.price_level !== undefined) {
      const normalizedPrice = normalizePriceLevel(safeUpdates.price_level);
      if (normalizedPrice !== undefined) {
        safeUpdates.price_level = normalizedPrice;
      } else {
        delete safeUpdates.price_level;
      }
    }

    const data = await this.directoryRepository.updateDirectoryListing(
      id,
      safeUpdates,
    );

    if (locationIds !== undefined) {
      if (locationIds.length) {
        const rows = locationIds.map((lid, i) => ({
          listing_id: id,
          location_id: lid,
          display_order: i,
        }));
        await this.directoryRepository.upsertListingLocations(rows);
        await this.directoryRepository.deleteListingLocations(id, locationIds);
      } else {
        await this.directoryRepository.deleteListingLocations(id);
      }
    }

    await this.redisService.delByPattern('directory:*');
    await this.enqueueAdminNotification(data, rawEmail);
    return data;
  }

  async createDirectoryListing(
    listing: Partial<DirectoryListingRecord>,
    locationIds: string[],
    userId: string,
  ): Promise<DirectoryListingRecord> {
    if (locationIds?.length) validateUUIDs(locationIds);

    const tier = (listing.tier as string) || 'explorer';
    const gallery = Array.isArray(listing.gallery) ? listing.gallery : [];
    validatePhotoLimit(tier, gallery);

    const normalized = normalizeListingInput(listing);

    const safeData: Record<string, unknown> = {
      name: normalized.name,
      short_description: normalized.short_description,
      category_id: normalized.category_id,
      website: normalized.website,
      whatsapp: normalized.whatsapp,
      gallery,
      location: normalized.location,
      google_map_url: normalized.google_map_url,
      video_url: normalized.video_url,
      ...DEFAULT_UNPRIVILEGED_LISTING_FLAGS,
      tier,
      base_score: listing.base_score ?? 0,
      descriptions: normalized.descriptions ?? {},
      status: 'pending',
      owner_user_id: userId,
      phone: typeof listing.phone === 'string' ? listing.phone : null,
      email: typeof listing.email === 'string' ? listing.email : null,
      ...(normalized.slug ? { slug: normalized.slug } : {}),
      ...(normalized.price_level !== undefined
        ? { price_level: normalized.price_level }
        : {}),
      ...(normalized.certifications?.length
        ? { certifications: normalized.certifications }
        : {}),
      ...(normalized.languages_spoken?.length
        ? { languages_spoken: normalized.languages_spoken }
        : {}),
      ...(normalized.newsletter_featured !== undefined
        ? { newsletter_featured: normalized.newsletter_featured }
        : {}),
    };

    const data =
      await this.directoryRepository.insertDirectoryListing(safeData);

    if (locationIds?.length) {
      const rows = locationIds.map((lid, i) => ({
        listing_id: data.id,
        location_id: lid,
        display_order: i,
      }));
      await this.directoryRepository.insertListingLocations(rows);
    }

    await this.redisService.delByPattern('directory:*');
    await this.enqueueAdminNotification(
      data,
      data.email || (typeof listing.email === 'string' ? listing.email : null),
    );
    return data;
  }

  async updateDirectoryListing(
    id: string,
    updates: Partial<DirectoryListingRecord>,
    locationIds: string[],
    userId: string,
  ): Promise<DirectoryListingRecord> {
    const role = await this.userRolesRepo.getRole(userId);
    const listing = await this.directoryRepository.getDirectoryListingOwner(id);

    if (!listing || (listing.owner_user_id !== userId && role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    if (locationIds?.length) validateUUIDs(locationIds);

    const safeUpdates = stripProtectedFields(
      updates as Record<string, unknown>,
      ['status'],
    );

    if (safeUpdates.price_level !== undefined) {
      const normalizedPrice = normalizePriceLevel(safeUpdates.price_level);
      if (normalizedPrice !== undefined) {
        safeUpdates.price_level = normalizedPrice;
      } else {
        delete safeUpdates.price_level;
      }
    }

    const data = await this.directoryRepository.updateDirectoryListing(
      id,
      safeUpdates,
    );

    if (locationIds !== undefined) {
      if (locationIds.length) {
        const rows = locationIds.map((lid, i) => ({
          listing_id: id,
          location_id: lid,
          display_order: i,
        }));
        await this.directoryRepository.upsertListingLocations(rows);
        await this.directoryRepository.deleteListingLocations(id, locationIds);
      } else {
        await this.directoryRepository.deleteListingLocations(id);
      }
    }

    await this.redisService.delByPattern('directory:*');

    if ((updates as Record<string, unknown>).status === 'pending') {
      await this.enqueueAdminNotification(
        data,
        typeof updates.email === 'string' ? updates.email : data.email,
      );
    }

    return data;
  }

  async deleteDirectoryListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    const listing = await this.directoryRepository.getDirectoryListingOwner(id);

    if (!listing || (listing.owner_user_id !== userId && role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    await this.directoryRepository.deleteDirectoryListing(id);
    await this.redisService.delByPattern('directory:*');
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Views, Clicks & Analytics
  // ---------------------------------------------------------------------------
  async trackListingView(listingId: string): Promise<{ success: boolean }> {
    await this.directoryRepository.trackListingView(listingId);
    return { success: true };
  }

  async trackListingClick(
    listingId: string,
    clickType: string,
  ): Promise<{ success: boolean }> {
    await this.directoryRepository.trackListingClick(listingId, clickType);
    return { success: true };
  }

  async getDirectoryAnalyticsForOwner(
    days = 30,
    userId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.directoryRepository.getDirectoryAnalyticsForOwner(userId, days);
  }

  async getCategoryAnalyticsAverage(
    categoryId: string,
    days = 30,
  ): Promise<Record<string, unknown> | null> {
    return this.directoryRepository.getCategoryAnalyticsAverage(
      categoryId,
      days,
    );
  }

  // ---------------------------------------------------------------------------
  // Addons & Checkout Glue
  // ---------------------------------------------------------------------------
  async getListingAddons(
    listingId: string,
  ): Promise<Record<string, unknown>[]> {
    if (!UUID_RE.test(listingId)) return [];
    return this.directoryRepository.getListingAddons(listingId);
  }

  async createAddonCheckout(
    listingId: string,
    addonType: string,
    userId: string,
  ): Promise<{ url: string }> {
    validateUUIDs([listingId]);
    const { data, error } = await this.directoryRepository.invokeFunction(
      'create-addon-checkout',
      {
        body: { listingId, addonType },
        headers: { 'x-user-id': userId },
      },
    );
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    if (!data?.url) throw new Error('No checkout URL returned');
    return { url: data.url };
  }

  sendListingPaymentInstructions(
    businessName: string,
    tier: string,
    userId: string,
  ): { success: boolean } {
    void this.directoryRepository.invokeFunction('send-email', {
      body: {
        type: 'listing_payment_instructions',
        userId,
        data: {
          businessName,
          tier,
          link:
            (process.env.APP_URL ||
              process.env.SITE_URL ||
              process.env.NEXT_PUBLIC_SITE_URL ||
              'https://alanyaholidays.com') + '/profile',
        },
      },
    });
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Admin Moderation Operations
  // ---------------------------------------------------------------------------
  async getDirectoryListingsAdmin(
    filters: { status?: string; category?: string; query?: string },
    userId?: string,
  ): Promise<DirectoryListingRecord[]> {
    if (userId) {
      const role = await this.userRolesRepo.getRole(userId);
      if (role !== 'admin') throw new UnauthorizedException('Not authorized');
    }
    return this.directoryRepository.getDirectoryListingsAdmin(filters);
  }

  async getDirectoryListingsByStatus(
    status: 'approved' | 'rejected',
    category?: string,
  ): Promise<DirectoryListingRecord[]> {
    return this.directoryRepository.getDirectoryListingsByStatus(
      status,
      category,
    );
  }

  async getPendingDirectoryListings(): Promise<DirectoryListingRecord[]> {
    return this.directoryRepository.getPendingDirectoryListings();
  }

  async approveDirectoryListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const listing = await this.directoryRepository.updateListingStatus(id, {
      status: 'approved',
    });
    await this.redisService.delByPattern('directory:*');

    if (listing?.owner_user_id) {
      void this.directoryRepository.invokeFunction('send-email', {
        body: {
          type: 'listing_approved',
          userId: listing.owner_user_id,
          data: { title: listing.name ?? '' },
        },
      });
    }
    return { success: true };
  }

  async rejectDirectoryListing(
    id: string,
    reason: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (reason.length > 1000) {
      throw new Error('Rejection reason must be 1000 characters or fewer');
    }

    const listing = await this.directoryRepository.updateListingStatus(id, {
      status: 'rejected',
      rejection_reason: reason,
    });
    await this.redisService.delByPattern('directory:*');

    if (listing?.owner_user_id) {
      void this.directoryRepository.invokeFunction('send-email', {
        body: {
          type: 'listing_rejected',
          userId: listing.owner_user_id,
          data: { title: listing.name ?? '', reason },
        },
      });
    }
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Admin Curation Operations (Task 2.2)
  // ---------------------------------------------------------------------------
  async featureListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; is_featured: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (!UUID_RE.test(id)) throw new NotFoundException('Listing not found');

    const updated = await this.directoryRepository.updateDirectoryListing(id, {
      is_featured: true,
    });
    if (!updated) throw new NotFoundException('Listing not found');

    await this.redisService.delByPattern('directory:*');
    return { success: true, is_featured: true };
  }

  async unfeatureListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; is_featured: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (!UUID_RE.test(id)) throw new NotFoundException('Listing not found');

    const updated = await this.directoryRepository.updateDirectoryListing(id, {
      is_featured: false,
    });
    if (!updated) throw new NotFoundException('Listing not found');

    await this.redisService.delByPattern('directory:*');
    return { success: true, is_featured: false };
  }

  async verifyListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; is_verified: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (!UUID_RE.test(id)) throw new NotFoundException('Listing not found');

    const updated = await this.directoryRepository.updateDirectoryListing(id, {
      is_verified: true,
    });
    if (!updated) throw new NotFoundException('Listing not found');

    await this.redisService.delByPattern('directory:*');
    return { success: true, is_verified: true };
  }

  async unverifyListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; is_verified: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (!UUID_RE.test(id)) throw new NotFoundException('Listing not found');

    const updated = await this.directoryRepository.updateDirectoryListing(id, {
      is_verified: false,
    });
    if (!updated) throw new NotFoundException('Listing not found');

    await this.redisService.delByPattern('directory:*');
    return { success: true, is_verified: false };
  }

  async setListingScore(
    id: string,
    score: number,
    userId: string,
  ): Promise<{ success: boolean; base_score: number }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (
      score === undefined ||
      score === null ||
      isNaN(score) ||
      score < 0 ||
      score > 100
    ) {
      throw new BadRequestException('Score must be a number between 0 and 100');
    }

    if (!UUID_RE.test(id)) throw new NotFoundException('Listing not found');

    const updated = await this.directoryRepository.updateDirectoryListing(id, {
      base_score: score,
    });
    if (!updated) throw new NotFoundException('Listing not found');

    await this.redisService.delByPattern('directory:*');
    return { success: true, base_score: score };
  }
}
