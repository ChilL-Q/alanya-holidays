import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';

describe('ServicesController', () => {
  let controller: ServicesController;
  let mockService: any;

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
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  it('should return service types', () => {
    expect(controller.getServiceTypes()).toEqual(['car', 'bike']);
    expect(mockService.getServiceTypes).toHaveBeenCalled();
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
    const req = { user: { id: 'user-100' } };
    await controller.createService({ title: 'New Car' }, req);
    expect(mockService.createService).toHaveBeenCalledWith(
      { title: 'New Car' },
      'user-100',
    );
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
});
