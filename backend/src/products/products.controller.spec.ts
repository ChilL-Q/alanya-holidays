import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      getProducts: jest.fn().mockResolvedValue([]),
      getProduct: jest.fn().mockResolvedValue({ id: 'p1' }),
      createProduct: jest.fn().mockResolvedValue({ id: 'p1' }),
      updateProduct: jest.fn().mockResolvedValue({ success: true }),
      deleteProduct: jest.fn().mockResolvedValue({ success: true }),
      getProductVariants: jest.fn().mockResolvedValue([]),
      createProductVariant: jest.fn().mockResolvedValue({ id: 'v1' }),
      updateProductVariant: jest.fn().mockResolvedValue({ success: true }),
      deleteProductVariant: jest.fn().mockResolvedValue({ success: true }),
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

  it('should pass category query to getProducts', async () => {
    await controller.getProducts('souvenirs');
    expect(mockService.getProducts).toHaveBeenCalledWith('souvenirs');
  });

  it('should pass req.user.id to createProduct', async () => {
    const req = { user: { id: 'seller-1' } };
    const dto = { title: 'Product 1', description: '', price: 20, stock: 10, category: 'food', images: [] };
    await controller.createProduct(dto, req);

    expect(mockService.createProduct).toHaveBeenCalledWith(dto, 'seller-1');
  });

  it('should pass variantId and req.user.id to deleteProductVariant', async () => {
    const req = { user: { id: 'seller-1' } };
    await controller.deleteProductVariant('var-99', req);

    expect(mockService.deleteProductVariant).toHaveBeenCalledWith('var-99', 'seller-1');
  });
});
