import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DirectoryRepository } from './directory.repository';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIER_LIMITS: Record<string, number> = {
  explorer: 5,
  voyager: 50,
  signature: 100,
  partner: 100,
};

function validateUUIDs(ids: string[]) {
  for (const id of ids) {
    if (!UUID_RE.test(id)) throw new Error(`Invalid UUID: ${id}`);
  }
}

@Injectable()
export class DirectoryService {
  constructor(private readonly directoryRepository: DirectoryRepository) {}

  async getDirectoryListings(
    page = 1,
    limit = 20,
    category?: string,
    sortBy = 'base_score',
  ) {
    const result = await this.directoryRepository.getDirectoryListings(
      page,
      limit,
      category,
      sortBy,
    );

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    };
  }

  async getDirectoryListing(id: string) {
    return this.directoryRepository.getDirectoryListingById(id);
  }

  async getDirectoryListingBySlug(slug: string) {
    return this.directoryRepository.getDirectoryListingBySlug(slug);
  }

  async getDirectoryListingsByCategory(categoryId: string) {
    return this.directoryRepository.getDirectoryListingsByCategory(categoryId);
  }

  async searchDirectoryListings(
    query: string,
    categoryId?: string,
    location?: string,
    page = 1,
    limit = 40,
  ) {
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
  async getFreeListings() {
    return this.directoryRepository.getFreeListings();
  }

  async getPremiumListings() {
    return this.directoryRepository.getPremiumListings();
  }

  async getSignatureListings() {
    return this.directoryRepository.getSignatureListings();
  }

  async getRecentlyClaimedListings(limit = 6) {
    return this.directoryRepository.getRecentlyClaimedListings(limit);
  }

  async voteForListing(listingId: string, vote: 1 | -1, userId: string) {
    const data = await this.directoryRepository.voteForListing(
      listingId,
      vote,
      userId,
    );
    return { netVotes: data[0].net_votes, userVote: data[0].user_vote };
  }

  async getUserVotesBatch(listingIds: string[], userId: string) {
    const data = await this.directoryRepository.getUserVotesBatch(
      listingIds,
      userId,
    );
    const votes: Record<string, 1 | -1> = {};
    for (const row of data as any[]) votes[row.listing_id] = row.vote;
    return votes;
  }

  async removeListingVote(listingId: string, userId: string) {
    const data = await this.directoryRepository.removeListingVote(
      listingId,
      userId,
    );
    return { netVotes: data[0].net_votes };
  }

  // Admin / CRUD
  async getMyDirectoryListings(userId: string) {
    return this.directoryRepository.getMyDirectoryListings(userId);
  }

  async createDirectoryListing(
    listing: any,
    locationIds: string[],
    userId: string,
  ) {
    if (locationIds?.length) validateUUIDs(locationIds);

    const tier = listing.tier || 'explorer';
    const gallery = Array.isArray(listing.gallery) ? listing.gallery : [];
    const limit = TIER_LIMITS[tier] ?? 5;
    if (gallery.length > limit)
      throw new Error(
        `Photo limit exceeded for ${tier} tier: max ${limit} photos`,
      );

    const safeData = {
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

    return data;
  }

  async updateDirectoryListing(
    id: string,
    updates: any,
    locationIds: string[],
    userId: string,
  ) {
    const role = await this.directoryRepository.getUserRole(userId);
    const listing = await this.directoryRepository.getDirectoryListingOwner(id);

    if (!listing || (listing.owner_user_id !== userId && role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    if (locationIds?.length) validateUUIDs(locationIds);

    const safeUpdates = { ...updates };
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
    return data;
  }

  async deleteDirectoryListing(id: string, userId: string) {
    const role = await this.directoryRepository.getUserRole(userId);
    const listing = await this.directoryRepository.getDirectoryListingOwner(id);

    if (!listing || (listing.owner_user_id !== userId && role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    await this.directoryRepository.deleteDirectoryListing(id);
    return { success: true };
  }

  async trackListingView(listingId: string) {
    await this.directoryRepository.trackListingView(listingId);
    return { success: true };
  }

  async trackListingClick(listingId: string, clickType: string) {
    await this.directoryRepository.trackListingClick(listingId, clickType);
    return { success: true };
  }

  // Admin / Moderation
  async getDirectoryListingsByStatus(
    status: 'approved' | 'rejected',
    category?: string,
  ) {
    return this.directoryRepository.getDirectoryListingsByStatus(
      status,
      category,
    );
  }

  async getPendingDirectoryListings() {
    return this.directoryRepository.getPendingDirectoryListings();
  }

  async approveDirectoryListing(id: string, userId: string) {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const listing = await this.directoryRepository.updateListingStatus(id, {
      status: 'approved',
    });

    if (listing?.owner_user_id) {
      this.directoryRepository.invokeFunction('send-email', {
        body: {
          type: 'listing_approved',
          userId: listing.owner_user_id,
          data: { title: listing.name },
        },
      });
    }
    return { success: true };
  }

  async rejectDirectoryListing(id: string, reason: string, userId: string) {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    if (reason.length > 1000)
      throw new Error('Rejection reason must be 1000 characters or fewer');

    const listing = await this.directoryRepository.updateListingStatus(id, {
      status: 'rejected',
      rejection_reason: reason,
    });

    if (listing?.owner_user_id) {
      this.directoryRepository.invokeFunction('send-email', {
        body: {
          type: 'listing_rejected',
          userId: listing.owner_user_id,
          data: { title: listing.name, reason },
        },
      });
    }
    return { success: true };
  }

  // Analytics
  async getDirectoryAnalyticsForOwner(days = 30, userId: string) {
    return this.directoryRepository.getDirectoryAnalyticsForOwner(userId, days);
  }

  async getCategoryAnalyticsAverage(categoryId: string, days = 30) {
    return this.directoryRepository.getCategoryAnalyticsAverage(
      categoryId,
      days,
    );
  }

  // Addons & Payments
  async getListingAddons(listingId: string) {
    validateUUIDs([listingId]);
    return this.directoryRepository.getListingAddons(listingId);
  }

  async createAddonCheckout(
    listingId: string,
    addonType: string,
    userId: string,
  ) {
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
  ) {
    this.directoryRepository.invokeFunction('send-email', {
      body: {
        type: 'listing_payment_instructions',
        userId,
        data: {
          businessName,
          tier,
          link: process.env.NEXT_PUBLIC_SITE_URL + '/profile',
        },
      },
    });
    return { success: true };
  }

  // Claims
  async submitListingClaim(claim: any, userId: string) {
    const safeData = {
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

    this.directoryRepository.invokeFunction('send-email', {
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

  async verifyClaimEmail(token: string) {
    const claim = await this.directoryRepository.verifyClaimEmail(token);
    if (!claim) return null;

    this.directoryRepository.invokeFunction('send-email', {
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

  async getListingClaims(userId: string) {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    return this.directoryRepository.getListingClaims();
  }

  async approveListingClaim(claimId: string, userId: string) {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const { data, error } =
      await this.directoryRepository.callApproveListingClaimRpc(claimId);
    if (error || !data || !data[0]?.success)
      throw new Error(data?.[0]?.message || 'Failed to approve claim');

    const claim = await this.directoryRepository.getListingClaimById(claimId);
    if (claim) {
      this.directoryRepository.invokeFunction('send-email', {
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

  async rejectListingClaim(claimId: string, reason: string, userId: string) {
    const role = await this.directoryRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const { data, error } =
      await this.directoryRepository.callRejectListingClaimRpc(claimId, reason);
    if (error || !data || !data[0]?.success)
      throw new Error(data?.[0]?.message || 'Failed to reject claim');

    const claim = await this.directoryRepository.getListingClaimById(claimId);
    if (claim) {
      this.directoryRepository.invokeFunction('send-email', {
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
