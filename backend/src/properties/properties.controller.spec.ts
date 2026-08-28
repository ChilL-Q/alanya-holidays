import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let mockService: jest.Mocked<Partial<PropertiesService>>;

  const mockUser: AuthUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
  };

  beforeEach(async () => {
    mockService = {
      getPropertyTypes: jest.fn().mockResolvedValue(['villa', 'apartment']),
      getPropertyLocations: jest.fn().mockResolvedValue(['Mahmutlar']),
      getPropertiesByLocation: jest
        .fn()
        .mockResolvedValue({ data: [], count: 0 }),
      getICalFeeds: jest.fn().mockResolvedValue([]),
      addICalFeed: jest.fn().mockResolvedValue({ success: true }),
      syncPropertyICal: jest
        .fn()
        .mockResolvedValue([{ feedId: '1', success: true }]),
      removeICalFeed: jest.fn().mockResolvedValue({ success: true }),
      getPropertyAvailability: jest.fn().mockResolvedValue([]),
      updatePropertyAvailability: jest
        .fn()
        .mockResolvedValue({ success: true }),
      syncPropertyCalendar: jest.fn().mockResolvedValue({ success: true }),
      getUnavailableDates: jest.fn().mockResolvedValue([]),
      getReviews: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getReviewCount: jest.fn().mockResolvedValue(0),
      addReview: jest.fn().mockResolvedValue({ success: true }),
      deleteReview: jest.fn().mockResolvedValue({ success: true }),
      flagReview: jest.fn().mockResolvedValue({ success: true }),
      unflagReview: jest.fn().mockResolvedValue({ success: true }),
      getFlaggedReviews: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      bulkDeleteReviews: jest.fn().mockResolvedValue({ success: true }),
      getPropertiesByIds: jest.fn().mockResolvedValue([]),
      getAvailableProperties: jest.fn().mockResolvedValue([]),
      getAdminProperties: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getPropertiesByHost: jest.fn().mockResolvedValue([]),
      getProperties: jest.fn().mockResolvedValue({ data: [], count: 0 }),
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

    controller = module.get<PropertiesController>(PropertiesController);
  });

  it('should protect the admin property feed by role', () => {
    const handler = Object.getOwnPropertyDescriptor(
      PropertiesController.prototype,
      'getAdminProperties',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    expect(Reflect.getMetadata(ROLE_KEY, handler)).toEqual(['admin']);
  });

  it('should delegate getPropertyTypes to service', async () => {
    const res = await controller.getPropertyTypes();
    expect(res).toEqual(['villa', 'apartment']);
  });

  it('should parse filters JSON in getProperties when passed as string', async () => {
    await controller.getProperties({
      page: 2,
      limit: 15,
      filters: '{"minGuests":4}',
    });

    expect(mockService.getProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 15,
        filters: { minGuests: 4 },
      }),
    );
  });

  it('should pass req.user.id to updateProperty', async () => {
    const user: AuthUser = { id: 'host-1' };
    await controller.updateProperty('prop-10', { title: 'Updated' }, user);

    expect(mockService.updateProperty).toHaveBeenCalledWith(
      'prop-10',
      { title: 'Updated' },
      'host-1',
    );
  });

  it('should pass req.user.id to createProperty', async () => {
    const payload = {
      title: 'New Apt',
      type: 'apartment',
      location: 'Center',
      price_per_night: 100,
    };
    await controller.createProperty(payload, mockUser);

    expect(mockService.createProperty).toHaveBeenCalledWith(payload, 'user-1');
  });

  it('should pass req.user.id to addICalFeed', async () => {
    await controller.addICalFeed(
      'prop-1',
      'Booking.com',
      'https://example.com/ical',
      mockUser,
    );

    expect(mockService.addICalFeed).toHaveBeenCalledWith(
      'prop-1',
      'Booking.com',
      'https://example.com/ical',
      'user-1',
    );
  });

  it('should pass req.user.id to addReview', async () => {
    await controller.addReview(
      'prop-1',
      { rating: 5, comment: 'Great place!' },
      mockUser,
    );

    expect(mockService.addReview).toHaveBeenCalledWith(
      { property_id: 'prop-1', rating: 5, comment: 'Great place!' },
      'user-1',
    );
  });

  it('should pass req.user.id and body to updatePropertyStatus', async () => {
    const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
    await controller.updatePropertyStatus(
      'prop-1',
      { status: 'approved' },
      adminUser,
    );

    expect(mockService.updatePropertyStatus).toHaveBeenCalledWith(
      'prop-1',
      'approved',
      undefined,
      'admin-1',
    );
  });

  it('should protect updatePropertyStatus with RolesGuard and RequireRole("admin")', () => {
    const handler = Object.getOwnPropertyDescriptor(
      PropertiesController.prototype,
      'updatePropertyStatus',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, handler) as string[];
    expect(roles).toEqual(['admin']);
  });
});
