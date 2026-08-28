import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { DirectoryRepository } from '../directory.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { DirectoryClaimRecord } from '../types/directory.types';
import { SubmitClaimDto } from '../dto/submit-claim.dto';
import { UUID_RE } from '../domain/listing-input.schema';
import { createHash, randomBytes } from 'crypto';
import { EmailOutboxRepository } from '../../bookings/email-outbox.repository';

@Injectable()
export class ListingClaimService {
  constructor(
    private readonly directoryRepository: DirectoryRepository,
    private readonly userRolesRepo: UserRolesRepository,
    @Optional() private readonly emailOutbox?: EmailOutboxRepository,
  ) {}

  async submitListingClaim(
    claim: SubmitClaimDto,
    userId: string,
  ): Promise<DirectoryClaimRecord> {
    const verificationToken = randomBytes(32).toString('base64url');
    const verificationTokenHash = createHash('sha256')
      .update(verificationToken)
      .digest('hex');
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
      verification_token_hash: verificationTokenHash,
    };

    const data = await this.directoryRepository.insertListingClaim(safeData);

    if (!this.emailOutbox) {
      throw new Error('Email outbox unavailable');
    }
    await this.emailOutbox.enqueue({
      to: data.email,
      type: 'listing_claim_verification',
      data: {
        claimantEmail: data.email,
        businessName: data.business_name,
        verificationToken,
      },
    });
    return data;
  }

  async verifyClaimEmail(token: string): Promise<{ success: boolean }> {
    const claim = await this.directoryRepository.verifyClaimEmail(token);
    if (!claim) return { success: false };

    void this.directoryRepository.invokeFunction('send-email', {
      body: {
        to: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@alanyaholidays.com',
        type: 'admin_claim_notification',
        data: {
          businessName: claim.business_name,
          claimantEmail: claim.claimant_email,
          listingId: claim.listing_id,
        },
      },
    });
    return { success: true };
  }

  async getListingClaims(
    userId?: string,
    page = 1,
    limit = 20,
  ): Promise<DirectoryClaimRecord[]> {
    if (userId) {
      const role = await this.userRolesRepo.getRole(userId);
      if (role !== 'admin') throw new UnauthorizedException('Not authorized');
    }
    return this.directoryRepository.getListingClaims(page, limit);
  }

  async getMyListingClaims(userId: string): Promise<DirectoryClaimRecord[]> {
    if (!UUID_RE.test(userId)) return [];
    return this.directoryRepository.getMyListingClaims(userId);
  }

  async approveListingClaim(
    claimId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.resolveClaim(claimId, userId, 'approve');
  }

  async rejectListingClaim(
    claimId: string,
    reason: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.resolveClaim(claimId, userId, 'reject', reason);
  }

  // ---------------------------------------------------------------------------
  // Shared Private Claim Resolution Core
  // ---------------------------------------------------------------------------
  private async resolveClaim(
    claimId: string,
    userId: string,
    action: 'approve' | 'reject',
    reason?: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const rpcResult =
      action === 'approve'
        ? await this.directoryRepository.callApproveListingClaimRpc(
            claimId,
            userId,
          )
        : await this.directoryRepository.callRejectListingClaimRpc(
            claimId,
            reason || '',
            userId,
          );

    const firstResult = rpcResult.data?.[0];
    if (rpcResult.error || !firstResult?.success) {
      throw new Error(firstResult?.message || `Failed to ${action} claim`);
    }

    const claim = await this.directoryRepository.getListingClaimById(claimId);
    if (claim) {
      const emailType =
        action === 'approve'
          ? 'listing_claim_approved'
          : 'listing_claim_rejected';
      const emailData =
        action === 'approve'
          ? { claimantEmail: claim.email, businessName: claim.business_name }
          : {
              claimantEmail: claim.email,
              businessName: claim.business_name,
              rejectionReason: reason,
            };

      void this.directoryRepository.invokeFunction('send-email', {
        body: {
          type: emailType,
          data: emailData,
        },
      });
    }

    return { success: true };
  }
}
