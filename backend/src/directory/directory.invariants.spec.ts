import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { DirectoryRepository } from './directory.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { RedisService } from '../common/redis/redis.service';
import { DirectoryListingRecord } from './types/directory.types';

describe('Directory Invariants Safety Net (PR-1 Invariant Spec)', () => {
  let service: DirectoryService;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockRepository: {
    insertDirectoryListing: jest.Mock;
    updateDirectoryListing: jest.Mock;
    deleteDirectoryListing: jest.Mock;
    getDirectoryListingOwner: jest.Mock;
    updateListingStatus: jest.Mock;
    invokeFunction: jest.Mock;
    insertListingLocations: jest.Mock;
    upsertListingLocations: jest.Mock;
    deleteListingLocations: jest.Mock;
  };

  const userAlice = '11111111-1111-4111-a111-111111111111';
  const userBob = '22222222-2222-4222-a222-222222222222';
  const adminUser = '33333333-3333-4333-a333-333333333333';
  const draftId = '44444444-4444-4444-a444-444444444444';

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      insertDirectoryListing: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: draftId, ...data }),
        ),
      updateDirectoryListing: jest
        .fn()
        .mockImplementation((id, updates) =>
          Promise.resolve({ id, ...updates }),
        ),
      deleteDirectoryListing: jest.fn().mockResolvedValue(undefined),
      getDirectoryListingOwner: jest.fn(),
      updateListingStatus: jest.fn().mockResolvedValue({
        id: draftId,
        name: 'Test Biz',
        owner_user_id: userAlice,
      }),
      invokeFunction: jest.fn().mockResolvedValue({ data: null, error: null }),
      insertListingLocations: jest.fn().mockResolvedValue(undefined),
      upsertListingLocations: jest.fn().mockResolvedValue(undefined),
      deleteListingLocations: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectoryService,
        {
          provide: DirectoryRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
        {
          provide: RedisService,
          useValue: {
            getJson: jest.fn().mockResolvedValue(null),
            setJson: jest.fn().mockResolvedValue(undefined),
            delByPattern: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DirectoryService>(DirectoryService);
  });

  describe('1. Protected Fields Firewall Invariants', () => {
    it('1.1 saveDraft (new draft): strips/overrides is_verified, is_featured, base_score, owner_user_id, status', async () => {
      const maliciousPayload = {
        name: 'Hacked Listing',
        is_verified: true,
        is_featured: true,
        base_score: 9999,
        owner_user_id: userBob, // Attempt to assign draft to someone else
        status: 'approved', // Attempt to bypass moderation
        rejection_reason: 'Fake reason',
        subscription_id: 'sub_123',
      } as unknown as Partial<DirectoryListingRecord>;

      await service.saveDraft(maliciousPayload, [], userAlice);

      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledTimes(1);
      const passedData = mockRepository.insertDirectoryListing.mock.calls[0][0];

      // Invariants: protected fields MUST be sanitized
      expect(passedData.is_verified).toBe(false);
      expect(passedData.is_featured).toBe(false);
      expect(passedData.base_score).toBe(0);
      expect(passedData.owner_user_id).toBe(userAlice);
      expect(passedData.status).toBe('draft');
      expect(passedData.name).toBe('Hacked Listing');
    });

    it('1.2 saveDraft (existing draft): overrides protected fields on update', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userAlice,
      });

      const maliciousPayload = {
        name: 'Updated Name',
        is_verified: true,
        base_score: 500,
        status: 'approved',
      } as unknown as Partial<DirectoryListingRecord>;

      await service.saveDraft(maliciousPayload, [], userAlice, draftId);

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledTimes(1);
      const passedData = mockRepository.updateDirectoryListing.mock.calls[0][1];

      expect(passedData.is_verified).toBe(false);
      expect(passedData.base_score).toBe(0);
      expect(passedData.status).toBe('draft');
      expect(passedData.owner_user_id).toBe(userAlice);
    });

    it('1.3 publishDraft: strips protected fields, forces status to pending and resets rejection_reason to null', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userAlice,
      });

      const publishPayload = {
        name: 'Valid Coffee Shop',
        category_id: 'cat-cafe',
        description: 'Best coffee in Alanya',
        location: 'Damlatas Cd. No 10',
        email: 'coffee@example.com',
        is_verified: true,
        is_featured: true,
        base_score: 999,
        owner_user_id: userBob,
        status: 'approved',
        rejection_reason: 'Previous note',
      } as unknown as Partial<DirectoryListingRecord>;

      await service.publishDraft(draftId, publishPayload, [], userAlice);

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledTimes(1);
      const passedUpdates =
        mockRepository.updateDirectoryListing.mock.calls[0][1];

      // Invariants
      expect(passedUpdates.status).toBe('pending');
      expect(passedUpdates.rejection_reason).toBeNull();
      expect(passedUpdates.is_verified).toBeUndefined();
      expect(passedUpdates.is_featured).toBeUndefined();
      expect(passedUpdates.base_score).toBeUndefined();
      expect(passedUpdates.owner_user_id).toBeUndefined();
      expect(passedUpdates.id).toBeUndefined();
    });

    it('1.4 updateDirectoryListing: deletes protected fields from update payload', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userAlice,
      });

      const updatePayload = {
        name: 'Renamed Shop',
        is_verified: true,
        is_featured: true,
        base_score: 1000,
        status: 'approved',
        owner_user_id: userBob,
        rejection_reason: 'bypass',
        subscription_id: 'sub_hacked',
      } as unknown as Partial<DirectoryListingRecord>;

      await service.updateDirectoryListing(
        draftId,
        updatePayload,
        [],
        userAlice,
      );

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledTimes(1);
      const passedUpdates =
        mockRepository.updateDirectoryListing.mock.calls[0][1];

      expect(passedUpdates.name).toBe('Renamed Shop');
      expect(passedUpdates.is_verified).toBeUndefined();
      expect(passedUpdates.is_featured).toBeUndefined();
      expect(passedUpdates.base_score).toBeUndefined();
      expect(passedUpdates.status).toBeUndefined();
      expect(passedUpdates.owner_user_id).toBeUndefined();
      expect(passedUpdates.rejection_reason).toBeUndefined();
      expect(passedUpdates.subscription_id).toBeUndefined();
    });
  });

  describe('2. Tier Photo Limits Invariants', () => {
    const testTierLimit = async (
      tier: string,
      maxPhotos: number,
      method: 'saveDraft' | 'publishDraft' | 'createDirectoryListing',
    ) => {
      const validGallery = Array.from(
        { length: maxPhotos },
        (_, i) => `photo-${i}.jpg`,
      );
      const overflowGallery = Array.from(
        { length: maxPhotos + 1 },
        (_, i) => `photo-${i}.jpg`,
      );

      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: userAlice,
      });

      const baseValidPayload: any = {
        tier,
        name: 'Tier Test Listing',
        category_id: 'cat-1',
        description: 'Description long enough',
        location: 'Alanya Center',
        email: 'test@example.com',
      };

      if (method === 'saveDraft') {
        // Under/at limit -> Success
        await expect(
          service.saveDraft(
            { ...baseValidPayload, gallery: validGallery },
            [],
            userAlice,
          ),
        ).resolves.toBeDefined();

        // Over limit -> Rejection
        await expect(
          service.saveDraft(
            { ...baseValidPayload, gallery: overflowGallery },
            [],
            userAlice,
          ),
        ).rejects.toThrow(
          `Photo limit exceeded for ${tier} tier: max ${maxPhotos} photos`,
        );
      } else if (method === 'publishDraft') {
        await expect(
          service.publishDraft(
            draftId,
            { ...baseValidPayload, gallery: validGallery },
            [],
            userAlice,
          ),
        ).resolves.toBeDefined();

        await expect(
          service.publishDraft(
            draftId,
            { ...baseValidPayload, gallery: overflowGallery },
            [],
            userAlice,
          ),
        ).rejects.toThrow(
          `Photo limit exceeded for ${tier} tier: max ${maxPhotos} photos`,
        );
      } else if (method === 'createDirectoryListing') {
        await expect(
          service.createDirectoryListing(
            { ...baseValidPayload, gallery: validGallery },
            [],
            userAlice,
          ),
        ).resolves.toBeDefined();

        await expect(
          service.createDirectoryListing(
            { ...baseValidPayload, gallery: overflowGallery },
            [],
            userAlice,
          ),
        ).rejects.toThrow(
          `Photo limit exceeded for ${tier} tier: max ${maxPhotos} photos`,
        );
      }
    };

    it('2.1 Explorer tier enforces exactly max 5 photos across saveDraft, publishDraft, createDirectoryListing', async () => {
      await testTierLimit('explorer', 5, 'saveDraft');
      await testTierLimit('explorer', 5, 'publishDraft');
      await testTierLimit('explorer', 5, 'createDirectoryListing');
    });

    it('2.2 Voyager tier enforces exactly max 50 photos', async () => {
      await testTierLimit('voyager', 50, 'saveDraft');
      await testTierLimit('voyager', 50, 'publishDraft');
      await testTierLimit('voyager', 50, 'createDirectoryListing');
    });

    it('2.3 Signature tier enforces exactly max 100 photos', async () => {
      await testTierLimit('signature', 100, 'saveDraft');
      await testTierLimit('signature', 100, 'publishDraft');
      await testTierLimit('signature', 100, 'createDirectoryListing');
    });

    it('2.4 Partner tier enforces exactly max 100 photos', async () => {
      await testTierLimit('partner', 100, 'saveDraft');
      await testTierLimit('partner', 100, 'publishDraft');
      await testTierLimit('partner', 100, 'createDirectoryListing');
    });

    it('2.5 Default tier (undefined/unknown) falls back to 5 photos', async () => {
      const overflowGallery = Array.from(
        { length: 6 },
        (_, i) => `photo-${i}.jpg`,
      );
      await expect(
        service.saveDraft(
          { name: 'Fallback Tier', gallery: overflowGallery },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Photo limit exceeded for explorer tier: max 5 photos');
    });
  });

  describe('3. Draft State Machine Invariants', () => {
    it('3.1 Direct transition from draft to approved via publishDraft or saveDraft is impossible', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userAlice,
      });

      const _res = await service.publishDraft(
        draftId,
        {
          name: 'Biz Name',
          category_id: 'cat-1',
          description: 'Valid Desc',
          location: 'Center',
          email: 'valid@example.com',
          status: 'approved',
        },
        [],
        userAlice,
      );

      // Status must only ever become 'pending'
      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        draftId,
        expect.objectContaining({ status: 'pending' }),
      );
      expect(mockRepository.updateDirectoryListing).not.toHaveBeenCalledWith(
        draftId,
        expect.objectContaining({ status: 'approved' }),
      );
    });

    it('3.2 approveDirectoryListing is restricted to admin role only', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(
        service.approveDirectoryListing(draftId, userAlice),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockRepository.updateListingStatus).not.toHaveBeenCalled();

      // Admin role succeeds
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      const res = await service.approveDirectoryListing(draftId, adminUser);
      expect(res).toEqual({ success: true });
      expect(mockRepository.updateListingStatus).toHaveBeenCalledWith(draftId, {
        status: 'approved',
      });
    });

    it('3.3 rejectDirectoryListing is restricted to admin role only and validates reason length', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(
        service.rejectDirectoryListing(
          draftId,
          'Incomplete documents',
          userAlice,
        ),
      ).rejects.toThrow(UnauthorizedException);

      // Admin with valid reason
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      const res = await service.rejectDirectoryListing(
        draftId,
        'Incomplete documents',
        adminUser,
      );
      expect(res).toEqual({ success: true });
      expect(mockRepository.updateListingStatus).toHaveBeenCalledWith(draftId, {
        status: 'rejected',
        rejection_reason: 'Incomplete documents',
      });

      // Admin with excessively long reason (> 1000 chars)
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      const excessiveReason = 'a'.repeat(1001);
      await expect(
        service.rejectDirectoryListing(draftId, excessiveReason, adminUser),
      ).rejects.toThrow('Rejection reason must be 1000 characters or fewer');
    });
  });

  describe('4. Ownership Isolation Invariants', () => {
    it('4.1 saveDraft with existing draftId throws UnauthorizedException if caller is not owner', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userAlice, // Owned by Alice
      });

      // Bob attempts to save/edit Alice's draft
      await expect(
        service.saveDraft(
          { name: 'Bob Editing Alice Draft' },
          [],
          userBob,
          draftId,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRepository.updateDirectoryListing).not.toHaveBeenCalled();
    });

    it('4.2 publishDraft throws UnauthorizedException if caller is not owner', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userAlice,
      });

      // Bob attempts to publish Alice's draft
      await expect(
        service.publishDraft(
          draftId,
          {
            name: 'Bob Publishing Alice Draft',
            category_id: 'cat-1',
            description: 'Valid Desc',
            location: 'Center',
            email: 'bob@example.com',
          },
          [],
          userBob,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRepository.updateDirectoryListing).not.toHaveBeenCalled();
    });

    it('4.3 updateDirectoryListing & deleteDirectoryListing block non-owners unless admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('user');
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: userAlice,
      });

      // Bob cannot update Alice's listing
      await expect(
        service.updateDirectoryListing(
          draftId,
          { name: 'New Name' },
          [],
          userBob,
        ),
      ).rejects.toThrow(UnauthorizedException);

      // Bob cannot delete Alice's listing
      await expect(
        service.deleteDirectoryListing(draftId, userBob),
      ).rejects.toThrow(UnauthorizedException);

      // Admin CAN update and delete Alice's listing
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      await expect(
        service.updateDirectoryListing(
          draftId,
          { name: 'Admin Name' },
          [],
          adminUser,
        ),
      ).resolves.toBeDefined();
      await expect(
        service.deleteDirectoryListing(draftId, adminUser),
      ).resolves.toEqual({
        success: true,
      });
    });
  });
});
