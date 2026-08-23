import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PROPERTIES_REPOSITORY } from './domain';
import { RedisService } from '../common/redis/redis.service';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockRedisService: {
    getJson: jest.Mock;
    setJson: jest.Mock;
    delByPattern: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      getPropertiesByIds: jest.fn().mockResolvedValue([]),
      insertProperty: jest.fn(),
      getProperties: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getPropertyByUUID: jest.fn(),
      getPropertyByRefId: jest.fn(),
      getProfile: jest.fn(),
      getAvailableProperties: jest.fn().mockResolvedValue([]),
      getPropertiesByHost: jest.fn().mockResolvedValue([]),
      getAdminProperties: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getPropertyHostId: jest.fn(),
      updateProperty: jest.fn().mockResolvedValue(undefined),
      deletePropertyCascading: jest.fn().mockResolvedValue(undefined),
      getPropertyTypes: jest.fn().mockResolvedValue(['apartment', 'villa']),
      getPropertyLocations: jest.fn().mockResolvedValue(['Cleopatra Beach']),
      getPropertiesByLocation: jest
        .fn()
        .mockResolvedValue({ data: [], count: 0 }),
      getICalFeeds: jest.fn().mockResolvedValue([]),
      insertICalFeed: jest.fn().mockResolvedValue({ id: 'feed-1' }),
      syncICalFeed: jest.fn().mockResolvedValue(5),
      getICalFeedPropertyId: jest.fn(),
      removeICalFeed: jest.fn().mockResolvedValue(undefined),
      getPropertyAvailability: jest.fn().mockResolvedValue([]),
      deleteAvailability: jest.fn().mockResolvedValue(undefined),
      insertAvailability: jest.fn().mockResolvedValue(undefined),
      syncPropertyCalendar: jest.fn().mockResolvedValue({ success: true }),
      getUnavailableDates: jest.fn().mockResolvedValue([]),
      getReviews: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getReviewCount: jest.fn().mockResolvedValue(0),
      getExistingReview: jest.fn().mockResolvedValue(null),
      getBookingCountForReview: jest.fn().mockResolvedValue(1),
      insertReview: jest.fn().mockResolvedValue(undefined),
      getReviewUserId: jest.fn(),
      deleteReview: jest.fn().mockResolvedValue(undefined),
      updateReviewFlag: jest.fn().mockResolvedValue(undefined),
      getFlaggedReviews: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      bulkDeleteReviews: jest.fn().mockResolvedValue(undefined),
      invokeEmailFunction: jest.fn(),
    };

    mockRedisService = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: PROPERTIES_REPOSITORY,
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

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('getProperty', () => {
    it('should return cached property if present in Redis', async () => {
      mockRedisService.getJson.mockResolvedValueOnce({ id: 'cached-prop' });

      const res = await service.getProperty('prop-1');
      expect(res).toEqual({ id: 'cached-prop' });
      expect(mockRepository.getPropertyByUUID).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if property by UUID is missing', async () => {
      mockRepository.getPropertyByUUID.mockResolvedValueOnce(null);

      await expect(
        service.getProperty('12345678-1234-1234-1234-123456789abc'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fetch property by ref ID and attach host profile', async () => {
      mockRepository.getPropertyByRefId.mockResolvedValueOnce({
        id: 'prop-1',
        host_id: 'host-100',
        title: 'Seaview Apartment',
      });
      mockRepository.getProfile.mockResolvedValueOnce({
        full_name: 'Jane Host',
      });

      const res = await service.getProperty('1001');

      expect(res.title).toBe('Seaview Apartment');
      expect(res.host).toEqual({ full_name: 'Jane Host' });
      expect(mockRedisService.setJson).toHaveBeenCalledWith(
        'properties:item:1001',
        expect.objectContaining({ title: 'Seaview Apartment' }),
        600,
      );
    });
  });

  describe('createProperty', () => {
    it('should insert property and invalidate cache', async () => {
      const propData = {
        title: 'New Villa',
        type: 'villa',
        location: 'Alanya',
        price_per_night: 200,
      };
      mockRepository.insertProperty.mockResolvedValueOnce({
        id: 'prop-new',
        ...propData,
      });

      const res = await service.createProperty(propData, 'host-1');

      expect(res).toEqual({ id: 'prop-new', ...propData });
      expect(mockRepository.insertProperty).toHaveBeenCalledWith(
        propData,
        'host-1',
      );
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith(
        'properties:*',
      );
    });
  });

  describe('getProperties', () => {
    it('should return cached list if present', async () => {
      mockRedisService.getJson.mockResolvedValueOnce({
        data: [{ id: 'p1' }],
        count: 1,
      });

      const res = await service.getProperties({ page: 1, limit: 10 });
      expect(res).toEqual({ data: [{ id: 'p1' }], count: 1 });
      expect(mockRepository.getProperties).not.toHaveBeenCalled();
    });

    it('should fetch from repository and cache for 5 minutes', async () => {
      mockRepository.getProperties.mockResolvedValueOnce({
        data: [{ id: 'p2' }],
        count: 1,
      });

      const res = await service.getProperties({ page: 1, limit: 10 });
      expect(res).toEqual({ data: [{ id: 'p2' }], count: 1 });
      expect(mockRedisService.setJson).toHaveBeenCalledWith(
        expect.stringContaining('properties:list:'),
        { data: [{ id: 'p2' }], count: 1 },
        300,
      );
    });
  });

  describe('updateProperty', () => {
    it('should throw UnauthorizedException if caller is not host and not admin', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'owner-host',
        title: 'Villa',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.updateProperty('prop-1', { title: 'New' }, 'other-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should strip status and sensitive ical fields when updating', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'owner-host',
        title: 'Villa',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      const res = await service.updateProperty(
        'prop-1',
        {
          title: 'New Title',
          status: 'approved',
          ical_token: 'secret',
        },
        'owner-host',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateProperty).toHaveBeenCalledWith('prop-1', {
        title: 'New Title',
      });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith(
        'properties:*',
      );
    });
  });

  describe('updatePropertyStatus', () => {
    it('should update status and rejection reason when rejected', async () => {
      const res = await service.updatePropertyStatus(
        'prop-1',
        'rejected',
        'Incomplete photos',
        'admin-1',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateProperty).toHaveBeenCalledWith('prop-1', {
        status: 'rejected',
        rejection_reason: 'Incomplete photos',
      });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith(
        'properties:*',
      );
    });

    it('should clear rejection reason when approved', async () => {
      const res = await service.updatePropertyStatus(
        'prop-1',
        'approved',
        undefined,
        'admin-1',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateProperty).toHaveBeenCalledWith('prop-1', {
        status: 'approved',
        rejection_reason: null,
      });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith(
        'properties:*',
      );
    });
  });

  describe('deleteProperty', () => {
    it('should throw NotFoundException if property does not exist', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce(null);

      await expect(
        service.deleteProperty('prop-unknown', undefined, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if not owner and not admin', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'owner-1',
        title: 'Apartment',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.deleteProperty('prop-1', undefined, 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fallback to soft archiving when cascading delete fails', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'owner-1',
        title: 'Apartment',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('owner-1');
      mockRepository.deletePropertyCascading.mockRejectedValueOnce(
        new Error('Foreign key violation'),
      );

      const res = await service.deleteProperty('prop-1', undefined, 'owner-1');

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateProperty).toHaveBeenCalledWith('prop-1', {
        status: 'rejected',
        title: 'Apartment (Deleted)',
        location: 'Archived',
      });
    });
  });

  describe('iCal operations', () => {
    it('should add iCal feed when authorized', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'host-1',
        title: 'Villa',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('host');

      const res = await service.addICalFeed(
        'prop-1',
        'Airbnb',
        'https://airbnb.com/ical',
        'host-1',
      );

      expect(res).toEqual({ id: 'feed-1' });
      expect(mockRepository.insertICalFeed).toHaveBeenCalledWith(
        'prop-1',
        'Airbnb',
        'https://airbnb.com/ical',
      );
    });

    it('should sync property iCal feeds', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'host-1',
        title: 'Villa',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('host');
      mockRepository.getICalFeeds.mockResolvedValueOnce([
        { id: 'feed-1' },
        { id: 'feed-2' },
      ]);
      mockRepository.syncICalFeed
        .mockResolvedValueOnce(3)
        .mockRejectedValueOnce(new Error('Sync failed'));

      const res = await service.syncPropertyICal('prop-1', 'host-1');

      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({ feedId: 'feed-1', success: true, count: 3 });
      expect(res[1].feedId).toBe('feed-2');
      expect(res[1].success).toBe(false);
      expect(res[1].error).toBeDefined();
    });
  });

  describe('reviews operations', () => {
    it('should throw BadRequestException if review already exists', async () => {
      mockRepository.getExistingReview.mockResolvedValueOnce({ id: 'rev-1' });

      await expect(
        service.addReview(
          { property_id: 'prop-1', rating: 5, comment: 'Great' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user has never booked the property', async () => {
      mockRepository.getExistingReview.mockResolvedValueOnce(null);
      mockRepository.getBookingCountForReview.mockResolvedValueOnce(0);

      await expect(
        service.addReview(
          { property_id: 'prop-1', rating: 5, comment: 'Great' },
          'user-1',
        ),
      ).rejects.toThrow('You can only review properties you have booked');
    });

    it('should insert review and send notification email to host', async () => {
      mockRepository.getExistingReview.mockResolvedValueOnce(null);
      mockRepository.getBookingCountForReview.mockResolvedValueOnce(1);
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'host-1',
        title: 'Sea Villa',
      });

      const res = await service.addReview(
        { property_id: 'prop-1', rating: 5, comment: 'Loved the stay!' },
        'user-1',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.insertReview).toHaveBeenCalledWith({
        property_id: 'prop-1',
        rating: 5,
        comment: 'Loved the stay!',
        user_id: 'user-1',
      });
      expect(mockRepository.invokeEmailFunction).toHaveBeenCalledWith({
        type: 'new_review',
        userId: 'host-1',
        data: {
          itemTitle: 'Sea Villa',
          rating: 5,
          comment: 'Loved the stay!',
          guestName: 'A Guest',
          link: 'https://alanyaholidays.com/property/prop-1',
        },
      });
    });
  });
  describe('property drafts', () => {
    it('creates a draft with protected fields stripped and status forced to draft', async () => {
      mockRepository.insertProperty.mockResolvedValue({ id: 'prop-1' });

      const result = await service.savePropertyDraft(
        {
          title: 'Sea Villa',
          type: 'villa',
          location: 'Mahmutlar',
          price_per_night: 100,
          // Attempted protected-field injection
          host_id: 'attacker',
          is_featured: true,
          rejection_reason: 'x',
        },
        'user-1',
      );

      expect(result).toEqual({ id: 'prop-1' });
      const [payload] = mockRepository.insertProperty.mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(payload.status).toBe('draft');
      // host_id is stamped by the repository from the authenticated user
      expect(
        (mockRepository.insertProperty.mock.calls[0] as [unknown, string])[1],
      ).toBe('user-1');
      expect(payload.host_id).toBeUndefined();
      expect(payload.is_featured).toBeUndefined();
      expect(payload.rejection_reason).toBeUndefined();
    });

    it('defaults an empty title to Untitled Draft', async () => {
      mockRepository.insertProperty.mockResolvedValue({ id: 'prop-2' });

      await service.savePropertyDraft({}, 'user-1');

      expect(
        (
          mockRepository.insertProperty.mock.calls[0] as [
            Record<string, unknown>,
          ]
        )[0].title,
      ).toBe('Untitled Draft');
    });

    it('rejects saving over a foreign draft', async () => {
      mockRepository.getPropertyHostId.mockResolvedValue({
        host_id: 'owner-1',
        title: 'X',
      });

      await expect(
        service.savePropertyDraft({ draftId: 'd-1' }, 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('publishes only with all required fields and transitions draft -> pending', async () => {
      mockRepository.getPropertyHostId.mockResolvedValue({
        host_id: 'user-1',
        title: 'Old',
      });

      await expect(
        service.publishPropertyDraft(
          '550e8400-e29b-41d4-a716-446655440001',
          { title: '', type: 'villa' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.publishPropertyDraft(
          '550e8400-e29b-41d4-a716-446655440001',
          { title: 'Nice Villa', type: 'villa', location: 'Oba' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);

      await service.publishPropertyDraft(
        '550e8400-e29b-41d4-a716-446655440001',
        {
          title: 'Nice Villa',
          type: 'villa',
          location: 'Oba',
          price_per_night: 90,
        },
        'user-1',
      );
      const updates = (
        mockRepository.updateProperty.mock.calls[0] as [
          string,
          Record<string, unknown>,
        ]
      )[1];
      expect(updates.status).toBe('pending');
      expect(updates.rejection_reason).toBeNull();
    });
  });
});
