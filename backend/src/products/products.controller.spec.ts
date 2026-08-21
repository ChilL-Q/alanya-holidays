import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { GetShopCatalogQueryDto } from './dto/get-shop-catalog-query.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockService: {
    getProducts: jest.Mock;
    getProduct: jest.Mock;
    createProduct: jest.Mock;
    updateProduct: jest.Mock;
    deleteProduct: jest.Mock;
    getProductVariants: jest.Mock;
    createProductVariant: jest.Mock;
    updateProductVariant: jest.Mock;
    deleteProductVariant: jest.Mock;
    getShopCategories: jest.Mock;
    getShopCatalog: jest.Mock;
    getFeaturedProducts: jest.Mock;
    getShopProductDetails: jest.Mock;
    createProductOrder: jest.Mock;
    getMyOrders: jest.Mock;
    getOrderById: jest.Mock;
  };

  beforeEach(async () => {
    mockService = {
      getProducts: jest.fn().mockResolvedValue([]),
      getFeaturedProducts: jest.fn().mockResolvedValue([]),
      getProduct: jest.fn().mockResolvedValue({ id: 'p1' }),
      createProduct: jest.fn().mockResolvedValue({ id: 'p1' }),
      updateProduct: jest.fn().mockResolvedValue({ success: true }),
      deleteProduct: jest.fn().mockResolvedValue({ success: true }),
      getProductVariants: jest.fn().mockResolvedValue([]),
      createProductVariant: jest.fn().mockResolvedValue({ id: 'v1' }),
      updateProductVariant: jest.fn().mockResolvedValue({ success: true }),
      deleteProductVariant: jest.fn().mockResolvedValue({ success: true }),
      getShopCategories: jest
        .fn()
        .mockResolvedValue([{ id: 1, name: 'Souvenirs' }]),
      getShopCatalog: jest
        .fn()
        .mockResolvedValue({ products: [], categories: [] }),
      getShopProductDetails: jest
        .fn()
        .mockResolvedValue({ product: { id: 1 }, variants: [], skus: [] }),
      createProductOrder: jest.fn().mockResolvedValue({
        success: true,
        orderId: 101,
        message: 'Order placed successfully',
      }),
      getMyOrders: jest.fn().mockResolvedValue([
        {
          id: 101,
          currency: 'EUR',
          status: 'pending_payment',
          subtotal_items: 50,
          customer_id: 'user-123',
          items: [],
        },
      ]),
      getOrderById: jest.fn().mockResolvedValue({
        id: 101,
        currency: 'EUR',
        status: 'pending_payment',
        subtotal_items: 50,
        customer_id: 'user-123',
        items: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  describe('Legacy Endpoints', () => {
    it('should pass category query to getProducts', async () => {
      await controller.getProducts('souvenirs');
      expect(mockService.getProducts).toHaveBeenCalledWith('souvenirs');
    });

    it('should pass req.user.id to createProduct', async () => {
      const req = { user: { id: 'seller-1' } };
      const dto = {
        title: 'Product 1',
        description: '',
        price: 20,
        stock: 10,
        category: 'food',
        images: [],
      };
      await controller.createProduct(dto, req);

      expect(mockService.createProduct).toHaveBeenCalledWith(dto, 'seller-1');
    });

    it('should pass variantId and req.user.id to deleteProductVariant', async () => {
      const req = { user: { id: 'seller-1' } };
      await controller.deleteProductVariant('var-99', req);

      expect(mockService.deleteProductVariant).toHaveBeenCalledWith(
        'var-99',
        'seller-1',
      );
    });
  });

  describe('Shop Catalog & Orders Endpoints', () => {
    it('GET /products/categories should return shop categories', async () => {
      const res = await controller.getShopCategories();
      expect(mockService.getShopCategories).toHaveBeenCalled();
      expect(res).toEqual([{ id: 1, name: 'Souvenirs' }]);
    });

    it('GET /products/catalog should return catalog with products and categories', async () => {
      const query: GetShopCatalogQueryDto = {
        category: 'souvenirs',
        featured: true,
      };
      const res = await controller.getShopCatalog(query);
      expect(mockService.getShopCatalog).toHaveBeenCalledWith(query);
      expect(res).toEqual({ products: [], categories: [] });
    });

    it('GET /products/items/:id should return single product detail with variants and skus', async () => {
      const res = await controller.getShopProductDetails('42');
      expect(mockService.getShopProductDetails).toHaveBeenCalledWith('42');
      expect(res).toEqual({ product: { id: 1 }, variants: [], skus: [] });
    });

    it('POST /products/orders should create order and return success result', async () => {
      const dto: CreateProductOrderDto = {
        currency: 'EUR',
        subtotal: 50,
        customerNotes: 'Deliver in afternoon',
        recipient: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+905551234567',
          contact_method: 'whatsapp',
        },
        items: [
          {
            productId: 1,
            productName: 'Olive Oil',
            quantity: 2,
            unitPrice: 25,
            finalPrice: 25,
            subtotal: 50,
          },
        ],
      };
      const req = { user: { id: 'user-123' } };
      const res = await controller.createProductOrder(dto, req);
      expect(mockService.createProductOrder).toHaveBeenCalledWith(
        dto,
        'user-123',
      );
      expect(res).toEqual({
        success: true,
        orderId: 101,
        message: 'Order placed successfully',
      });
    });

    it('GET /products/featured should return featured products', async () => {
      const res = await controller.getFeaturedProducts('4');
      expect(mockService.getFeaturedProducts).toHaveBeenCalledWith(4);
      expect(res).toEqual([]);
    });

    it('GET /products/orders/my-orders should return current user orders', async () => {
      const req = { user: { id: 'user-123' } };
      const res = await controller.getMyOrders(req);
      expect(mockService.getMyOrders).toHaveBeenCalledWith('user-123');
      expect(res).toEqual([
        {
          id: 101,
          currency: 'EUR',
          status: 'pending_payment',
          subtotal_items: 50,
          customer_id: 'user-123',
          items: [],
        },
      ]);
    });

    it('GET /products/orders/:id should return single order for user', async () => {
      const req = { user: { id: 'user-123' } };
      const res = await controller.getOrderById('101', req);
      expect(mockService.getOrderById).toHaveBeenCalledWith('101', 'user-123');
      expect(res).toEqual({
        id: 101,
        currency: 'EUR',
        status: 'pending_payment',
        subtotal_items: 50,
        customer_id: 'user-123',
        items: [],
      });
    });
  });
});
