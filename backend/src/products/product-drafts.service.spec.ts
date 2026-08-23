import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ProductDraftsService } from './product-drafts.service';
import { ProductsRepository } from './products.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('ProductDraftsService', () => {
  let service: ProductDraftsService;
  let mockUserRolesRepo: {
    getRole: jest.Mock;
  };
  let mockRepository: {
    insertProduct: jest.Mock<
      Promise<{ id: string }>,
      [Record<string, unknown>]
    >;
    updateProduct: jest.Mock<Promise<void>, [string, Record<string, unknown>]>;
    getProductOwnership: jest.Mock;
  };

  beforeEach(async () => {
    const insertProduct = jest.fn<
      Promise<{ id: string }>,
      [Record<string, unknown>]
    >();
    const updateProduct = jest.fn<
      Promise<void>,
      [string, Record<string, unknown>]
    >();
    insertProduct.mockResolvedValue({ id: 'new' });
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      insertProduct,
      updateProduct,
      getProductOwnership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductDraftsService,
        { provide: ProductsRepository, useValue: mockRepository },
        { provide: UserRolesRepository, useValue: mockUserRolesRepo },
      ],
    }).compile();

    service = module.get<ProductDraftsService>(ProductDraftsService);
  });

  it('creates a draft with immutable fields stripped and status forced to draft', async () => {
    mockRepository.insertProduct.mockResolvedValue({ id: 'prod-1' });

    const result = await service.saveProductDraft(
      {
        title: 'Handmade Bowl',
        seller_id: 'attacker',
      },
      'user-1',
    );

    expect(result).toEqual({ id: 'prod-1' });
    const payload = mockRepository.insertProduct.mock.calls[0][0];
    expect(payload.status).toBe('draft');
    expect(payload.seller_id).toBe('user-1');
    expect(payload.artisan_id).toBeUndefined();
  });

  it('defaults an empty title to Untitled Draft', async () => {
    mockRepository.insertProduct.mockResolvedValue({ id: 'prod-2' });

    await service.saveProductDraft({}, 'user-1');

    expect(mockRepository.insertProduct.mock.calls[0][0].title).toBe(
      'Untitled Draft',
    );
  });

  it('rejects saving over a foreign draft', async () => {
    mockRepository.getProductOwnership.mockResolvedValue({
      seller_id: 'owner-1',
    });
    mockUserRolesRepo.getRole.mockResolvedValue('user');

    await expect(
      service.saveProductDraft(
        { draftId: '550e8400-e29b-41d4-a716-446655440003' },
        'user-2',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('publishes as owner and transitions draft -> active without protected fields', async () => {
    mockRepository.getProductOwnership.mockResolvedValue({
      seller_id: 'user-1',
    });
    mockUserRolesRepo.getRole.mockResolvedValue('user');

    await service.publishProductDraft(
      '550e8400-e29b-41d4-a716-446655440003',
      { title: 'Bowl', price: 25, seller_id: 'attacker' },
      'user-1',
    );

    const updates = mockRepository.updateProduct.mock.calls[0][1];
    expect(updates.status).toBe('active');
    expect(updates.seller_id).toBeUndefined();
  });

  it('rejects publishing an invalid uuid', async () => {
    await expect(
      service.publishProductDraft('not-a-uuid', {}, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
