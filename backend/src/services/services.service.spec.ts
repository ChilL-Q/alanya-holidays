import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { SERVICES_REPOSITORY } from './domain';
import { RedisService } from '../common/redis/redis.service';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('ServicesService', () => {
  let service: ServicesService;
  let mockRedisService: {
    getJson: jest.Mock;
    setJson: jest.Mock;
    delByPattern: jest.Mock;
    getOrFetchSWR: jest.Mock;
  };
  let mockUserRolesRepo: {
    getRole: jest.Mock;
  };
  let mockRepository: {
    insertService: jest.Mock;
    getServices: jest.Mock;
    getServicesByProvider: jest.Mock;
    getServiceByIdOrRef: jest.Mock;
    getServiceOwnershipInfo: jest.Mock;
    updateService: jest.Mock;
    deleteService: jest.Mock;
    getAdminServices: jest.Mock;
    getServiceBrands: jest.Mock;
    getServiceModels: jest.Mock;
    getServiceModel: jest.Mock;
    updateServiceModel: jest.Mock;
    getServicesByModel: jest.Mock;
    insertServiceEdit: jest.Mock;
    getPendingServiceEdits: jest.Mock;
    getServiceEditsByService: jest.Mock;
    getMyPendingEdits: jest.Mock;
    getServiceEditById: jest.Mock;
    deleteServiceEdit: jest.Mock;
    updateServiceEdit: jest.Mock;
    findById: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    mockRedisService = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(undefined),
      getOrFetchSWR: jest.fn(),
    };

    mockRedisService.getOrFetchSWR = jest.fn(
      async (_key: string, loader: () => unknown) => {
        const hit = await mockRedisService.getJson(_key);
        if (hit) return hit;
        const fresh = await loader();
        await mockRedisService.setJson(_key, fresh, 600);
        return fresh;
      },
    );

    mockUserRolesRepo = {
      getRole: jest.fn(),
    };

    mockRepository = {
      insertService: jest.fn(),
      getServices: jest.fn(),
      getServicesByProvider: jest.fn(),
      getServiceByIdOrRef: jest.fn(),
      getServiceOwnershipInfo: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
      getAdminServices: jest.fn(),
      getServiceBrands: jest.fn(),
      getServiceModels: jest.fn(),
      getServiceModel: jest.fn(),
      updateServiceModel: jest.fn(),
      getServicesByModel: jest.fn(),
      insertServiceEdit: jest.fn(),
      getPendingServiceEdits: jest.fn(),
      getServiceEditsByService: jest.fn(),
      getMyPendingEdits: jest.fn(),
      getServiceEditById: jest.fn(),
      deleteServiceEdit: jest.fn(),
      updateServiceEdit: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: SERVICES_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: ServicesRepository,
          useValue: mockRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  describe('createService', () => {
    it('should set provider_id to userId and insert service', async () => {
      const mockCreated = {
        id: 'srv-1',
        title: 'Car Rental',
        provider_id: 'user-1',
      };
      mockRepository.insertService.mockResolvedValueOnce(mockCreated);

      const result = await service.createService(
        { title: 'Car Rental' },
        'user-1',
      );

      expect(result).toEqual(mockCreated);
      expect(mockRepository.insertService).toHaveBeenCalledWith({
        title: 'Car Rental',
        provider_id: 'user-1',
      });
    });
  });

  describe('getServices', () => {
    it('should return mapped services with ref', async () => {
      mockRepository.getServices.mockResolvedValueOnce({
        data: [
          {
            id: '12345678-abcd-1234-5678-123456789abc',
            title: 'Service A',
          },
        ],
        count: 1,
      });

      const result = await service.getServices('car', 1, 20);

      expect(result.count).toBe(1);
      expect(result.data[0].title).toBe('Service A');
      expect(result.data[0].service_ref).toBeDefined();
      expect(mockRepository.getServices).toHaveBeenCalledWith('car', 1, 20);
    });
  });

  describe('getServicesByProvider', () => {
    it('should return provider services', async () => {
      const mockList = [{ id: 'srv-1', title: 'Provider Service' }];
      mockRepository.getServicesByProvider.mockResolvedValueOnce(mockList);

      const result = await service.getServicesByProvider('user-1');
      expect(result).toEqual(mockList);
      expect(mockRepository.getServicesByProvider).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  describe('getService', () => {
    it('should throw NotFoundException if service is not found', async () => {
      mockRepository.getServiceByIdOrRef.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });

      await expect(service.getService('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return service data if found', async () => {
      const mockData = { id: 'srv-1', title: 'Test Service' };
      mockRepository.getServiceByIdOrRef.mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const result = await service.getService('srv-1');
      expect(result).toEqual(mockData);
    });
  });

  describe('updateService', () => {
    it('should throw UnauthorizedException if user is not owner and not admin', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValueOnce({
        provider_id: 'owner-1',
        title: 'Title',
        type: 'car',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.updateService('srv-1', { title: 'New' }, 'other-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update service successfully if owner', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValueOnce({
        provider_id: 'owner-1',
        title: 'Title',
        type: 'car',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.updateService.mockResolvedValueOnce(undefined);

      const result = await service.updateService(
        'srv-1',
        { title: 'Updated Title', status: 'pending' },
        'owner-1',
      );

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateService).toHaveBeenCalledWith('srv-1', {
        title: 'Updated Title',
      });
    });
  });

  describe('deleteService', () => {
    it('should throw NotFoundException if service does not exist', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValueOnce(null);

      await expect(
        service.deleteService('srv-not-exist', undefined, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete service successfully if owner', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValueOnce({
        provider_id: 'user-1',
        title: 'Title',
        type: 'car',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.deleteService.mockResolvedValueOnce(undefined);

      const result = await service.deleteService(
        'srv-1',
        'Closed down',
        'user-1',
      );
      expect(result).toEqual({ success: true });
      expect(mockRepository.deleteService).toHaveBeenCalledWith('srv-1');
    });
  });

  describe('updateServiceStatus', () => {
    it('should update status and rejection reason when rejected', async () => {
      mockRepository.updateService.mockResolvedValueOnce(undefined);

      const result = await service.updateServiceStatus(
        'srv-1',
        'rejected',
        'Incomplete docs',
        'admin-1',
      );

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateService).toHaveBeenCalledWith('srv-1', {
        status: 'rejected',
        rejection_reason: 'Incomplete docs',
      });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('services:*');
    });

    it('should clear rejection reason when approved', async () => {
      mockRepository.updateService.mockResolvedValueOnce(undefined);

      const result = await service.updateServiceStatus(
        'srv-1',
        'approved',
        undefined,
        'admin-1',
      );

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateService).toHaveBeenCalledWith('srv-1', {
        status: 'approved',
        rejection_reason: null,
      });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('services:*');
    });
  });

  describe('catalog and models', () => {
    it('should return service types', () => {
      expect(service.getServiceTypes()).toEqual([
        'car',
        'bike',
        'tour',
        'transfer',
        'visa',
        'esim',
      ]);
    });

    it('should return unique service brands', async () => {
      mockRepository.getServiceBrands.mockResolvedValueOnce([
        { brand: 'BMW' },
        { brand: 'Audi' },
        { brand: 'BMW' },
      ]);

      const brands = await service.getServiceBrands('car');
      expect(brands).toEqual(['BMW', 'Audi']);
    });

    it('should return service models', async () => {
      mockRepository.getServiceModels.mockResolvedValueOnce([
        { brand: 'BMW', model: 'X5' },
      ]);

      const models = await service.getServiceModels('car', 'BMW');
      expect(models).toEqual([{ brand: 'BMW', model: 'X5' }]);
    });

    it('should get single service model or throw NotFoundException', async () => {
      mockRepository.getServiceModel.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });

      await expect(
        service.getServiceModel('car', 'BMW', 'Unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update service model when admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateServiceModel.mockResolvedValueOnce(undefined);

      const result = await service.updateServiceModel(
        'model-1',
        { specifications: { seats: 5 } },
        'admin-1',
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('service edits', () => {
    it('should request service update if authorized', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValueOnce({
        provider_id: 'owner-1',
        title: 'Title',
        type: 'car',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.insertServiceEdit.mockResolvedValueOnce(undefined);

      const result = await service.requestServiceUpdate(
        'srv-1',
        { title: 'New Car Title' },
        'owner-1',
      );
      expect(result).toEqual({ success: true });
      expect(mockRepository.insertServiceEdit).toHaveBeenCalledWith({
        service_id: 'srv-1',
        changed_data: { title: 'New Car Title' },
        status: 'pending',
      });
    });

    it('should throw UnauthorizedException on approveServiceEdit if not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.approveServiceEdit('edit-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should filter immutable fields and update service on approveServiceEdit', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getServiceEditById.mockResolvedValueOnce({
        data: {
          id: 'edit-1',
          service_id: 'srv-1',
          changed_data: {
            title: 'New Title',
            provider_id: 'hacker-id',
            id: 'changed-id',
            status: 'approved',
          },
        },
        error: null,
      });
      mockRepository.getServiceOwnershipInfo.mockResolvedValueOnce({
        provider_id: 'owner-1',
        title: 'Title',
        type: 'car',
      });

      const result = await service.approveServiceEdit('edit-1', 'admin-1');

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateService).toHaveBeenCalledWith('srv-1', {
        title: 'New Title',
      });
      expect(mockRepository.deleteServiceEdit).toHaveBeenCalledWith('edit-1');
    });

    it('should reject service edit when admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateServiceEdit.mockResolvedValueOnce(undefined);

      const result = await service.rejectServiceEdit(
        'edit-1',
        'Invalid updates',
        'admin-1',
      );
      expect(result).toEqual({ success: true });
      expect(mockRepository.updateServiceEdit).toHaveBeenCalledWith('edit-1', {
        status: 'rejected',
        rejection_reason: 'Invalid updates',
      });
    });
  });
  describe('service drafts', () => {
    it('creates a draft with immutable fields stripped and status forced to draft', async () => {
      mockRepository.insertService.mockResolvedValue({ id: 'svc-1' });

      const result = await service.saveServiceDraft(
        {
          title: 'Boat Tour',
          type: 'tour',
          provider_id: 'attacker',
          status: 'approved',
        },
        'user-1',
      );

      expect(result).toEqual({ id: 'svc-1' });
      const payload = (
        mockRepository.insertService.mock.calls[0] as [Record<string, unknown>]
      )[0];
      expect(payload.status).toBe('draft');
      expect(payload.provider_id).toBe('user-1');
    });

    it('defaults an empty title to Untitled Draft', async () => {
      mockRepository.insertService.mockResolvedValue({ id: 'svc-2' });

      await service.saveServiceDraft({}, 'user-1');

      expect(
        (
          mockRepository.insertService.mock.calls[0] as [
            Record<string, unknown>,
          ]
        )[0].title,
      ).toBe('Untitled Draft');
    });

    it('rejects saving over a foreign draft', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValue({
        provider_id: 'owner-1',
      });

      await expect(
        service.saveServiceDraft({ draftId: 'd-1' }, 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('publishes only with required fields and transitions draft -> pending', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValue({
        provider_id: 'user-1',
      });

      const outcome = await service
        .publishServiceDraft(
          '550e8400-e29b-41d4-a716-446655440002',
          { title: '' },
          'user-1',
        )
        .then(
          () => 'resolved',
          () => 'rejected',
        );
      expect(outcome).toBe('rejected');
    });

    it('publishes with required fields and transitions draft -> pending', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValue({
        provider_id: 'user-1',
      });

      await service.publishServiceDraft(
        '550e8400-e29b-41d4-a716-446655440002',
        { title: 'Sunset Cruise', type: 'tour', status: 'approved' },
        'user-1',
      );
      const updates = (
        mockRepository.updateService.mock.calls[0] as [
          string,
          Record<string, unknown>,
        ]
      )[1];
      expect(updates.status).toBe('pending');
      expect(updates.provider_id).toBeUndefined();
    });
  });
});
