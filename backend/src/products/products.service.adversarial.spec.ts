import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { BillingService } from '../billing/billing.service';

describe('ProductsService & ProductsRepository - Adversarial Orders Tests', () => {
  describe('ProductsService Order Retrieval & Authorization Boundary Challenges', () => {
    let service: ProductsService;
    let mockUserRolesRepo: {
      getRole: jest.Mock;
    };
    let mockRepository: {
      getMyOrders: jest.Mock;
      getOrderById: jest.Mock;
    };

    beforeEach(async () => {
      mockUserRolesRepo = {
        getRole: jest.fn(),
      };
      mockRepository = {
        getMyOrders: jest.fn(),
        getOrderById: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ProductsService,
          {
            provide: ProductsRepository,
            useValue: mockRepository,
          },
          {
            provide: UserRolesRepository,
            useValue: mockUserRolesRepo,
          },
          {
            provide: BillingService,
            useValue: {
              hasActivePremiumAccess: jest.fn().mockResolvedValue(true),
            },
          },
        ],
      }).compile();

      service = module.get<ProductsService>(ProductsService);
    });

    describe('getMyOrders', () => {
      it('should return empty array when user has 0 orders', async () => {
        mockRepository.getMyOrders.mockResolvedValueOnce([]);

        const result = await service.getMyOrders('user-with-no-orders');

        expect(result).toEqual([]);
        expect(mockRepository.getMyOrders).toHaveBeenCalledWith(
          'user-with-no-orders',
        );
      });

      it('should return orders even if items array is empty (corner case)', async () => {
        const orderWithoutItems = [
          {
            id: 101,
            currency: 'EUR',
            status: 'pending_payment',
            subtotal_items: 0,
            customer_id: 'user-xyz',
            recipient: { name: 'Test' },
            items: [],
          },
        ];
        mockRepository.getMyOrders.mockResolvedValueOnce(orderWithoutItems);

        const result = await service.getMyOrders('user-xyz');

        expect(result).toHaveLength(1);
        expect(result[0].items).toEqual([]);
      });

      it('should return multiple enriched orders with items correctly', async () => {
        const multipleOrders = [
          {
            id: 201,
            currency: 'EUR',
            status: 'paid',
            subtotal_items: 75,
            customer_id: 'user-xyz',
            items: [
              {
                id: 1,
                order_id: '201',
                product_id: 'prod-1',
                product_name: 'Turkish Coffee Set',
                quantity: 1,
                unit_price: 75,
                final_price: 75,
                subtotal: 75,
              },
            ],
          },
          {
            id: 202,
            currency: 'EUR',
            status: 'delivered',
            subtotal_items: 30,
            customer_id: 'user-xyz',
            items: [
              {
                id: 2,
                order_id: '202',
                product_id: 'prod-2',
                product_name: 'Alanya Silk Scarf',
                quantity: 2,
                unit_price: 15,
                final_price: 15,
                subtotal: 30,
              },
            ],
          },
        ];
        mockRepository.getMyOrders.mockResolvedValueOnce(multipleOrders);

        const result = await service.getMyOrders('user-xyz');

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(201);
        expect(result[1].id).toBe(202);
      });
    });

    describe('getOrderById', () => {
      it('should throw NotFoundException if order does not exist in database', async () => {
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        mockRepository.getOrderById.mockResolvedValueOnce(null);

        await expect(
          service.getOrderById('non-existent-order-id', 'user-123'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should allow legitimate owner to retrieve their order', async () => {
        const orderData = {
          id: 55,
          currency: 'EUR',
          customer_id: 'legit-user-id',
          status: 'pending_payment',
          items: [{ product_name: 'Olive Oil', quantity: 1 }],
        };

        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        mockRepository.getOrderById.mockResolvedValueOnce(orderData);

        const result = await service.getOrderById(55, 'legit-user-id');

        expect(result).toEqual(orderData);
        expect(mockRepository.getOrderById).toHaveBeenCalledWith(55);
      });

      it('should strictly throw UnauthorizedException when a regular user tries to access another user order (IDOR attack)', async () => {
        const victimOrder = {
          id: 777,
          currency: 'EUR',
          customer_id: 'victim-user-id',
          status: 'paid',
          items: [{ product_name: 'VIP Yacht Charter Package', quantity: 1 }],
        };

        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        mockRepository.getOrderById.mockResolvedValueOnce(victimOrder);

        await expect(
          service.getOrderById(777, 'attacker-user-id'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should allow an admin to access any user order', async () => {
        const customerOrder = {
          id: 888,
          currency: 'EUR',
          customer_id: 'customer-user-id',
          status: 'shipped',
          items: [{ product_name: 'Handcrafted Ceramic Bowl', quantity: 3 }],
        };

        mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
        mockRepository.getOrderById.mockResolvedValueOnce(customerOrder);

        const result = await service.getOrderById(888, 'admin-user-id');

        expect(result).toEqual(customerOrder);
      });

      it('should throw UnauthorizedException when a regular user accesses an unassigned/guest order (customer_id is null)', async () => {
        const guestOrder = {
          id: 999,
          currency: 'EUR',
          customer_id: null,
          status: 'pending_payment',
          items: [],
        };

        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        mockRepository.getOrderById.mockResolvedValueOnce(guestOrder);

        await expect(
          service.getOrderById(999, 'regular-user-id'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should allow admin to access guest order where customer_id is null', async () => {
        const guestOrder = {
          id: 999,
          currency: 'EUR',
          customer_id: null,
          status: 'pending_payment',
          items: [],
        };

        mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
        mockRepository.getOrderById.mockResolvedValueOnce(guestOrder);

        const result = await service.getOrderById(999, 'admin-user-id');

        expect(result).toEqual(guestOrder);
      });
    });
  });

  describe('ProductsRepository Input & DB Resilience Tests', () => {
    let repository: ProductsRepository;
    let mockSupabaseClient: {
      from: jest.Mock;
    };

    beforeEach(async () => {
      mockSupabaseClient = {
        from: jest.fn(),
      };

      const mockSupabaseService = {
        getClient: jest.fn().mockReturnValue(mockSupabaseClient),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ProductsRepository,
          {
            provide: SupabaseService,
            useValue: mockSupabaseService,
          },
        ],
      }).compile();

      repository = module.get<ProductsRepository>(ProductsRepository);
    });

    it('getMyOrders should return empty array immediately when invalid UUID is passed (preventing DB query injection)', async () => {
      const invalidUuids = [
        'invalid-uuid',
        '123',
        "'; DROP TABLE order_headers; --",
        '<script>alert(1)</script>',
        '',
      ];

      for (const invalidId of invalidUuids) {
        const result = await repository.getMyOrders(invalidId);
        expect(result).toEqual([]);
      }
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('getMyOrders should execute query with valid UUID', async () => {
      const validUuid = '12345678-1234-1234-1234-123456789abc';
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 1, customer_id: validUuid }],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockOrderQuery);

      const result = await repository.getMyOrders(validUuid);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('order_headers');
      expect(mockOrderQuery.eq).toHaveBeenCalledWith('customer_id', validUuid);
      expect(result).toHaveLength(1);
    });

    it('getOrderById should return null when Supabase returns PGRST116 (no rows)', async () => {
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockOrderQuery);

      const result = await repository.getOrderById(999);

      expect(result).toBeNull();
    });

    it('getOrderById should return null when Supabase returns 22P02 (invalid syntax)', async () => {
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: '22P02',
            message: 'invalid input syntax for type bigint',
          },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockOrderQuery);

      const result = await repository.getOrderById('invalid-syntax');

      expect(result).toBeNull();
    });

    it('getOrderById should throw on unexpected fatal database errors', async () => {
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '50000', message: 'Database connection failed' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockOrderQuery);

      await expect(repository.getOrderById(123)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
