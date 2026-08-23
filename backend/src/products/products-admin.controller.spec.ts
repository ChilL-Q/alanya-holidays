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
      getProducts: jest
        .fn()
        .mockResolvedValue([{ id: 'pr-1', title: 'Silk Scarf' }]),
      getProduct: jest
        .fn()
        .mockResolvedValue({ id: 'pr-1', title: 'Silk Scarf' }),
      updateProduct: jest.fn().mockResolvedValue({ success: true }),
      deleteProduct: jest.fn().mockResolvedValue({ success: true }),
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

  it('should delegate getProductsAdmin with category filter', async () => {
    const res = await controller.getProductsAdmin('textiles');
    expect(mockService.getProducts).toHaveBeenCalledWith('textiles');
    expect(res).toEqual([{ id: 'pr-1', title: 'Silk Scarf' }]);
  });

  it('should delegate getProductAdmin by id', async () => {
    const res = await controller.getProductAdmin('pr-1');
    expect(mockService.getProduct).toHaveBeenCalledWith('pr-1');
    expect(res).toEqual({ id: 'pr-1', title: 'Silk Scarf' });
  });

  it('should delegate updateProductStatus with status and userId', async () => {
    const res = await controller.updateProductStatus(
      'pr-1',
      'archived',
      adminUser,
    );
    expect(mockService.updateProduct).toHaveBeenCalledWith(
      'pr-1',
      { status: 'archived' },
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });

  it('should delegate deleteProduct with id and userId', async () => {
    const res = await controller.deleteProduct('pr-1', adminUser);
    expect(mockService.deleteProduct).toHaveBeenCalledWith('pr-1', 'admin-1');
    expect(res).toEqual({ success: true });
  });
});
