import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
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
});
