import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { CreateProductOrderDto } from './dto/create-product-order.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockUserRolesRepo: {
    getRole: jest.Mock;
  };
  let mockRepository: {
    insertProduct: jest.Mock;
    getProducts: jest.Mock;
    getProductById: jest.Mock;
    getProductOwnership: jest.Mock;
    updateProduct: jest.Mock;
    deleteProduct: jest.Mock;
    getProductVariants: jest.Mock;
    insertProductVariant: jest.Mock;
    getVariantProductId: jest.Mock;
    updateProductVariant: jest.Mock;
    deleteProductVariant: jest.Mock;
    getShopCategories: jest.Mock;
    getShopCatalog: jest.Mock;
    getFeaturedProducts: jest.Mock;
    getShopProductDetails: jest.Mock;
    getOrderableProductsByIds: jest.Mock;
    createProductOrder: jest.Mock;
    getMyOrders: jest.Mock;
    getOrderById: jest.Mock;
    getMyCatalogItems: jest.Mock;
    createCatalogItem: jest.Mock;
    updateCatalogItem: jest.Mock;
    getOrdersContainingCatalogItems: jest.Mock;
    getAllOrders: jest.Mock;
    sellerOwnsAnyCatalogItem: jest.Mock;
    updateOrderStatus: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      insertProduct: jest.fn(),
      getProducts: jest.fn().mockResolvedValue([]),
      getProductById: jest.fn(),
      getProductOwnership: jest.fn(),
      updateProduct: jest.fn().mockResolvedValue({}),
      deleteProduct: jest.fn().mockResolvedValue({}),
      getProductVariants: jest.fn().mockResolvedValue([]),
      insertProductVariant: jest.fn(),
      getVariantProductId: jest.fn(),
      updateProductVariant: jest.fn().mockResolvedValue({}),
      deleteProductVariant: jest.fn().mockResolvedValue({}),
      getShopCategories: jest
        .fn()
        .mockResolvedValue([{ id: 1, name: 'Souvenirs', sort_order: 1 }]),
      getShopCatalog: jest
        .fn()
        .mockResolvedValue({ products: [], categories: [] }),
      getFeaturedProducts: jest.fn().mockResolvedValue([]),
      getShopProductDetails: jest.fn().mockResolvedValue({
        product: { id: 1, name: 'Item' },
        variants: [],
        skus: [],
      }),
      getOrderableProductsByIds: jest.fn().mockResolvedValue([]),
      createProductOrder: jest.fn().mockResolvedValue({
        success: true,
        orderId: 77,
        message: 'Order placed successfully',
      }),
      getMyOrders: jest.fn().mockResolvedValue([
        {
          id: 77,
          currency: 'EUR',
          customer_id: 'user-xyz',
          items: [],
        },
      ]),
      getOrderById: jest.fn().mockResolvedValue({
        id: 77,
        currency: 'EUR',
        customer_id: 'user-xyz',
        items: [],
      }),
      getMyCatalogItems: jest.fn().mockResolvedValue([]),
      createCatalogItem: jest.fn(),
      updateCatalogItem: jest.fn(),
      getOrdersContainingCatalogItems: jest.fn().mockResolvedValue([]),
      getAllOrders: jest.fn().mockResolvedValue([]),
      sellerOwnsAnyCatalogItem: jest.fn().mockResolvedValue(false),
      updateOrderStatus: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('createProduct', () => {
    it('should assign seller_id and insert product', async () => {
      const mockCreated = { id: 'p1', title: 'Gift Box', seller_id: 'user-1' };
      mockRepository.insertProduct.mockResolvedValueOnce(mockCreated);

      const res = await service.createProduct(
        {
          title: 'Gift Box',
          description: '',
          price: 10,
          stock: 5,
          category: 'souvenirs',
          images: [],
        },
        'user-1',
      );

      expect(res).toEqual(mockCreated);
      expect(mockRepository.insertProduct).toHaveBeenCalledWith(
        expect.objectContaining({ seller_id: 'user-1' }),
      );
    });
  });

  describe('getProduct', () => {
    it('should throw NotFoundException if product is missing', async () => {
      mockRepository.getProductById.mockResolvedValueOnce(null);

      await expect(service.getProduct('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProduct', () => {
    it('should throw UnauthorizedException if user is not seller, artisan, or admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getProductOwnership.mockResolvedValueOnce({
        seller_id: 'owner-user',
      });

      await expect(
        service.updateProduct('p1', { title: 'Updated' }, 'random-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update product if caller is owner', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getProductOwnership.mockResolvedValueOnce({
        seller_id: 'owner-user',
      });

      const res = await service.updateProduct(
        'p1',
        { title: 'Updated Title', seller_id: 'hacked-id' },
        'owner-user',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateProduct).toHaveBeenCalledWith('p1', {
        title: 'Updated Title',
      });
    });
  });

  describe('Shop Catalog & Orders Service Methods', () => {
    it('getShopCategories should call repository and return categories', async () => {
      const res = await service.getShopCategories();
      expect(mockRepository.getShopCategories).toHaveBeenCalled();
      expect(res).toEqual([{ id: 1, name: 'Souvenirs', sort_order: 1 }]);
    });

    it('getShopCatalog should call repository with query options and return catalog', async () => {
      const query = { category: 'souvenirs', featured: true };
      const res = await service.getShopCatalog(query);
      expect(mockRepository.getShopCatalog).toHaveBeenCalledWith(query);
      expect(res).toEqual({ products: [], categories: [] });
    });

    it('getShopProductDetails should return product details when found', async () => {
      const res = await service.getShopProductDetails('1');
      expect(mockRepository.getShopProductDetails).toHaveBeenCalledWith('1');
      expect(res).toEqual({
        product: { id: 1, name: 'Item' },
        variants: [],
        skus: [],
      });
    });

    it('getShopProductDetails should throw NotFoundException if product is missing', async () => {
      mockRepository.getShopProductDetails.mockResolvedValueOnce({
        product: null,
        variants: [],
        skus: [],
      });
      await expect(service.getShopProductDetails('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('createProductOrder should call repository to persist order headers and items', async () => {
      mockRepository.getOrderableProductsByIds.mockResolvedValueOnce([
        {
          id: 1,
          name: 'Handmade Carpet',
          price: 100,
          currency: 'EUR',
          stock: 10,
          status: 'active',
          sku_id: null,
          sku_price: null,
          sku_stock: null,
          sku_label: null,
        },
      ]);
      const dto: CreateProductOrderDto = {
        currency: 'EUR',
        subtotal: 100,
        customerNotes: 'Please ring the bell',
        recipient: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+905559876543',
          contact_method: 'phone_call',
        },
        items: [
          {
            productId: 1,
            productName: 'Handmade Carpet',
            quantity: 1,
            unitPrice: 100,
            finalPrice: 100,
            subtotal: 100,
          },
        ],
      };
      const res = await service.createProductOrder(dto, 'user-xyz');
      expect(mockRepository.getOrderableProductsByIds).toHaveBeenCalledWith(
        [1],
        [],
      );
      // Prices must be server-resolved from the DB, not taken from the DTO.
      expect(mockRepository.createProductOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 100,
          items: [
            expect.objectContaining({
              unitPrice: 100,
              finalPrice: 100,
              subtotal: 100,
            }),
          ],
        }),
        'user-xyz',
      );
      expect(res).toEqual({
        success: true,
        orderId: 77,
        message: 'Order placed successfully',
      });
    });

    it('createProductOrder should throw BadRequestException if items array is empty', async () => {
      const dto: CreateProductOrderDto = {
        currency: 'EUR',
        subtotal: 0,
        recipient: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+905559876543',
          contact_method: 'email',
        },
        items: [],
      };
      await expect(service.createProductOrder(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('createProductOrder should throw BadRequestException if item subtotal does not match unit price * quantity', async () => {
      const dto: CreateProductOrderDto = {
        currency: 'EUR',
        subtotal: 100,
        recipient: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+905559876543',
          contact_method: 'email',
        },
        items: [
          {
            productId: 'prod-1',
            productName: 'Handmade Carpet',
            quantity: 2,
            unitPrice: 50,
            finalPrice: 50,
            subtotal: 80, // Incorrect! Should be 100
          },
        ],
      };
      await expect(service.createProductOrder(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('createProductOrder should throw BadRequestException if header subtotal does not match sum of items', async () => {
      const dto: CreateProductOrderDto = {
        currency: 'EUR',
        subtotal: 90, // Incorrect! Sum of items is 100
        recipient: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+905559876543',
          contact_method: 'email',
        },
        items: [
          {
            productId: 'prod-1',
            productName: 'Handmade Carpet',
            quantity: 2,
            unitPrice: 50,
            finalPrice: 50,
            subtotal: 100,
          },
        ],
      };
      await expect(service.createProductOrder(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('getFeaturedProducts should query repository with default limit', async () => {
      const res = await service.getFeaturedProducts(6);
      expect(mockRepository.getFeaturedProducts).toHaveBeenCalledWith(6);
      expect(res).toEqual([]);
    });

    it('getMyOrders should query repository for customer orders', async () => {
      const res = await service.getMyOrders('user-xyz');
      expect(mockRepository.getMyOrders).toHaveBeenCalledWith('user-xyz');
      expect(res).toEqual([
        {
          id: 77,
          currency: 'EUR',
          customer_id: 'user-xyz',
          items: [],
        },
      ]);
    });

    it('getOrderById should return order if it belongs to requesting user', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 77,
        customer_id: 'user-xyz',
      });

      const res = await service.getOrderById('77', 'user-xyz');
      expect(res).toEqual({ id: 77, customer_id: 'user-xyz' });
    });

    it('getOrderById should return order if requester is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 77,
        customer_id: 'different-user',
      });

      const res = await service.getOrderById('77', 'admin-user');
      expect(res).toEqual({ id: 77, customer_id: 'different-user' });
    });

    it('getOrderById should throw NotFoundException if order does not exist', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getOrderById.mockResolvedValueOnce(null);

      await expect(service.getOrderById('999', 'user-xyz')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('getOrderById should throw UnauthorizedException if order belongs to another user and requester is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 77,
        customer_id: 'other-user',
      });

      await expect(service.getOrderById('77', 'user-xyz')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Seller (Business Dashboard)', () => {
    it('getMyProducts should return catalog items owned by the seller', async () => {
      const items = [{ id: 1, name: 'Mug', seller_id: 'seller-1' }];
      mockRepository.getMyCatalogItems.mockResolvedValueOnce(items);

      await expect(service.getMyProducts('seller-1')).resolves.toBe(items);
      expect(mockRepository.getMyCatalogItems).toHaveBeenCalledWith('seller-1');
    });

    it('createMyProduct should default currency and stock and pass seller id', async () => {
      mockRepository.createCatalogItem.mockResolvedValueOnce({
        id: 9,
        name: 'Mug',
      });

      await service.createMyProduct({ name: 'Mug', price: 12.5 }, 'seller-1');

      expect(mockRepository.createCatalogItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mug',
          price: 12.5,
          currency: 'EUR',
          stock: 0,
        }),
        'seller-1',
      );
    });

    it('updateMyProduct should throw NotFoundException when item is missing or foreign', async () => {
      mockRepository.updateCatalogItem.mockResolvedValueOnce(null);

      await expect(
        service.updateMyProduct(42, { price: 5 }, 'seller-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('getSellerOrders should return [] when seller has no catalog items', async () => {
      mockRepository.getMyCatalogItems.mockResolvedValueOnce([]);

      await expect(service.getSellerOrders('seller-1')).resolves.toEqual([]);
      expect(
        mockRepository.getOrdersContainingCatalogItems,
      ).not.toHaveBeenCalled();
    });

    it('getSellerOrders should fetch orders containing seller items', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getMyCatalogItems.mockResolvedValueOnce([
        { id: 3, name: 'Mug' },
        { id: 5, name: 'Plate' },
      ]);
      mockRepository.getOrdersContainingCatalogItems.mockResolvedValueOnce([
        { id: 77 },
      ]);

      await expect(service.getSellerOrders('seller-1')).resolves.toEqual([
        { id: 77 },
      ]);
      expect(
        mockRepository.getOrdersContainingCatalogItems,
      ).toHaveBeenCalledWith([3, 5]);
    });

    it('getSellerOrders should return all orders for admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getAllOrders.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

      await expect(service.getSellerOrders('admin-1')).resolves.toHaveLength(2);
      expect(mockRepository.getMyCatalogItems).not.toHaveBeenCalled();
    });

    it('updateOrderStatus should apply a valid transition and persist it', async () => {
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 77,
        status: 'paid',
        items: [{ product_id: '3' }],
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.sellerOwnsAnyCatalogItem.mockResolvedValueOnce(true);
      mockRepository.updateOrderStatus.mockResolvedValueOnce({
        id: 77,
        status: 'shipped',
      });

      await expect(
        service.updateOrderStatus('77', 'shipped', 'seller-1'),
      ).resolves.toEqual({ id: 77, status: 'shipped' });
      expect(mockRepository.updateOrderStatus).toHaveBeenCalledWith(
        77,
        'shipped',
        'paid',
      );
    });

    it('updateOrderStatus should reject when a concurrent transition won the race', async () => {
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 77,
        status: 'paid',
        items: [{ product_id: '3' }],
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.sellerOwnsAnyCatalogItem.mockResolvedValueOnce(true);
      // Guarded UPDATE matched 0 rows — status changed concurrently.
      mockRepository.updateOrderStatus.mockResolvedValueOnce(null);

      await expect(
        service.updateOrderStatus('77', 'shipped', 'seller-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('updateOrderStatus should reject invalid transitions', async () => {
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 77,
        status: 'pending_payment',
        items: [],
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.updateOrderStatus('77', 'shipped', 'seller-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('updateOrderStatus should reject sellers who own none of the ordered items', async () => {
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 77,
        status: 'paid',
        items: [{ product_id: '3' }],
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.sellerOwnsAnyCatalogItem.mockResolvedValueOnce(false);

      await expect(
        service.updateOrderStatus('77', 'shipped', 'intruder-1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockRepository.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('updateOrderStatus should skip ownership check for admin', async () => {
      mockRepository.getOrderById.mockResolvedValueOnce({
        id: 88,
        status: 'pending_payment',
        items: [],
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateOrderStatus.mockResolvedValueOnce({
        id: 88,
        status: 'cancelled',
      });

      await expect(
        service.updateOrderStatus('88', 'cancelled', 'admin-1'),
      ).resolves.toEqual({ id: 88, status: 'cancelled' });
      expect(mockRepository.sellerOwnsAnyCatalogItem).not.toHaveBeenCalled();
    });

    describe.each([
      ['pending_payment', 'paid', true],
      ['pending_payment', 'cancelled', true],
      ['pending_payment', 'shipped', false],
      ['paid', 'shipped', true],
      ['paid', 'cancelled', true],
      ['paid', 'completed', false],
      ['shipped', 'completed', true],
      ['shipped', 'cancelled', false],
      ['completed', 'cancelled', false],
      ['cancelled', 'paid', false],
    ])('transition %s -> %s', (fromStatus, toStatus, allowed) => {
      it(`${allowed ? 'persists' : 'rejects'} the transition`, async () => {
        mockRepository.getOrderById.mockResolvedValueOnce({
          id: 50,
          status: fromStatus,
          items: [],
        });
        mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
        if (allowed) {
          mockRepository.updateOrderStatus.mockResolvedValueOnce({
            id: 50,
            status: toStatus,
          });
        }

        const call = () =>
          service.updateOrderStatus('50', toStatus as never, 'admin-1');

        if (allowed) {
          await expect(call()).resolves.toEqual({ id: 50, status: toStatus });
        } else {
          await expect(call()).rejects.toThrow(BadRequestException);
          expect(mockRepository.updateOrderStatus).not.toHaveBeenCalled();
        }
      });
    });

    it('updateOrderStatus should throw NotFoundException for unknown orders', async () => {
      mockRepository.getOrderById.mockResolvedValueOnce(null);

      await expect(
        service.updateOrderStatus('999', 'paid', 'seller-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
