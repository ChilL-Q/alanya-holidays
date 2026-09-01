import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryController } from './directory.controller';
import { DirectoryListingService } from './application/directory-listing.service';
import { ListingClaimService } from './application/listing-claim.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { DirectoryClaimRecord } from './types/directory.types';

describe('Challenger M3 Adversarial Tests: Claims Security & Isolation', () => {
  let controller: DirectoryController;

  const mockService = {
    getMyListingClaims: jest.fn(),
    getMyDirectoryListings: jest.fn(),
    saveDraft: jest.fn(),
    publishDraft: jest.fn(),
    submitClaim: jest.fn(),
    verifyClaim: jest.fn(),
    approveClaim: jest.fn(),
    rejectClaim: jest.fn(),
    getDirectoryListingsAdmin: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryController],
      providers: [
        {
          provide: DirectoryListingService,
          useValue: mockService,
        },
        {
          provide: ListingClaimService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<DirectoryController>(DirectoryController);
  });

  describe('GET /directory/me/claims Endpoint Isolation & Integrity', () => {
    it('enforces that claims are strictly filtered by req.user.id', async () => {
      const userAId = 'a1111111-1111-1111-1111-111111111111';
      const userBId = 'b2222222-2222-2222-2222-222222222222';

      const userAClaims: DirectoryClaimRecord[] = [
        {
          id: 'claim-user-a',
          listing_id: 'l-1',
          user_id: userAId,
          business_name: 'User A Boutique',
          email: 'usera@test.com',
          phone: '+90 555 111 0001',
          role: 'Owner',
          contact_phone: '+90 555 111 0001',
          status: 'pending',
          created_at: '2026-08-20T10:00:00Z',
        },
      ];

      mockService.getMyListingClaims.mockImplementation((userId: string) => {
        if (userId === userAId) return Promise.resolve(userAClaims);
        if (userId === userBId) return Promise.resolve([]);
        return Promise.resolve([]);
      });

      // Execute request as User A
      const userA: AuthUser = { id: userAId };
      const resA = await controller.getMyListingClaims(userA);
      expect(resA).toEqual(userAClaims);
      expect(mockService.getMyListingClaims).toHaveBeenCalledWith(userAId);

      // Execute request as User B
      const userB: AuthUser = { id: userBId };
      const resB = await controller.getMyListingClaims(userB);
      expect(resB).toEqual([]);
      expect(mockService.getMyListingClaims).toHaveBeenCalledWith(userBId);
    });

    it('handles all claim lifecycle statuses (pending, verified, approved, rejected)', async () => {
      const userId = 'c3333333-3333-3333-3333-333333333333';
      const multiStatusClaims: DirectoryClaimRecord[] = [
        {
          id: 'claim-1',
          listing_id: 'l-1',
          user_id: userId,
          business_name: 'Pending Restaurant',
          email: 'owner@test.com',
          phone: '+90 555 111 0001',
          role: 'Owner',
          contact_phone: '+90 555 111 0001',
          status: 'pending',
          created_at: '2026-08-10T10:00:00Z',
        },
        {
          id: 'claim-2',
          listing_id: 'l-2',
          user_id: userId,
          business_name: 'Verified Hotel',
          email: 'owner@test.com',
          phone: '+90 555 111 0002',
          role: 'General Manager',
          contact_phone: '+90 555 111 0002',
          status: 'verified',
          created_at: '2026-08-11T10:00:00Z',
        },
        {
          id: 'claim-3',
          listing_id: 'l-3',
          user_id: userId,
          business_name: 'Approved Spa',
          email: 'owner@test.com',
          phone: '+90 555 111 0003',
          role: 'Owner',
          contact_phone: '+90 555 111 0003',
          status: 'approved',
          created_at: '2026-08-12T10:00:00Z',
        },
        {
          id: 'claim-4',
          listing_id: 'l-4',
          user_id: userId,
          business_name: 'Rejected Cafe',
          email: 'owner@test.com',
          phone: '+90 555 111 0004',
          role: 'Representative',
          contact_phone: '+90 555 111 0004',
          status: 'rejected',
          rejection_reason: 'Invalid trade registry license',
          created_at: '2026-08-13T10:00:00Z',
        },
      ];

      mockService.getMyListingClaims.mockResolvedValueOnce(multiStatusClaims);

      const user: AuthUser = { id: userId };
      const res = await controller.getMyListingClaims(user);

      expect(res).toHaveLength(4);
      expect(res.map((c) => c.status)).toEqual([
        'pending',
        'verified',
        'approved',
        'rejected',
      ]);
      expect(res.find((c) => c.status === 'rejected')?.rejection_reason).toBe(
        'Invalid trade registry license',
      );
    });

    it('propagates service rejections if database operation fails', async () => {
      mockService.getMyListingClaims.mockRejectedValueOnce(
        new Error('Database connectivity error'),
      );

      const user: AuthUser = { id: 'd4444444-4444-4444-4444-444444444444' };
      await expect(controller.getMyListingClaims(user)).rejects.toThrow(
        'Database connectivity error',
      );
    });
  });
});
