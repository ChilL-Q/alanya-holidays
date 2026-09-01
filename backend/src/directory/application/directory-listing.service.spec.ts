import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryListingService } from './directory-listing.service';
import { DirectoryRepository } from '../directory.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { RedisService } from '../../common/redis/redis.service';
import { EmailOutboxRepository } from '../../bookings/email-outbox.repository';
import { PAYMENT_GATEWAY } from '../../webhooks/domain/payment-gateway.interface';
import { BillingService } from '../../billing/billing.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DirectoryListingService - Admin Email Outbox Enqueueing (Task 2.4)', () => {
  let service: DirectoryListingService;
  let mockRepository: {
    insertDirectoryListing: jest.Mock;
    updateDirectoryListing: jest.Mock;
    getDirectoryListingOwner: jest.Mock;
    insertListingLocations: jest.Mock;
    upsertListingLocations: jest.Mock;
    deleteListingLocations: jest.Mock;
    updateListingStatus: jest.Mock;
    invokeFunction: jest.Mock;
    getListingAddons: jest.Mock;
    getDirectoryAnalyticsForOwner: jest.Mock;
  };
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockRedisService: {
    delByPattern: jest.Mock;
    getJson: jest.Mock;
    setJson: jest.Mock;
  };
  let mockEmailOutbox: { enqueue: jest.Mock };
  let mockPaymentGateway: { createAddonCheckoutSession: jest.Mock };
  let mockBillingService: { hasActivePremiumAccess: jest.Mock };

  const validListingId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
  const validOwnerId = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';

  beforeEach(async () => {
    mockRepository = {
      insertDirectoryListing: jest.fn(),
      updateDirectoryListing: jest.fn(),
      getDirectoryListingOwner: jest.fn(),
      insertListingLocations: jest.fn().mockResolvedValue(undefined),
      upsertListingLocations: jest.fn().mockResolvedValue(undefined),
      deleteListingLocations: jest.fn().mockResolvedValue(undefined),
      updateListingStatus: jest.fn(),
      invokeFunction: jest.fn(),
      getListingAddons: jest.fn().mockResolvedValue([]),
      getDirectoryAnalyticsForOwner: jest.fn().mockResolvedValue([]),
    };
    mockUserRolesRepo = {
      getRole: jest.fn().mockResolvedValue('user'),
    };
    mockRedisService = {
      delByPattern: jest.fn().mockResolvedValue(undefined),
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
    };
    mockPaymentGateway = {
      createAddonCheckoutSession: jest
        .fn()
        .mockResolvedValue({ url: 'https://checkout.stripe.test/x' }),
    };
    mockBillingService = {
      hasActivePremiumAccess: jest.fn().mockResolvedValue(true),
    };
    mockEmailOutbox = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectoryListingService,
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
          useValue: mockRedisService,
        },
        {
          provide: EmailOutboxRepository,
          useValue: mockEmailOutbox,
        },
        {
          provide: PAYMENT_GATEWAY,
          useValue: mockPaymentGateway,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
      ],
    }).compile();

    service = module.get<DirectoryListingService>(DirectoryListingService);
  });

  afterEach(() => {
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    jest.clearAllMocks();
  });

  describe('createDirectoryListing', () => {
    it('should enqueue admin_listing_notification to email outbox when creating a pending listing', async () => {
      const createdRecord = {
        id: validListingId,
        name: 'Alanya Seaside Grill',
        email: 'merchant@example.com',
        category_id: 'restaurants',
        tier: 'voyager',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(createdRecord);

      const result = await service.createDirectoryListing(
        {
          name: 'Alanya Seaside Grill',
          email: 'merchant@example.com',
          category_id: 'restaurants',
          tier: 'voyager',
        },
        [],
        validOwnerId,
      );

      expect(result).toEqual(createdRecord);
      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({ creation_source: 'merchant' }),
      );
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledTimes(1);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith({
        to: 'admin@alanyaholidays.com',
        type: 'admin_listing_notification',
        data: {
          listingId: validListingId,
          listingTitle: 'Alanya Seaside Grill',
          ownerEmail: 'merchant@example.com',
          category: 'restaurants',
          tier: 'voyager',
        },
      });
    });

    it('should respect custom process.env.ADMIN_NOTIFICATION_EMAIL when set', async () => {
      process.env.ADMIN_NOTIFICATION_EMAIL = 'custom-admin@alanyaholidays.com';
      const createdRecord = {
        id: validListingId,
        name: 'Sunset Boat Tour',
        email: 'captain@example.com',
        category_id: 'activities',
        tier: 'signature',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(createdRecord);

      await service.createDirectoryListing(
        {
          name: 'Sunset Boat Tour',
          email: 'captain@example.com',
          category_id: 'activities',
          tier: 'signature',
        },
        [],
        validOwnerId,
      );

      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'custom-admin@alanyaholidays.com',
        }),
      );
    });

    it('should NOT fail listing creation if email outbox enqueue throws an error (non-blocking failure safe)', async () => {
      const createdRecord = {
        id: validListingId,
        name: 'Spa & Wellness Center',
        email: 'spa@example.com',
        category_id: 'wellness',
        tier: 'explorer',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(createdRecord);
      mockEmailOutbox.enqueue.mockRejectedValue(
        new Error('DB connection timeout'),
      );

      const result = await service.createDirectoryListing(
        {
          name: 'Spa & Wellness Center',
          email: 'spa@example.com',
          category_id: 'wellness',
          tier: 'explorer',
        },
        [],
        validOwnerId,
      );

      expect(result).toEqual(createdRecord);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('createAdminDirectoryListing', () => {
    it('persists an unowned admin-source listing after verifying the admin role', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockRepository.insertDirectoryListing.mockImplementation(
        (listing: Record<string, unknown>) => ({
          id: validListingId,
          ...listing,
        }),
      );

      await service.createAdminDirectoryListing(
        {
          name: 'Admin curated museum',
          category_id: 'attractions',
          status: 'approved',
        },
        validOwnerId,
      );

      expect(mockUserRolesRepo.getRole).toHaveBeenCalledWith(validOwnerId);
      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          creation_source: 'admin',
          owner_user_id: null,
          claimed_at: null,
          status: 'approved',
        }),
      );
    });

    it('lets an admin explicitly reclassify an imported listing as claimable', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockRepository.updateDirectoryListing.mockResolvedValue({
        id: validListingId,
        creation_source: 'admin',
        can_claim: true,
      });

      await service.updateAdminDirectoryListing(
        validListingId,
        { creation_source: 'admin' },
        validOwnerId,
      );

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        validListingId,
        { creation_source: 'admin' },
      );
    });
  });

  describe('publishDraft', () => {
    it('should enqueue admin_listing_notification when a draft is submitted / published to pending', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        id: validListingId,
        owner_user_id: validOwnerId,
        status: 'draft',
      });
      const updatedRecord = {
        id: validListingId,
        name: 'Dolphin Scuba Diving',
        email: 'dive@example.com',
        category_id: 'water-sports',
        tier: 'signature',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.updateDirectoryListing.mockResolvedValue(updatedRecord);

      const result = await service.publishDraft(
        validListingId,
        {
          name: 'Dolphin Scuba Diving',
          category_id: 'water-sports',
          description: 'Best diving in Alanya with certified instructors',
          location: 'Alanya Marina',
          email: 'dive@example.com',
          tier: 'signature',
        },
        [],
        validOwnerId,
      );

      expect(result).toEqual(updatedRecord);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledTimes(1);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith({
        to: 'admin@alanyaholidays.com',
        type: 'admin_listing_notification',
        data: {
          listingId: validListingId,
          listingTitle: 'Dolphin Scuba Diving',
          ownerEmail: 'dive@example.com',
          category: 'water-sports',
          tier: 'signature',
        },
      });
    });

    it('should NOT fail publishDraft if email outbox enqueue rejects (non-blocking failure safe)', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        id: validListingId,
        owner_user_id: validOwnerId,
        status: 'draft',
      });
      const updatedRecord = {
        id: validListingId,
        name: 'Paragliding Club',
        email: 'fly@example.com',
        category_id: 'activities',
        tier: 'explorer',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.updateDirectoryListing.mockResolvedValue(updatedRecord);
      mockEmailOutbox.enqueue.mockRejectedValue(
        new Error('Outbox RPC failure'),
      );

      const result = await service.publishDraft(
        validListingId,
        {
          name: 'Paragliding Club',
          category_id: 'activities',
          description: 'Tandem paragliding experience over Cleopatra beach',
          location: 'Cleopatra Beach',
          email: 'fly@example.com',
          tier: 'explorer',
        },
        [],
        validOwnerId,
      );

      expect(result).toEqual(updatedRecord);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveDraft', () => {
    it('should NOT enqueue email notification when saving a draft with status = draft', async () => {
      const draftRecord = {
        id: validListingId,
        name: 'Draft Restaurant',
        email: 'draft@example.com',
        status: 'draft',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(draftRecord);

      await service.saveDraft(
        {
          name: 'Draft Restaurant',
          email: 'draft@example.com',
        },
        [],
        validOwnerId,
      );

      expect(mockEmailOutbox.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('updateDirectoryListing', () => {
    it('should enqueue admin_listing_notification when status is updated to pending', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        id: validListingId,
        owner_user_id: validOwnerId,
      });
      const updatedRecord = {
        id: validListingId,
        name: 'Updated Hotel',
        email: 'hotel@example.com',
        category_id: 'hotels',
        tier: 'signature',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.updateDirectoryListing.mockResolvedValue(updatedRecord);

      await service.updateDirectoryListing(
        validListingId,
        {
          name: 'Updated Hotel',
          status: 'pending',
        },
        [],
        validOwnerId,
      );

      expect(mockEmailOutbox.enqueue).toHaveBeenCalledTimes(1);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith({
        to: 'admin@alanyaholidays.com',
        type: 'admin_listing_notification',
        data: {
          listingId: validListingId,
          listingTitle: 'Updated Hotel',
          ownerEmail: 'hotel@example.com',
          category: 'hotels',
          tier: 'signature',
        },
      });
    });

    it('should NOT enqueue admin_listing_notification when status is not updated to pending', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        id: validListingId,
        owner_user_id: validOwnerId,
      });
      const updatedRecord = {
        id: validListingId,
        name: 'Updated Hotel Name',
        email: 'hotel@example.com',
        category_id: 'hotels',
        status: 'active',
        owner_user_id: validOwnerId,
      };
      mockRepository.updateDirectoryListing.mockResolvedValue(updatedRecord);

      await service.updateDirectoryListing(
        validListingId,
        {
          name: 'Updated Hotel Name',
        },
        [],
        validOwnerId,
      );

      expect(mockEmailOutbox.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('approveDirectoryListing & rejectDirectoryListing', () => {
    it('should not enqueue admin_listing_notification on approveDirectoryListing', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockRepository.updateListingStatus.mockResolvedValue({
        id: validListingId,
        name: 'Approved Bistro',
        owner_user_id: validOwnerId,
        status: 'approved',
      });

      await service.approveDirectoryListing(validListingId, 'admin-uuid');

      expect(mockEmailOutbox.enqueue).not.toHaveBeenCalled();
    });

    it('should invalidate directory redis cache on rejectDirectoryListing', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockRepository.updateListingStatus.mockResolvedValue({
        id: validListingId,
        name: 'Rejected Bistro',
        owner_user_id: validOwnerId,
        status: 'rejected',
      });

      await service.rejectDirectoryListing(
        validListingId,
        'Incomplete photos',
        'admin-uuid',
      );

      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('directory:*');
      expect(mockEmailOutbox.enqueue).not.toHaveBeenCalled();
    });

    it('does not report a missing listing as successfully moderated', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockRepository.updateListingStatus.mockResolvedValue(null);

      await expect(
        service.approveDirectoryListing(validListingId, 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.rejectDirectoryListing(
          validListingId,
          'No longer available',
          'admin-uuid',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('when EmailOutboxRepository is not injected (optional dependency)', () => {
    let serviceWithoutOutbox: DirectoryListingService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DirectoryListingService,
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
            useValue: mockRedisService,
          },
        ],
      }).compile();

      serviceWithoutOutbox = module.get<DirectoryListingService>(
        DirectoryListingService,
      );
    });

    it('should proceed normally without throwing error on createDirectoryListing', async () => {
      const createdRecord = {
        id: validListingId,
        name: 'No Outbox Listing',
        email: 'test@example.com',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(createdRecord);

      const result = await serviceWithoutOutbox.createDirectoryListing(
        {
          name: 'No Outbox Listing',
          email: 'test@example.com',
        },
        [],
        validOwnerId,
      );

      expect(result).toEqual(createdRecord);
    });
  });

  describe('Adversarial & Boundary Challenge Suite', () => {
    it('should handle non-Error thrown objects during email outbox enqueueing without crashing', async () => {
      const createdRecord = {
        id: validListingId,
        name: 'Graceful Error Recovery Listing',
        email: 'resilient@example.com',
        category_id: 'restaurants',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(createdRecord);
      // Simulate raw string rejection (non-Error object)
      mockEmailOutbox.enqueue.mockRejectedValue('Raw string outbox failure');

      const result = await service.createDirectoryListing(
        {
          name: 'Graceful Error Recovery Listing',
          email: 'resilient@example.com',
        },
        [],
        validOwnerId,
      );

      expect(result).toEqual(createdRecord);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledTimes(1);
    });

    it('should handle outbox rejection during updateDirectoryListing when updating status to pending', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        id: validListingId,
        owner_user_id: validOwnerId,
      });
      const updatedRecord = {
        id: validListingId,
        name: 'Resilient Hotel',
        email: 'hotel@example.com',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.updateDirectoryListing.mockResolvedValue(updatedRecord);
      mockEmailOutbox.enqueue.mockRejectedValue(
        new Error('Outbox DB unreachable'),
      );

      const result = await service.updateDirectoryListing(
        validListingId,
        {
          name: 'Resilient Hotel',
          status: 'pending',
        },
        [],
        validOwnerId,
      );

      expect(result).toEqual(updatedRecord);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledTimes(1);
    });

    it('should NOT enqueue notification on status transitions to approved, rejected, or active via updateDirectoryListing', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        id: validListingId,
        owner_user_id: validOwnerId,
      });

      for (const targetStatus of ['approved', 'rejected', 'active', 'draft']) {
        mockEmailOutbox.enqueue.mockClear();
        mockRepository.updateDirectoryListing.mockResolvedValue({
          id: validListingId,
          name: 'Status Test Listing',
          status: targetStatus,
          owner_user_id: validOwnerId,
        });

        await service.updateDirectoryListing(
          validListingId,
          { status: targetStatus },
          [],
          validOwnerId,
        );

        expect(mockEmailOutbox.enqueue).not.toHaveBeenCalled();
      }
    });

    it('should safely handle listing with null/empty email, category, tier, and name', async () => {
      const bareRecord = {
        id: validListingId,
        name: null,
        email: null,
        category_id: null,
        tier: null,
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(bareRecord);

      await service.createDirectoryListing(
        {
          name: '',
          email: '',
          category_id: '',
        },
        [],
        validOwnerId,
      );

      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith({
        to: 'admin@alanyaholidays.com',
        type: 'admin_listing_notification',
        data: {
          listingId: validListingId,
          listingTitle: 'Untitled Listing',
          ownerEmail: '',
          category: 'general',
          tier: 'explorer',
        },
      });
    });

    it('should safely handle listing with extremely long title, emojis, unicode, and HTML special characters', async () => {
      const longComplexTitle =
        '🌊 🏖️ Grand Sunset Boutique Resort & Turkish Hammam <script>alert("XSS")</script> \' " & ' +
        'A'.repeat(500);
      const complexRecord = {
        id: validListingId,
        name: longComplexTitle,
        email: 'complex@example.com',
        category_id: 'wellness',
        tier: 'signature',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(complexRecord);

      await service.createDirectoryListing(
        {
          name: longComplexTitle,
          email: 'complex@example.com',
          category_id: 'wellness',
          tier: 'signature',
        },
        [],
        validOwnerId,
      );

      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith({
        to: 'admin@alanyaholidays.com',
        type: 'admin_listing_notification',
        data: {
          listingId: validListingId,
          listingTitle: longComplexTitle,
          ownerEmail: 'complex@example.com',
          category: 'wellness',
          tier: 'signature',
        },
      });
    });

    it('should fallback to default admin email when ADMIN_NOTIFICATION_EMAIL is empty string', async () => {
      process.env.ADMIN_NOTIFICATION_EMAIL = '';
      const createdRecord = {
        id: validListingId,
        name: 'Empty Env Listing',
        email: 'owner@example.com',
        status: 'pending',
        owner_user_id: validOwnerId,
      };
      mockRepository.insertDirectoryListing.mockResolvedValue(createdRecord);

      await service.createDirectoryListing(
        {
          name: 'Empty Env Listing',
          email: 'owner@example.com',
        },
        [],
        validOwnerId,
      );

      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@alanyaholidays.com',
        }),
      );
    });
  });
  describe('createAddonCheckout', () => {
    it('throws when the caller does not own the listing', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: 'someone-else',
      });

      await expect(
        service.createAddonCheckout(
          validListingId,
          'verified_badge',
          validOwnerId,
        ),
      ).rejects.toThrow('You do not own this listing');
      expect(
        mockPaymentGateway.createAddonCheckoutSession,
      ).not.toHaveBeenCalled();
    });

    it('throws when an active addon of the same type already exists', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: validOwnerId,
      });
      mockRepository.getListingAddons.mockResolvedValue([
        { addon_type: 'verified_badge', status: 'active' },
      ]);

      await expect(
        service.createAddonCheckout(
          validListingId,
          'verified_badge',
          validOwnerId,
        ),
      ).rejects.toThrow('This add-on is already active for the listing');
      expect(
        mockPaymentGateway.createAddonCheckoutSession,
      ).not.toHaveBeenCalled();
    });

    it('throws on invalid addonType', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: validOwnerId,
      });

      await expect(
        service.createAddonCheckout(
          validListingId,
          'instant_booking',
          validOwnerId,
        ),
      ).rejects.toThrow('Invalid request');
    });

    it('delegates to the payment gateway when ownership and dedupe pass', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: validOwnerId,
      });
      mockRepository.getListingAddons.mockResolvedValue([
        { addon_type: 'seasonal_placement', status: 'active' },
      ]);

      const result = await service.createAddonCheckout(
        validListingId,
        'verified_badge',
        validOwnerId,
      );

      expect(result).toEqual({ url: 'https://checkout.stripe.test/x' });
      expect(
        mockPaymentGateway.createAddonCheckoutSession,
      ).toHaveBeenCalledWith({
        userId: validOwnerId,
        listingId: validListingId,
        addonType: 'verified_badge',
      });
    });
  });

  describe('getDirectoryAnalyticsForOwner', () => {
    it('rejects analytics when the owner has no active premium access', async () => {
      mockBillingService.hasActivePremiumAccess.mockResolvedValueOnce(false);

      await expect(
        service.getDirectoryAnalyticsForOwner(30, validOwnerId),
      ).rejects.toThrow(ForbiddenException);
      expect(
        mockRepository.getDirectoryAnalyticsForOwner,
      ).not.toHaveBeenCalled();
    });
  });
});
