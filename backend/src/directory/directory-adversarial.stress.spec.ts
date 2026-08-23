import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryService } from './directory.service';
import { DirectoryRepository } from './directory.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { RedisService } from '../common/redis/redis.service';

describe('Adversarial Stress Test: Directory Security & Prototype Pollution Invariants', () => {
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
  const userAttacker = '66666666-6666-4666-a666-666666666666';
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
      updateListingStatus: jest.fn().mockResolvedValue({ id: draftId }),
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

  describe('1. Prototype Pollution & Object Prototype Injection Attacks', () => {
    it('1.1 Payload with Object.create(prototypeWithProtectedFields) does not leak prototype fields to safeData', async () => {
      // Prototype has malicious values
      const proto = {
        is_verified: true,
        is_featured: true,
        base_score: 99999,
        status: 'approved',
        owner_user_id: userAttacker,
      };

      const maliciousDraft = Object.create(proto);
      maliciousDraft.name = 'Normal Draft Name';

      await service.saveDraft(maliciousDraft, [], userAlice);

      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledTimes(1);
      const inserted = mockRepository.insertDirectoryListing.mock.calls[0][0];

      // Explicit invariants in safeData MUST override or define own properties
      expect(inserted.is_verified).toBe(false);
      expect(inserted.is_featured).toBe(false);
      expect(inserted.base_score).toBe(0);
      expect(inserted.status).toBe('draft');
      expect(inserted.owner_user_id).toBe(userAlice);
    });

    it('1.2 Tier lookup with prototype keys (__proto__, toString, valueOf) falls back safely without bypassing photo limits', async () => {
      // If attacker sets tier: '__proto__' with 50 photos
      const gallery50 = Array.from({ length: 50 }, (_, i) => `photo-${i}.jpg`);
      const maliciousPayload = {
        name: 'Prototype Tier Attack',
        tier: '__proto__' as any,
        gallery: gallery50,
      };

      // TIER_LIMITS['__proto__'] in JS might evaluate to Object.prototype if not handled.
      // If it evaluates to Object.prototype, gallery.length (50) > Object.prototype evaluates to FALSE in JS!
      // Let's test if our service throws or if tier '__proto__' allows 50 photos!
      const attempt = service.saveDraft(maliciousPayload, [], userAlice);

      // Invariant: An invalid tier must never bypass the max 5 default photo limit!
      // If TIER_LIMITS[tier] is not a number or unknown, it must enforce the default 5 photos limit!
      await expect(attempt).rejects.toThrow();
    });

    it('1.3 Tier lookup with "toString" or "constructor" enforces fallback limit', async () => {
      const gallery10 = Array.from({ length: 10 }, (_, i) => `photo-${i}.jpg`);
      const maliciousPayload = {
        name: 'Prototype toString Attack',
        tier: 'toString' as any,
        gallery: gallery10,
      };

      await expect(
        service.saveDraft(maliciousPayload, [], userAlice),
      ).rejects.toThrow();
    });

    it('1.4 publishDraft strips injected constructor and prototype properties', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userAlice,
      });

      const maliciousPayload = {
        name: 'Valid Coffee Shop',
        category_id: 'cat-cafe',
        description: 'Best coffee in Alanya',
        location: 'Damlatas Cd. No 10',
        email: 'coffee@example.com',
        is_verified: true,
        is_featured: true,
        base_score: 9999,
        status: 'approved',
        __proto__: {
          is_verified: true,
          status: 'approved',
        },
      } as any;

      await service.publishDraft(draftId, maliciousPayload, [], userAlice);

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledTimes(1);
      const updates = mockRepository.updateDirectoryListing.mock.calls[0][1];

      expect(updates.status).toBe('pending');
      expect(updates.is_verified).toBeUndefined();
      expect(updates.is_featured).toBeUndefined();
      expect(updates.base_score).toBeUndefined();
    });
  });

  describe('2. Malicious and Degenerate Payloads', () => {
    it('2.1 Non-array gallery payload does not crash saveDraft or publishDraft', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: userAlice,
      });

      // string gallery
      await expect(
        service.saveDraft(
          { name: 'String Gallery', gallery: 'not-an-array' as any },
          [],
          userAlice,
        ),
      ).resolves.toBeDefined();

      // object with fake length
      await expect(
        service.saveDraft(
          { name: 'Fake Array', gallery: { length: 100 } as any },
          [],
          userAlice,
        ),
      ).resolves.toBeDefined();
    });

    it('2.2 Invalid UUIDs in locationIds are strictly rejected across all methods', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: userAlice,
      });
      mockUserRolesRepo.getRole.mockResolvedValue('user');

      const sqlInjectionLocation = ["' OR '1'='1"];

      await expect(
        service.saveDraft({ name: 'SQL Loc' }, sqlInjectionLocation, userAlice),
      ).rejects.toThrow('Invalid UUID');

      await expect(
        service.publishDraft(
          draftId,
          {
            name: 'Valid Shop',
            category_id: 'cat-1',
            description: 'Valid Desc',
            location: 'Valid Loc',
            email: 'test@example.com',
          },
          sqlInjectionLocation,
          userAlice,
        ),
      ).rejects.toThrow('Invalid UUID');

      await expect(
        service.createDirectoryListing(
          { name: 'SQL Loc' },
          sqlInjectionLocation,
          userAlice,
        ),
      ).rejects.toThrow('Invalid UUID');

      await expect(
        service.updateDirectoryListing(
          draftId,
          { name: 'SQL Loc' },
          sqlInjectionLocation,
          userAlice,
        ),
      ).rejects.toThrow('Invalid UUID');
    });

    it('2.3 Rejects publishDraft when mandatory business fields are empty, missing, or whitespace only', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: userAlice,
      });

      const baseValid = {
        name: 'Valid Name',
        category_id: 'cat-1',
        description: 'Valid Desc',
        location: 'Valid Address',
        email: 'info@valid.com',
      };

      // Blank name
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, name: '   ' },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Business name is required to publish');

      // Short name (< 2 chars)
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, name: 'A' },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Business name is required to publish');

      // Blank category
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, category_id: '  ' },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Category is required to publish');

      // Blank description
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, description: '  ' },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Description is required to publish');

      // Blank address / location
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, location: '  ', address: ' ' as any },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Address is required to publish');

      // Invalid email formats
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, email: 'not-an-email' },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Valid email is required to publish');
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, email: 'user@' },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Valid email is required to publish');
      await expect(
        service.publishDraft(
          draftId,
          { ...baseValid, email: '@domain.com' },
          [],
          userAlice,
        ),
      ).rejects.toThrow('Valid email is required to publish');
    });
  });
});
