import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DirectoryRepository } from '../directory.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { DirectoryClaimRecord } from '../types/directory.types';
import { SubmitClaimDto } from '../dto/submit-claim.dto';
import { UUID_RE } from '../domain/listing-input.schema';

@Injectable()
export class ListingClaimService {
  constructor(
    private readonly directoryRepository: DirectoryRepository,
    private readonly userRolesRepo: UserRolesRepository,
  ) {}

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

  async getListingClaims(userId?: string): Promise<DirectoryClaimRecord[]> {
    if (userId) {
      const role = await this.userRolesRepo.getRole(userId);
      if (role !== 'admin') throw new UnauthorizedException('Not authorized');
    }
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
