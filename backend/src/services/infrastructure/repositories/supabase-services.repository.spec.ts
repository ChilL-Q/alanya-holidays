import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseServicesRepository } from './supabase-services.repository';
import { SupabaseService } from '../../../supabase/supabase.service';
import { ServiceOfferingEntity } from '../../domain/entities/service-offering.entity';
import { Money } from '../../../../src/common/domain/value-objects/money.vo';

describe('SupabaseServicesRepository', () => {
  let repository: SupabaseServicesRepository;
  let mockSupabaseService: {
    getClient: jest.Mock;
  };
  let mockClient: {
    from: jest.Mock;
  };

  beforeEach(async () => {
    mockClient = {
      from: jest.fn(),
    };

    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue(mockClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseServicesRepository,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    repository = module.get<SupabaseServicesRepository>(
      SupabaseServicesRepository,
    );
  });

  describe('findById', () => {
    it('should find service by UUID and return domain entity', async () => {
      const mockRow = {
        id: '12345678-1234-1234-1234-123456789abc',
        title: 'VIP Yacht Charter',
        type: 'yacht',
        provider_id: 'user-1',
        price: 450,
        currency: 'EUR',
        status: 'approved',
      };

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRow, error: null }),
      };
      mockClient.from.mockReturnValue(chain);

      const result = await repository.findById(
        '12345678-1234-1234-1234-123456789abc',
      );

      expect(result).toBeInstanceOf(ServiceOfferingEntity);
      expect(result?.title).toBe('VIP Yacht Charter');
      expect(mockClient.from).toHaveBeenCalledWith('services');
    });

    it('should find service by ref ID if not UUID', async () => {
      const mockRow = {
        id: '12345678-1234-1234-1234-123456789abc',
        title: 'VIP Yacht Charter',
        type: 'yacht',
        provider_id: 'user-1',
        price: 450,
        currency: 'EUR',
        service_ref: 5555,
        status: 'approved',
      };

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: mockRow, error: null }),
      };
      mockClient.from.mockReturnValue(chain);

      const result = await repository.findById('5555');

      expect(result).toBeInstanceOf(ServiceOfferingEntity);
      expect(result?.serviceRef).toBe(5555);
    });

    it('should return null when not found', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      mockClient.from.mockReturnValue(chain);

      const result = await repository.findById(
        '12345678-1234-1234-1234-123456789abc',
      );
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should update existing entity if it has an id', async () => {
      const entity = ServiceOfferingEntity.restore({
        id: 'srv-100',
        title: 'Helicopter Tour',
        type: 'tour',
        providerId: 'provider-1',
        price: new Money(200, 'EUR'),
        status: 'approved',
      });

      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockClient.from.mockReturnValue(chain);

      const saved = await repository.save(entity);

      expect(saved).toBe(entity);
      expect(mockClient.from).toHaveBeenCalledWith('services');
      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'srv-100');
    });

    it('should insert new entity if it has no id', async () => {
      const entity = ServiceOfferingEntity.create({
        title: 'New Scuba Diving',
        type: 'activity',
        providerId: 'provider-2',
        price: new Money(80, 'EUR'),
      });

      const mockInserted = {
        id: 'new-srv-id',
        title: 'New Scuba Diving',
        type: 'activity',
        provider_id: 'provider-2',
        price: 80,
        currency: 'EUR',
        status: 'pending',
      };

      const chain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: mockInserted, error: null }),
      };
      mockClient.from.mockReturnValue(chain);

      const saved = await repository.save(entity);

      expect(saved).toBeInstanceOf(ServiceOfferingEntity);
      expect(saved.id).toBe('new-srv-id');
      expect(mockClient.from).toHaveBeenCalledWith('services');
    });
  });

  describe('getServiceOwnershipInfo', () => {
    it('should return ownership info', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { provider_id: 'user-1', title: 'Car Rental', type: 'car' },
          error: null,
        }),
      };
      mockClient.from.mockReturnValue(chain);

      const info = await repository.getServiceOwnershipInfo('srv-1');
      expect(info).toEqual({
        provider_id: 'user-1',
        title: 'Car Rental',
        type: 'car',
      });
    });
  });
});
