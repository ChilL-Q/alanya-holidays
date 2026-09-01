import { ListingClaimService } from './listing-claim.service';
import { DirectoryRepository } from '../directory.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { EmailOutboxRepository } from '../../bookings/email-outbox.repository';

describe('ListingClaimService verification tokens', () => {
  const claim = {
    id: 'claim-1',
    listing_id: '123e4567-e89b-42d3-a456-426614174000',
    user_id: '223e4567-e89b-42d3-a456-426614174001',
    email: 'owner@example.com',
    phone: '+905551234567',
    role: 'owner',
    business_name: 'Safe Business',
    contact_phone: '+905551234567',
    status: 'pending',
  };
  let repository: Record<string, jest.Mock>;
  let service: ListingClaimService;
  let emailOutbox: { enqueue: jest.Mock };
  let userRoles: { getRole: jest.Mock };

  beforeEach(() => {
    repository = {
      getDirectoryListingClaimEligibility: jest.fn().mockResolvedValue({
        creation_source: 'admin',
        can_claim: true,
      }),
      insertListingClaim: jest.fn().mockResolvedValue(claim),
      verifyClaimEmail: jest.fn(),
      invokeFunction: jest.fn().mockResolvedValue(undefined),
      callApproveListingClaimRpc: jest.fn(),
      getListingClaimById: jest.fn().mockResolvedValue(null),
    };
    userRoles = { getRole: jest.fn() };
    emailOutbox = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };
    service = new ListingClaimService(
      repository as unknown as DirectoryRepository,
      userRoles as unknown as UserRolesRepository,
      emailOutbox as unknown as EmailOutboxRepository,
    );
  });

  it('rejects forged claims for merchant-created listings before persisting sensitive claimant data', async () => {
    repository.getDirectoryListingClaimEligibility.mockResolvedValueOnce({
      creation_source: 'merchant',
      can_claim: false,
    });

    await expect(
      service.submitListingClaim(claim, claim.user_id),
    ).rejects.toThrow('This listing is not eligible for ownership claims');

    expect(repository.insertListingClaim).not.toHaveBeenCalled();
    expect(emailOutbox.enqueue).not.toHaveBeenCalled();
  });

  it('durably queues the raw token while storing only its SHA-256 hash on the claim', async () => {
    const result = await service.submitListingClaim(claim, claim.user_id);

    const persisted = repository.insertListingClaim.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    const emailRequest = emailOutbox.enqueue.mock.calls[0][0] as {
      to: string;
      type: string;
      data: { verificationToken: string };
    };
    const rawToken = emailRequest.data.verificationToken;

    expect(emailRequest.to).toBe(claim.email);
    expect(emailRequest.type).toBe('listing_claim_verification');
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(persisted.verification_token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(persisted).not.toHaveProperty('verification_token');
    expect(persisted.verification_token_hash).not.toBe(rawToken);
    expect(result).toEqual(claim);
    expect(result).not.toHaveProperty('verification_token_hash');
    expect(repository.invokeFunction).not.toHaveBeenCalled();
  });

  it('does not report claim submission success when the raw token cannot be durably queued', async () => {
    emailOutbox.enqueue.mockRejectedValueOnce(new Error('outbox unavailable'));

    await expect(
      service.submitListingClaim(claim, claim.user_id),
    ).rejects.toThrow('outbox unavailable');

    expect(repository.insertListingClaim).toHaveBeenCalledTimes(1);
    expect(emailOutbox.enqueue).toHaveBeenCalledTimes(1);
    expect(emailOutbox.enqueue.mock.calls[0][0]).toEqual({
      to: claim.email,
      type: 'listing_claim_verification',
      data: {
        claimantEmail: claim.email,
        businessName: claim.business_name,
        verificationToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      },
    });
  });

  it('waits for durable token enqueueing before returning the claim', async () => {
    let releaseEnqueue!: () => void;
    emailOutbox.enqueue.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        releaseEnqueue = resolve;
      }),
    );

    const submission = service.submitListingClaim(claim, claim.user_id);
    let settled = false;
    void submission.then(() => {
      settled = true;
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe(false);
    releaseEnqueue();
    await expect(submission).resolves.toEqual(claim);
  });

  it('returns only a sanitized success response after verification', async () => {
    repository.verifyClaimEmail.mockResolvedValue({
      claim_id: 'claim-1',
      listing_id: claim.listing_id,
      business_name: claim.business_name,
      claimant_email: claim.email,
      verification_token_hash: 'sensitive',
    });

    const result = await service.verifyClaimEmail('A'.repeat(43));

    expect(result).toEqual({ success: true });
    expect(repository.invokeFunction).toHaveBeenCalledWith('send-email', {
      body: {
        to: 'admin@alanyaholidays.com',
        type: 'admin_claim_notification',
        data: {
          businessName: claim.business_name,
          claimantEmail: claim.email,
          listingId: claim.listing_id,
        },
      },
    });
  });

  it('returns a sanitized failure without exposing the submitted token', async () => {
    repository.verifyClaimEmail.mockResolvedValue(null);
    const token = 'B'.repeat(43);

    await expect(service.verifyClaimEmail(token)).resolves.toEqual({
      success: false,
    });
  });

  it('never calls the privileged approval RPC for a forged non-admin caller', async () => {
    userRoles.getRole.mockResolvedValueOnce('user');

    await expect(
      service.approveListingClaim('claim-1', claim.user_id),
    ).rejects.toThrow('Not authorized');

    expect(repository.callApproveListingClaimRpc).not.toHaveBeenCalled();
  });

  it('uses only the serialized approval RPC for a valid admin claim', async () => {
    userRoles.getRole.mockResolvedValueOnce('admin');
    repository.callApproveListingClaimRpc.mockResolvedValueOnce({
      data: [
        {
          success: true,
          message: 'Claim approved successfully',
          listing_id: claim.listing_id,
        },
      ],
      error: null,
    });

    await expect(
      service.approveListingClaim('claim-1', 'admin-1'),
    ).resolves.toEqual({ success: true });

    expect(repository.callApproveListingClaimRpc).toHaveBeenCalledWith(
      'claim-1',
      'admin-1',
    );
    expect(repository.getListingClaimById).toHaveBeenCalledWith('claim-1');
  });

  it('does not report success when the serialized RPC rejects an ineligible or competing claim', async () => {
    userRoles.getRole.mockResolvedValueOnce('admin');
    repository.callApproveListingClaimRpc.mockResolvedValueOnce({
      data: [
        {
          success: false,
          message: 'Listing is not eligible for ownership claims',
          listing_id: claim.listing_id,
        },
      ],
      error: null,
    });

    await expect(
      service.approveListingClaim('claim-1', 'admin-1'),
    ).rejects.toThrow('Listing is not eligible for ownership claims');

    expect(repository.getListingClaimById).not.toHaveBeenCalled();
    expect(repository.invokeFunction).not.toHaveBeenCalled();
  });
});
