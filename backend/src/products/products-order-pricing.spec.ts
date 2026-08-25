import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { CreateProductOrderDto } from './dto/create-product-order.dto';

/**
 * Adversarial pricing tests for createProductOrder (audit task 2.1):
 * server must resolve prices from the database, never trust client-supplied
 * unitPrice/finalPrice/subtotal values.
 */
describe('ProductsService - server-side order pricing', () => {
  let service: ProductsService;
  let mockRepository: {
    getOrderableProductsByIds: jest.Mock;
    createProductOrder: jest.Mock;
  };

  const dbItem = {
    id: 1,
    name: 'Handmade Carpet',
    price: 1000,
    currency: 'EUR',
    stock: 5,
    status: 'active',
  };

  beforeEach(async () => {
    mockRepository = {
      getOrderableProductsByIds: jest.fn(),
      createProductOrder: jest.fn().mockResolvedValue({
        success: true,
        orderId: 77,
        message: 'Order placed successfully',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: mockRepository },
        {
          provide: UserRolesRepository,
          useValue: { getRole: jest.fn().mockResolvedValue('user') },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  const baseDto = (items: unknown[], subtotal?: number) =>
    ({
      currency: 'EUR',
      subtotal: subtotal ?? items.length * 1000,
      recipient: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+905559876543',
        contact_method: 'email',
      },
      items,
    }) as never;

  it('should charge the DB price even when the client sends a manipulated finalPrice of 1 EUR', async () => {
    mockRepository.getOrderableProductsByIds.mockResolvedValueOnce([dbItem]);

    await service.createProductOrder(
      baseDto([
        {
          productId: 1,
          productName: 'Handmade Carpet',
          quantity: 1,
          unitPrice: 1,
          finalPrice: 1,
          subtotal: 1,
        },
      ]),
      'user-xyz',
    );

    const [[persisted]] = mockRepository.createProductOrder.mock
      .calls as unknown as [[CreateProductOrderDto]];
    if (!persisted) throw new Error('createProductOrder was not called');
    expect(persisted.items[0].unitPrice).toBe(1000);
    expect(persisted.items[0].finalPrice).toBe(1000);
    expect(persisted.items[0].subtotal).toBe(1000);
    expect(persisted.subtotal).toBe(1000);
  });

  it('should use the SKU price when skuId is provided and override the item price from DB', async () => {
    mockRepository.getOrderableProductsByIds.mockResolvedValueOnce([
      {
        ...dbItem,
        skus: [{ id: 10, price: 750, stock: 20, label: 'Large' }],
      },
    ]);

    await service.createProductOrder(
      baseDto([
        {
          productId: 1,
          productName: 'Handmade Carpet',
          skuId: 10,
          quantity: 2,
          unitPrice: 1,
          finalPrice: 1,
          subtotal: 2,
        },
      ]),
      'user-xyz',
    );

    const [[persisted]] = mockRepository.createProductOrder.mock
      .calls as unknown as [[CreateProductOrderDto]];
    if (!persisted) throw new Error('createProductOrder was not called');
    expect(persisted.items[0].unitPrice).toBe(750);
    expect(persisted.items[0].subtotal).toBe(1500);
    expect(persisted.subtotal).toBe(1500);
  });

  it('should price each line by its OWN sku when one product appears twice with different variants', async () => {
    mockRepository.getOrderableProductsByIds.mockResolvedValueOnce([
      {
        ...dbItem,
        price: 10,
        stock: 100,
        skus: [
          { id: 10, price: 100, stock: 5, label: 'Standard' },
          { id: 11, price: 500, stock: 3, label: 'Deluxe' },
        ],
      },
    ]);

    await service.createProductOrder(
      baseDto([
        {
          productId: 1,
          productName: 'Handmade Carpet',
          skuId: 11,
          quantity: 1,
          unitPrice: 1,
          finalPrice: 1,
          subtotal: 1,
        },
        {
          productId: 1,
          productName: 'Handmade Carpet',
          skuId: 10,
          quantity: 2,
          unitPrice: 1,
          finalPrice: 1,
          subtotal: 2,
        },
      ]),
      'user-xyz',
    );

    const [[persisted]] = mockRepository.createProductOrder.mock
      .calls as unknown as [[CreateProductOrderDto]];
    if (!persisted) throw new Error('createProductOrder was not called');
    // Deluxe priced at 500 despite the cheaper Standard sku existing first.
    expect(persisted.items[0].unitPrice).toBe(500);
    expect(persisted.items[0].skuId).toBe(11);
    expect(persisted.items[1].unitPrice).toBe(100);
    expect(persisted.items[1].skuId).toBe(10);
    expect(persisted.subtotal).toBe(700);
  });

  it('should reject a skuId that does not belong to the ordered product', async () => {
    mockRepository.getOrderableProductsByIds.mockResolvedValueOnce([
      {
        ...dbItem,
        skus: [{ id: 10, price: 750, stock: 20, label: 'Large' }],
      },
    ]);

    await expect(
      service.createProductOrder(
        baseDto([
          {
            productId: 1,
            productName: 'Handmade Carpet',
            skuId: 999,
            quantity: 1,
            unitPrice: 10,
            finalPrice: 10,
            subtotal: 10,
          },
        ]),
        'user-xyz',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockRepository.createProductOrder).not.toHaveBeenCalled();
  });

  it('should reject an order referencing an unknown or inactive product', async () => {
    mockRepository.getOrderableProductsByIds.mockResolvedValueOnce([]);

    await expect(
      service.createProductOrder(
        baseDto([
          {
            productId: 999,
            productName: 'Ghost Product',
            quantity: 1,
            unitPrice: 10,
            finalPrice: 10,
            subtotal: 10,
          },
        ]),
        'user-xyz',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockRepository.createProductOrder).not.toHaveBeenCalled();
  });

  it('should reject ordering more quantity than available stock', async () => {
    mockRepository.getOrderableProductsByIds.mockResolvedValueOnce(
      dbItem ? [dbItem] : [],
    );

    await expect(
      service.createProductOrder(
        baseDto([
          {
            productId: 1,
            productName: 'Handmade Carpet',
            quantity: 50,
            unitPrice: 1000,
            finalPrice: 1000,
            subtotal: 50000,
          },
        ]),
        'user-xyz',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject mixed currencies between DB products and requested currency', async () => {
    mockRepository.getOrderableProductsByIds.mockResolvedValueOnce([
      { ...dbItem, currency: 'TRY' },
    ]);

    await expect(
      service.createProductOrder(
        baseDto([
          {
            productId: 1,
            productName: 'Handmade Carpet',
            quantity: 1,
            unitPrice: 1000,
            finalPrice: 1000,
            subtotal: 1000,
          },
        ]),
        'user-xyz',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
