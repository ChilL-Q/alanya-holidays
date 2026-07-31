import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesRepository } from './properties.repository';
import { RedisService } from '../common/redis/redis.service';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      getPropertiesByIds: jest.fn().mockResolvedValue([]),
      insertProperty: jest.fn(),
      getProperties: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getPropertyByUUID: jest.fn(),
      getPropertyByRefId: jest.fn(),
      getProfile: jest.fn(),
      getAvailableProperties: jest.fn().mockResolvedValue([]),
      getPropertiesByHost: jest.fn().mockResolvedValue([]),
      getAdminProperties: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getPropertyHostId: jest.fn(),
      getUserRole: jest.fn(),
      updateProperty: jest.fn().mockResolvedValue({}),
      deleteProperty: jest.fn().mockResolvedValue({}),
      getPropertyTypes: jest.fn().mockResolvedValue(['apartment', 'villa']),
      getPropertyLocations: jest.fn().mockResolvedValue(['Cleopatra Beach']),
      getPropertiesByLocation: jest
        .fn()
        .mockResolvedValue({ data: [], count: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: PropertiesRepository,
          useValue: mockRepository,
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

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('getProperty', () => {
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
    });
  });

  describe('updateProperty', () => {
    it('should throw UnauthorizedException if caller is not host and not admin', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'owner-host',
      });
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.updateProperty('prop-1', { title: 'New' }, 'other-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should strip status and sensitive ical fields when updating', async () => {
      mockRepository.getPropertyHostId.mockResolvedValueOnce({
        host_id: 'owner-host',
      });
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      const res = await service.updateProperty(
        'prop-1',
        { title: 'New Title', status: 'approved', ical_token: 'secret' },
        'owner-host',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateProperty).toHaveBeenCalledWith('prop-1', {
        title: 'New Title',
      });
    });
  });
});
