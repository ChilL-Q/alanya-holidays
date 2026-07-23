import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';

describe('ServicesService', () => {
  let service: ServicesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      insertService: jest.fn(),
      getServices: jest.fn(),
      getServicesByProvider: jest.fn(),
      getServiceByIdOrRef: jest.fn(),
      getServiceOwnershipInfo: jest.fn(),
      getUserRole: jest.fn(),
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: ServicesRepository,
          useValue: mockRepository,
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
          { id: '12345678-abcd-1234-5678-123456789abc', title: 'Service A' } as any,
        ],
        count: 1,
      });

      const result = await service.getServices('car', 1, 20);

      expect(result.count).toBe(1);
      expect((result.data[0] as any).title).toBe('Service A');
      expect((result.data[0] as any).service_ref).toBeDefined();
      expect(mockRepository.getServices).toHaveBeenCalledWith('car', 1, 20);
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
      });
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.updateService('srv-1', { title: 'New' }, 'other-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update service successfully if owner', async () => {
      mockRepository.getServiceOwnershipInfo.mockResolvedValueOnce({
        provider_id: 'owner-1',
      });
      mockRepository.getUserRole.mockResolvedValueOnce('user');
      mockRepository.updateService.mockResolvedValueOnce({ id: 'srv-1' });

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

  describe('approveServiceEdit', () => {
    it('should throw UnauthorizedException if not admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.approveServiceEdit('edit-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should filter immutable fields and update service', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
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
      });

      const result = await service.approveServiceEdit('edit-1', 'admin-1');

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateService).toHaveBeenCalledWith('srv-1', {
        title: 'New Title',
      });
      expect(mockRepository.deleteServiceEdit).toHaveBeenCalledWith('edit-1');
    });
  });
});
