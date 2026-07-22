import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      getPropertyTypes: jest.fn().mockResolvedValue(['villa', 'apartment']),
      getPropertyLocations: jest.fn().mockResolvedValue(['Mahmutlar']),
      getPropertiesByLocation: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getICalFeeds: jest.fn().mockResolvedValue([]),
      addICalFeed: jest.fn().mockResolvedValue({ success: true }),
      syncPropertyICal: jest.fn().mockResolvedValue({ success: true }),
      removeICalFeed: jest.fn().mockResolvedValue({ success: true }),
      getPropertyAvailability: jest.fn().mockResolvedValue([]),
      updatePropertyAvailability: jest.fn().mockResolvedValue({ success: true }),
      syncPropertyCalendar: jest.fn().mockResolvedValue({ success: true }),
      getUnavailableDates: jest.fn().mockResolvedValue([]),
      getReviews: jest.fn().mockResolvedValue([]),
      getReviewCount: jest.fn().mockResolvedValue({ count: 0 }),
      addReview: jest.fn().mockResolvedValue({ id: 'r1' }),
      deleteReview: jest.fn().mockResolvedValue({ success: true }),
      flagReview: jest.fn().mockResolvedValue({ success: true }),
      unflagReview: jest.fn().mockResolvedValue({ success: true }),
      getFlaggedReviews: jest.fn().mockResolvedValue([]),
      bulkDeleteReviews: jest.fn().mockResolvedValue({ success: true }),
      getPropertiesByIds: jest.fn().mockResolvedValue([]),
      getAvailableProperties: jest.fn().mockResolvedValue([]),
      getAdminProperties: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getPropertiesByHost: jest.fn().mockResolvedValue([]),
      getProperties: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getProperty: jest.fn().mockResolvedValue({ id: 'prop-1' }),
      createProperty: jest.fn().mockResolvedValue({ id: 'prop-1' }),
      updateProperty: jest.fn().mockResolvedValue({ success: true }),
      updatePropertyStatus: jest.fn().mockResolvedValue({ success: true }),
      deleteProperty: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        {
          provide: PropertiesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  it('should delegate getPropertyTypes to service', async () => {
    const res = await controller.getPropertyTypes();
    expect(res).toEqual(['villa', 'apartment']);
  });

  it('should parse filters JSON in getProperties when passed as string', async () => {
    await controller.getProperties({
      page: '2',
      limit: '15',
      filters: '{"minPrice":100}',
    });

    expect(mockService.getProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 15,
        filters: { minPrice: 100 },
      }),
    );
  });

  it('should pass req.user.id to updateProperty', async () => {
    const req = { user: { id: 'host-1' } };
    await controller.updateProperty('prop-10', { title: 'Updated' }, req);

    expect(mockService.updateProperty).toHaveBeenCalledWith(
      'prop-10',
      { title: 'Updated' },
      'host-1',
    );
  });
});
