import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DirectoryRepository } from './directory.repository';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import { RedisService } from '../common/redis/redis.service';
import {
  DirectoryListingRecord,
  DirectoryListResponse,
  DirectoryClaimRecord,
  VoteResult,
} from './types/directory.types';
import { UserListingVote } from './dto/directory-vote.dto';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIER_LIMITS: Record<string, number> = {
  explorer: 5,
  voyager: 50,
  signature: 100,
  partner: 100,
};

function validateUUIDs(ids: string[]): void {
  for (const id of ids) {
    if (!UUID_RE.test(id)) throw new Error(`Invalid UUID: ${id}`);
  }
}

@Injectable()
export class DirectoryService {
  constructor(
    private readonly directoryRepository: DirectoryRepository,
    private readonly redisService: RedisService,
  ) {}

  async getDirectoryListings(
    page = 1,
    limit = 20,
    category?: string,
    sortBy = 'base_score',
  ): Promise<DirectoryListResponse> {
    const cacheKey = `directory:list:${page}:${limit}:${category || 'all'}:${sortBy}`;
    const cached =
      await this.redisService.getJson<DirectoryListResponse>(cacheKey);
    if (cached) return cached;

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

    if (response.data) {
      await this.redisService.setJson(cacheKey, response, 600); // 10 minutes TTL
    }
    return response;
  }

  async getDirectoryListing(
    id: string,
  ): Promise<DirectoryListingRecord | null> {
    const isUuid = UUID_RE.test(id);
    if (!isUuid) {
      return this.getDirectoryListingBySlug(id);
    }

    const cacheKey = `directory:item:${id}`;
    const cached =
      await this.redisService.getJson<DirectoryListingRecord>(cacheKey);
    if (cached) return cached;

    const data = await this.directoryRepository.getDirectoryListingById(id);
    if (data) {
      await this.redisService.setJson(cacheKey, data, 600);
    }
    return data;
  }

  async getDirectoryListingBySlug(
    slug: string,
  ): Promise<DirectoryListingRecord | null> {
    const cacheKey = `directory:slug:${slug}`;
    const cached =
      await this.redisService.getJson<DirectoryListingRecord>(cacheKey);
    if (cached) return cached;

    const data = await this.directoryRepository.getDirectoryListingBySlug(slug);
    if (data) {
      await this.redisService.setJson(cacheKey, data, 600);
    }
    return data;
  }

  async getDirectoryListingsByCategory(
    categoryId: string,
  ): Promise<DirectoryListingRecord[]> {
    const cacheKey = `directory:cat:${categoryId}`;
    const cached =
      await this.redisService.getJson<DirectoryListingRecord[]>(cacheKey);
    if (cached) return cached;

    const data =
      await this.directoryRepository.getDirectoryListingsByCategory(categoryId);
    if (data) {
      await this.redisService.setJson(cacheKey, data, 600);
    }
    return data;
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

  // Landing Page Listings
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

  // Admin / CRUD
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
    const limit = TIER_LIMITS[tier] ?? 5;
    if (gallery.length > limit) {
      throw new Error(
        `Photo limit exceeded for ${tier} tier: max ${limit} photos`,
      );
    }

    const rawName = typeof listing.name === 'string' ? listing.name : '';
    const rawShortDesc =
      typeof listing.short_description === 'string'
        ? listing.short_description
        : typeof listing.description === 'string'
          ? listing.description
          : '';
    const rawDesc =
      typeof listing.description === 'string' ? listing.description : null;
    const rawCategory =
      typeof listing.category_id === 'string'
        ? listing.category_id
        : typeof listing.category === 'string'
          ? listing.category
          : null;
    const rawWebsite =
      typeof listing.website === 'string'
        ? listing.website.slice(0, 500)
        : null;
    const rawWhatsapp =
      typeof listing.whatsapp === 'string'
        ? listing.whatsapp.slice(0, 50)
        : null;
    const rawLocation =
      typeof listing.location === 'string'
        ? listing.location
        : typeof listing.address === 'string'
          ? listing.address
          : '';
    const rawGmap =
      typeof listing.google_map_url === 'string'
        ? listing.google_map_url.slice(0, 500)
        : null;
    const rawVideo =
      typeof listing.video_url === 'string'
        ? listing.video_url.slice(0, 500)
        : null;
    const rawBooking =
      typeof listing.booking_url === 'string'
        ? listing.booking_url.slice(0, 500)
        : null;

    const safeData: Record<string, unknown> = {
      name: (rawName.trim() || 'Untitled Draft').slice(0, 200),
      short_description: rawShortDesc.slice(0, 500),
      description: rawDesc,
      category_id: rawCategory,
      website: rawWebsite,
      whatsapp: rawWhatsapp,
      gallery,
      location: rawLocation.slice(0, 200),
      google_map_url: rawGmap,
      video_url: rawVideo,
      booking_url: rawBooking,
      is_featured: false,
      is_verified: false,
      is_premium: false,
      tier,
      base_score: 0,
      status: 'draft',
      owner_user_id: userId,
      ...(listing.price_level !== undefined
        ? { price_level: listing.price_level }
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

    const rawName = typeof updates.name === 'string' ? updates.name : '';
    const name = rawName.trim();
    const rawCategory =
      typeof updates.category_id === 'string'
        ? updates.category_id
        : typeof updates.category === 'string'
          ? updates.category
          : '';
    const category_id = rawCategory.trim();
    const rawDesc =
      typeof updates.description === 'string'
        ? updates.description
        : typeof updates.short_description === 'string'
          ? updates.short_description
          : '';
    const description = rawDesc.trim();
    const rawAddress =
      typeof updates.location === 'string'
        ? updates.location
        : typeof updates.address === 'string'
          ? updates.address
          : '';
    const address = rawAddress.trim();
    const rawEmail = typeof updates.email === 'string' ? updates.email : '';
    const email = rawEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || name.length < 2) {
      throw new Error('Business name is required to publish');
    }
    if (!category_id) {
      throw new Error('Category is required to publish');
    }
    if (!description) {
      throw new Error('Description is required to publish');
    }
    if (!address) {
      throw new Error('Address is required to publish');
    }
    if (!email || !emailRegex.test(email)) {
      throw new Error('Valid email is required to publish');
    }

    const tier = (updates.tier as string) || 'explorer';
    const gallery = Array.isArray(updates.gallery) ? updates.gallery : [];
    const limit = TIER_LIMITS[tier] ?? 5;
    if (gallery.length > limit) {
      throw new Error(
        `Photo limit exceeded for ${tier} tier: max ${limit} photos`,
      );
    }

    if (locationIds?.length) validateUUIDs(locationIds);

    const safeUpdates: Record<string, unknown> = {
      ...updates,
      name,
      category_id,
      description,
      short_description: description.slice(0, 500),
      location: address,
      email,
      tier,
      gallery,
      status: 'pending',
      rejection_reason: null,
    };

    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.updated_at;
    delete safeUpdates.is_verified;
    delete safeUpdates.is_featured;
    delete safeUpdates.base_score;
    delete safeUpdates.subscription_id;
    delete safeUpdates.listing_locations;
    delete safeUpdates.owner_user_id;

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
    const limit = TIER_LIMITS[tier] ?? 5;
    if (gallery.length > limit)
      throw new Error(
        `Photo limit exceeded for ${tier} tier: max ${limit} photos`,
      );

    const safeData: Record<string, unknown> = {
      name: (listing.name ?? '').slice(0, 200),
      short_description: (listing.short_description ?? '').slice(0, 500),
      category_id: listing.category_id,
      website: listing.website?.slice(0, 500),
      whatsapp: listing.whatsapp?.slice(0, 50),
      gallery,
      location: (listing.location ?? '').slice(0, 200),
      google_map_url: listing.google_map_url?.slice(0, 500),
      video_url: listing.video_url?.slice(0, 500) || null,
      is_featured: false,
      is_verified: false,
      is_premium: false,
      tier,
      base_score: listing.base_score ?? 0,
      descriptions: listing.descriptions ?? {},
      status: 'pending',
      owner_user_id: userId,
      ...(listing.slug ? { slug: listing.slug.slice(0, 200) } : {}),
      ...(listing.price_level !== undefined
        ? { price_level: listing.price_level }
        : {}),
      ...(listing.certifications?.length
        ? { certifications: listing.certifications }
        : {}),
      ...(listing.languages_spoken?.length
        ? { languages_spoken: listing.languages_spoken }
        : {}),
      ...(listing.newsletter_featured !== undefined
        ? { newsletter_featured: listing.newsletter_featured }
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
    return data;
  }

  async updateDirectoryListing(
    id: string,
    updates: Partial<DirectoryListingRecord>,
    locationIds: string[],
    userId: string,
  ): Promise<DirectoryListingRecord> {
    const role = await this.directoryRepository.getUserRole(userId);
    const listing = await this.directoryRepository.getDirectoryListingOwner(id);

    if (!listing || (listing.owner_user_id !== userId && role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    if (locationIds?.length) validateUUIDs(locationIds);

    const safeUpdates: Record<string, unknown> = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.updated_at;
    delete safeUpdates.is_verified;
    delete safeUpdates.is_featured;
    delete safeUpdates.base_score;
    delete safeUpdates.subscription_id;
    delete safeUpdates.listing_locations;
    delete safeUpdates.status;
    delete safeUpdates.owner_user_id;
    delete safeUpdates.rejection_reason;

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
    return data;
  }

  async deleteDirectoryListing(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.directoryRepository.getUserRole(userId);
    const listing = await this.directoryRepository.getDirectoryListingOwner(id);

    if (!listing || (listing.owner_user_id !== userId && role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    await this.directoryRepository.deleteDirectoryListing(id);
    await this.redisService.delByPattern('directory:*');
    return { success: true };
  }

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

  // Admin / Moderation
  async getDirectoryListingsAdmin(
    filters: { status?: string; category?: string; query?: string },
    userId: string,
  ): Promise<DirectoryListingRecord[]> {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

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
    const role = await this.directoryRepository.getUserRole(userId);
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
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (reason.length > 1000)
      throw new Error('Rejection reason must be 1000 characters or fewer');

    const listing = await this.directoryRepository.updateListingStatus(id, {
      status: 'rejected',
      rejection_reason: reason,
    });

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

  // Analytics
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

  // Addons & Payments
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

  // Claims
  async submitListingClaim(
    claim: SubmitClaimDto,
    userId: string,
  ): Promise<DirectoryClaimRecord> {
    const safeData: Record<string, unknown> = {
      listing_id: claim.listing_id,
      user_id: userId,
      email: claim.email.trim(),
      phone: claim.phone.trim(),
      role: claim.role,
      additional_notes: claim.additional_notes?.trim() || null,
      business_name: claim.business_name.trim(),
      contact_phone: claim.contact_phone.trim(),
      whatsapp: claim.whatsapp?.trim() || null,
      website: claim.website?.trim() || null,
      address: claim.address?.trim() || null,
      description: claim.description?.trim() || null,
      status: 'pending',
    };

    const data = await this.directoryRepository.insertListingClaim(safeData);

    void this.directoryRepository.invokeFunction('send-email', {
      body: {
        type: 'listing_claim_verification',
        data: {
          claimantEmail: data.email,
          businessName: data.business_name,
          verificationToken: data.verification_token,
        },
      },
    });
    return data;
  }

  async verifyClaimEmail(token: string): Promise<DirectoryClaimRecord | null> {
    const claim = await this.directoryRepository.verifyClaimEmail(token);
    if (!claim) return null;

    void this.directoryRepository.invokeFunction('send-email', {
      body: {
        type: 'admin_claim_notification',
        data: {
          businessName: claim.business_name,
          claimantEmail: claim.email,
          listingId: claim.listing_id,
        },
      },
    });
    return claim;
  }

  async getListingClaims(userId: string): Promise<DirectoryClaimRecord[]> {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    return this.directoryRepository.getListingClaims();
  }

  async getMyListingClaims(userId: string): Promise<DirectoryClaimRecord[]> {
    if (!UUID_RE.test(userId)) return [];
    return this.directoryRepository.getMyListingClaims(userId);
  }

  async approveListingClaim(
    claimId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const { data, error } =
      await this.directoryRepository.callApproveListingClaimRpc(
        claimId,
        userId,
      );
    const firstResult = data?.[0];
    if (error || !firstResult?.success)
      throw new Error(firstResult?.message || 'Failed to approve claim');

    const claim = await this.directoryRepository.getListingClaimById(claimId);
    if (claim) {
      void this.directoryRepository.invokeFunction('send-email', {
        body: {
          type: 'listing_claim_approved',
          data: {
            claimantEmail: claim.email,
            businessName: claim.business_name,
          },
        },
      });
    }
    return { success: true };
  }

  async rejectListingClaim(
    claimId: string,
    reason: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const { data, error } =
      await this.directoryRepository.callRejectListingClaimRpc(
        claimId,
        reason,
        userId,
      );
    const firstResult = data?.[0];
    if (error || !firstResult?.success)
      throw new Error(firstResult?.message || 'Failed to reject claim');

    const claim = await this.directoryRepository.getListingClaimById(claimId);
    if (claim) {
      void this.directoryRepository.invokeFunction('send-email', {
        body: {
          type: 'listing_claim_rejected',
          data: {
            claimantEmail: claim.email,
            businessName: claim.business_name,
            rejectionReason: reason,
          },
        },
      });
    }
    return { success: true };
  }
}
