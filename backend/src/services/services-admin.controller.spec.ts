import { Test, TestingModule } from '@nestjs/testing';
import { ServicesAdminController } from './services-admin.controller';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';

describe('ServicesAdminController', () => {
  let controller: ServicesAdminController;
  let mockService: Partial<Record<keyof ServicesService, jest.Mock>>;

  const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };

  beforeEach(async () => {
    mockService = {
      getServices: jest
        .fn()
        .mockResolvedValue({ data: [{ id: 's1' }], total: 1 }),
      getService: jest.fn().mockResolvedValue({ id: 's1', title: 'Spa' }),
      updateServiceStatus: jest.fn().mockResolvedValue({ success: true }),
      deleteService: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesAdminController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ServicesAdminController>(ServicesAdminController);
  });

  it('should be protected with AuthGuard, RolesGuard and RequireRole("admin") at class level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      ServicesAdminController,
    );
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, ServicesAdminController);
    expect(roles).toEqual(['admin']);
  });

  it('should delegate getServicesAdmin with parsed params', async () => {
    const res = await controller.getServicesAdmin('wellness', '2', '10');
    expect(mockService.getServices).toHaveBeenCalledWith('wellness', 2, 10);
    expect(res).toEqual({ data: [{ id: 's1' }], total: 1 });
  });

  it('should delegate getServiceAdmin by id', async () => {
    const res = await controller.getServiceAdmin('s1');
    expect(mockService.getService).toHaveBeenCalledWith('s1');
    expect(res).toEqual({ id: 's1', title: 'Spa' });
  });

  it('should delegate updateServiceStatus with status, reason and userId', async () => {
    const res = await controller.updateServiceStatus(
      's1',
      { status: 'approved', reason: 'Verified' },
      adminUser,
    );
    expect(mockService.updateServiceStatus).toHaveBeenCalledWith(
      's1',
      'approved',
      'Verified',
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });

  it('should delegate deleteService with id, reason and userId', async () => {
    const res = await controller.deleteService(
      's1',
      'Duplicate listing',
      adminUser,
    );
    expect(mockService.deleteService).toHaveBeenCalledWith(
      's1',
      'Duplicate listing',
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });
});
