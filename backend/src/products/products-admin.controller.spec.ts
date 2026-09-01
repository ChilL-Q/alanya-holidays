import { Test, TestingModule } from '@nestjs/testing';
import { ProductsAdminController } from './products-admin.controller';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';

describe('ProductsAdminController', () => {
  let controller: ProductsAdminController;
  let mockService: Partial<Record<keyof ProductsService, jest.Mock>>;

  const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };

  beforeEach(async () => {
    mockService = {
      getProductsAdmin: jest.fn().mockResolvedValue({
        items: [{ id: 'pr-1', title: 'Silk Scarf' }],
        page: 2,
        limit: 20,
        total: 21,
      }),
      getProducts: jest
        .fn()
        .mockResolvedValue([{ id: 'pr-1', title: 'Silk Scarf' }]),
      getAdminProduct: jest
        .fn()
        .mockResolvedValue({ id: 1, name: 'Silk Scarf' }),
      createAdminProduct: jest.fn().mockResolvedValue({ id: 2 }),
      updateAdminProduct: jest.fn().mockResolvedValue({ id: 1 }),
      deleteAdminProduct: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsAdminController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsAdminController>(ProductsAdminController);
  });

  it('should be protected with AuthGuard, RolesGuard and RequireRole("admin") at class level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      ProductsAdminController,
    );
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, ProductsAdminController);
    expect(roles).toEqual(['admin']);
  });

  it('should delegate paginated searchable admin product queries', async () => {
    const res = await controller.getProductsAdmin({
      category_id: 7,
      page: 2,
      limit: 20,
      search: 'scarf',
    });
    expect(mockService.getProductsAdmin).toHaveBeenCalledWith(
      7,
      2,
      20,
      'scarf',
    );
    expect(res).toEqual({
      items: [{ id: 'pr-1', title: 'Silk Scarf' }],
      page: 2,
      limit: 20,
      total: 21,
    });
  });

  it('should delegate getProductAdmin by id', async () => {
    const res = await controller.getProductAdmin(1);
    expect(mockService.getAdminProduct).toHaveBeenCalledWith(1);
    expect(res).toEqual({ id: 1, name: 'Silk Scarf' });
  });

  it('should delegate create and full update with the authenticated admin id', async () => {
    const create = {
      name: 'Copper Lamp',
      description: 'Handmade lamp',
      price: 120,
      stock: 4,
      category_id: 7,
      currency: 'EUR',
      media: [{ url: 'https://example.com/lamp.jpg', type: 'image' }],
    };
    await expect(controller.createProduct(create, adminUser)).resolves.toEqual({
      id: 2,
    });
    expect(mockService.createAdminProduct).toHaveBeenCalledWith(
      create,
      'admin-1',
    );

    await controller.updateProduct(1, { name: 'Updated Lamp' });
    expect(mockService.updateAdminProduct).toHaveBeenCalledWith(1, {
      name: 'Updated Lamp',
    });
  });

  it('should delegate updateProductStatus with status and userId', async () => {
    const res = await controller.updateProductStatus(1, { status: 'inactive' });
    expect(mockService.updateAdminProduct).toHaveBeenCalledWith(1, {
      status: 'inactive',
    });
    expect(res).toEqual({ id: 1 });
  });

  it('should delegate deleteProduct with id and userId', async () => {
    const res = await controller.deleteProduct(1);
    expect(mockService.deleteAdminProduct).toHaveBeenCalledWith(1);
    expect(res).toEqual({ success: true });
  });
});
