import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('ServicesController', () => {
  let controller: ServicesController;
  let mockService: {
    getServiceTypes: jest.Mock;
    getServiceBrands: jest.Mock;
    getServiceModels: jest.Mock;
    getServiceModel: jest.Mock;
    updateServiceModel: jest.Mock;
    getServicesByModel: jest.Mock;
    requestServiceUpdate: jest.Mock;
    getPendingServiceEdits: jest.Mock;
    getMyPendingEdits: jest.Mock;
    getServiceEditsByService: jest.Mock;
    getServiceEdit: jest.Mock;
    deleteServiceEdit: jest.Mock;
    approveServiceEdit: jest.Mock;
    rejectServiceEdit: jest.Mock;
    createService: jest.Mock;
    getServices: jest.Mock;
    getServicesByProvider: jest.Mock;
    getAdminServices: jest.Mock;
    getService: jest.Mock;
    updateService: jest.Mock;
    updateServiceStatus: jest.Mock;
    deleteService: jest.Mock;
  };

  const mockUser: AuthUser = {
    id: 'user-100',
  };

  beforeEach(async () => {
    mockService = {
      getServiceTypes: jest.fn().mockReturnValue(['car', 'bike']),
      getServiceBrands: jest.fn().mockResolvedValue(['BMW', 'Audi']),
      getServiceModels: jest.fn().mockResolvedValue(['X5', 'A4']),
      getServiceModel: jest
        .fn()
        .mockResolvedValue({ brand: 'BMW', model: 'X5' }),
      updateServiceModel: jest.fn().mockResolvedValue({ success: true }),
      getServicesByModel: jest.fn().mockResolvedValue([]),
      requestServiceUpdate: jest.fn().mockResolvedValue({ success: true }),
      getPendingServiceEdits: jest.fn().mockResolvedValue([]),
      getMyPendingEdits: jest.fn().mockResolvedValue([]),
      getServiceEditsByService: jest.fn().mockResolvedValue([]),
      getServiceEdit: jest.fn().mockResolvedValue({ id: 'edit-1' }),
      deleteServiceEdit: jest.fn().mockResolvedValue({ success: true }),
      approveServiceEdit: jest.fn().mockResolvedValue({ success: true }),
      rejectServiceEdit: jest.fn().mockResolvedValue({ success: true }),
      createService: jest.fn().mockResolvedValue({ id: 'srv-1' }),
      getServices: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getServicesByProvider: jest.fn().mockResolvedValue([]),
      getAdminServices: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getService: jest.fn().mockResolvedValue({ id: 'srv-1' }),
      updateService: jest.fn().mockResolvedValue({ success: true }),
      updateServiceStatus: jest.fn().mockResolvedValue({ success: true }),
      deleteService: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockService,
        },
        {
          provide: UserRolesRepository,
          useValue: { getRole: jest.fn().mockResolvedValue('admin') },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  it('should return service types', () => {
    expect(controller.getServiceTypes()).toEqual(['car', 'bike']);
    expect(mockService.getServiceTypes).toHaveBeenCalled();
  });

  it('should get service brands', async () => {
    const brands = await controller.getServiceBrands('car');
    expect(brands).toEqual(['BMW', 'Audi']);
    expect(mockService.getServiceBrands).toHaveBeenCalledWith('car');
  });

  it('should get service models', async () => {
    const models = await controller.getServiceModels('car', 'BMW');
    expect(models).toEqual(['X5', 'A4']);
    expect(mockService.getServiceModels).toHaveBeenCalledWith('car', 'BMW');
  });

  it('should get single service model', async () => {
    const model = await controller.getServiceModel('car', 'BMW', 'X5');
    expect(model).toEqual({ brand: 'BMW', model: 'X5' });
  });

  it('should update service model', async () => {
    const result = await controller.updateServiceModel(
      'model-1',
      { brand: 'BMW' },
      mockUser,
    );
    expect(result).toEqual({ success: true });
    expect(mockService.updateServiceModel).toHaveBeenCalledWith(
      'model-1',
      { brand: 'BMW' },
      'user-100',
    );
  });

  it('should get services by model', async () => {
    const result = await controller.getServicesByModel('car', 'BMW', 'X5');
    expect(result).toEqual([]);
    expect(mockService.getServicesByModel).toHaveBeenCalledWith(
      'car',
      'BMW',
      'X5',
    );
  });

  it('should request service update with raw object or changes envelope', async () => {
    await controller.requestServiceUpdate(
      'srv-1',
      { changes: { title: 'New Car' } },
      mockUser,
    );
    expect(mockService.requestServiceUpdate).toHaveBeenCalledWith(
      'srv-1',
      { title: 'New Car' },
      'user-100',
    );

    await controller.requestServiceUpdate(
      'srv-1',
      { title: 'Direct Title' },
      mockUser,
    );
    expect(mockService.requestServiceUpdate).toHaveBeenCalledWith(
      'srv-1',
      { title: 'Direct Title' },
      'user-100',
    );
  });

  it.each(['getPendingServiceEdits', 'getAdminServices'] as const)(
    'should protect %s by admin role',
    (methodName) => {
      const handler = Object.getOwnPropertyDescriptor(
        ServicesController.prototype,
        methodName,
      )?.value as object;
      const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

      expect(guards).toContain(AuthGuard);
      expect(guards).toContain(RolesGuard);
      expect(Reflect.getMetadata(ROLE_KEY, handler)).toEqual(['admin']);
    },
  );

  it('should get pending service edits', async () => {
    const result = await controller.getPendingServiceEdits();
    expect(result).toEqual([]);
    expect(mockService.getPendingServiceEdits).toHaveBeenCalled();
  });

  it('should get my pending edits', async () => {
    const result = await controller.getMyPendingEdits(mockUser);
    expect(result).toEqual([]);
    expect(mockService.getMyPendingEdits).toHaveBeenCalledWith('user-100');
  });

  it('should get service edits by service', async () => {
    const result = await controller.getServiceEditsByService('srv-1');
    expect(result).toEqual([]);
    expect(mockService.getServiceEditsByService).toHaveBeenCalledWith('srv-1');
  });

  it('should get single service edit', async () => {
    const result = await controller.getServiceEdit('edit-1');
    expect(result).toEqual({ id: 'edit-1' });
    expect(mockService.getServiceEdit).toHaveBeenCalledWith('edit-1');
  });

  it('should delete service edit', async () => {
    const result = await controller.deleteServiceEdit('edit-1', mockUser);
    expect(result).toEqual({ success: true });
    expect(mockService.deleteServiceEdit).toHaveBeenCalledWith(
      'edit-1',
      'user-100',
    );
  });

  it('should approve service edit', async () => {
    const result = await controller.approveServiceEdit('edit-1', mockUser);
    expect(result).toEqual({ success: true });
    expect(mockService.approveServiceEdit).toHaveBeenCalledWith(
      'edit-1',
      'user-100',
    );
  });

  it('should reject service edit', async () => {
    const result = await controller.rejectServiceEdit(
      'edit-1',
      'Incomplete details',
      mockUser,
    );
    expect(result).toEqual({ success: true });
    expect(mockService.rejectServiceEdit).toHaveBeenCalledWith(
      'edit-1',
      'Incomplete details',
      'user-100',
    );
  });

  it('should call getServices with default pagination when query params are omitted', async () => {
    await controller.getServices('car', '', '');
    expect(mockService.getServices).toHaveBeenCalledWith('car', 1, 20);
  });

  it('should parse query params and delegate to getServices', async () => {
    await controller.getServices('car', '2', '10');
    expect(mockService.getServices).toHaveBeenCalledWith('car', 2, 10);
  });

  it('should create service using req.user.id', async () => {
    await controller.createService({ title: 'New Car', type: 'car' }, mockUser);
    expect(mockService.createService).toHaveBeenCalledWith(
      { title: 'New Car', type: 'car' },
      'user-100',
    );
  });

  it('should get services by provider', async () => {
    const result = await controller.getServicesByProvider('prov-1');
    expect(result).toEqual([]);
    expect(mockService.getServicesByProvider).toHaveBeenCalledWith('prov-1');
  });

  it('should parse typesFilter JSON string in getAdminServices', async () => {
    await controller.getAdminServices('pending', '["car","tour"]', '1', '10');
    expect(mockService.getAdminServices).toHaveBeenCalledWith(
      'pending',
      ['car', 'tour'],
      1,
      10,
    );
  });

  it('should get single service by id', async () => {
    const result = await controller.getService('srv-1');
    expect(result).toEqual({ id: 'srv-1' });
    expect(mockService.getService).toHaveBeenCalledWith('srv-1');
  });

  it('should update service', async () => {
    const result = await controller.updateService(
      'srv-1',
      { title: 'Updated' },
      mockUser,
    );
    expect(result).toEqual({ success: true });
    expect(mockService.updateService).toHaveBeenCalledWith(
      'srv-1',
      { title: 'Updated' },
      'user-100',
    );
  });

  it('should update service status', async () => {
    const result = await controller.updateServiceStatus(
      'srv-1',
      { status: 'approved' },
      mockUser,
    );
    expect(result).toEqual({ success: true });
    expect(mockService.updateServiceStatus).toHaveBeenCalledWith(
      'srv-1',
      'approved',
      undefined,
      'user-100',
    );
  });

  it('should delete service', async () => {
    const result = await controller.deleteService(
      'srv-1',
      'Discontinued',
      mockUser,
    );
    expect(result).toEqual({ success: true });
    expect(mockService.deleteService).toHaveBeenCalledWith(
      'srv-1',
      'Discontinued',
      'user-100',
    );
  });

  it('should protect updateServiceStatus with RolesGuard and RequireRole("admin")', () => {
    const handler = Object.getOwnPropertyDescriptor(
      ServicesController.prototype,
      'updateServiceStatus',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, handler) as string[];
    expect(roles).toEqual(['admin']);
  });
});
