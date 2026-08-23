import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesAdminController } from './properties-admin.controller';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';

describe('PropertiesAdminController', () => {
  let controller: PropertiesAdminController;
  let mockService: Partial<Record<keyof PropertiesService, jest.Mock>>;

  const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };

  beforeEach(async () => {
    mockService = {
      getAdminProperties: jest
        .fn()
        .mockResolvedValue({ data: [{ id: 'p1' }], count: 1 }),
      getProperty: jest.fn().mockResolvedValue({ id: 'p1', title: 'Villa' }),
      updatePropertyStatus: jest.fn().mockResolvedValue({ success: true }),
      deleteProperty: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesAdminController],
      providers: [
        {
          provide: PropertiesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PropertiesAdminController>(
      PropertiesAdminController,
    );
  });

  it('should be protected with AuthGuard, RolesGuard and RequireRole("admin") at class level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PropertiesAdminController,
    );
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, PropertiesAdminController);
    expect(roles).toEqual(['admin']);
  });

  it('should delegate getPropertiesAdmin with parsed params', async () => {
    const res = await controller.getPropertiesAdmin('pending', '2', '10');
    expect(mockService.getAdminProperties).toHaveBeenCalledWith(
      'pending',
      2,
      10,
    );
    expect(res).toEqual({ data: [{ id: 'p1' }], count: 1 });
  });

  it('should delegate getPropertyAdmin by id', async () => {
    const res = await controller.getPropertyAdmin('p1');
    expect(mockService.getProperty).toHaveBeenCalledWith('p1');
    expect(res).toEqual({ id: 'p1', title: 'Villa' });
  });

  it('should delegate updatePropertyStatus with status, reason and userId', async () => {
    const res = await controller.updatePropertyStatus(
      'p1',
      { status: 'approved', reason: 'Verified' },
      adminUser,
    );
    expect(mockService.updatePropertyStatus).toHaveBeenCalledWith(
      'p1',
      'approved',
      'Verified',
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });

  it('should delegate deleteProperty with id, reason and userId', async () => {
    const res = await controller.deleteProperty(
      'p1',
      'Duplicate listing',
      adminUser,
    );
    expect(mockService.deleteProperty).toHaveBeenCalledWith(
      'p1',
      'Duplicate listing',
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });
});
