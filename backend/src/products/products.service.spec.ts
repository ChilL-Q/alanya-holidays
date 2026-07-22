import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      insertProduct: jest.fn(),
      getProducts: jest.fn().mockResolvedValue([]),
      getProductById: jest.fn(),
      getUserRole: jest.fn(),
      getProductOwnership: jest.fn(),
      updateProduct: jest.fn().mockResolvedValue({}),
      deleteProduct: jest.fn().mockResolvedValue({}),
      getProductVariants: jest.fn().mockResolvedValue([]),
      insertProductVariant: jest.fn(),
      getVariantProductId: jest.fn(),
      updateProductVariant: jest.fn().mockResolvedValue({}),
      deleteProductVariant: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: mockRepository,
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');
      mockRepository.getProductOwnership.mockResolvedValueOnce({
        seller_id: 'owner-user',
      });

      await expect(
        service.updateProduct('p1', { title: 'Updated' }, 'random-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update product if caller is owner', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');
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
});
