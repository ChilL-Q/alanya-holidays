import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CheckConflictQueryDto } from './dto/check-conflict-query.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('BookingsController', () => {
  let controller: BookingsController;
  let mockService: jest.Mocked<Partial<BookingsService>>;

  beforeEach(async () => {
    mockService = {
      checkConflict: jest
        .fn()
        .mockResolvedValue({ has_conflict: false, message: 'Available' }),
      createBooking: jest.fn().mockResolvedValue('booking-id-123'),
      getUserBookings: jest.fn().mockResolvedValue([]),
      getAdminBookings: jest.fn().mockResolvedValue([]),
      getBookingsForHost: jest.fn().mockResolvedValue([]),
      updateBookingStatus: jest.fn().mockResolvedValue({ success: true }),
      cancelBooking: jest.fn().mockResolvedValue({ success: true }),
      updatePayoutStatus: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
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

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should delegate checkConflict call to service', async () => {
    const query = Object.assign(new CheckConflictQueryDto(), {
      itemId: 'p1',
      itemType: 'property',
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
    });
    await controller.checkConflict(query);
    expect(mockService.checkConflict).toHaveBeenCalledWith(
      'p1',
      'property',
      '2026-08-01',
      '2026-08-05',
    );
  });

  it('should protect createBooking with AuthGuard metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      BookingsController.prototype,
      'createBooking',
    );
    expect(descriptor?.value).toBeDefined();
    const createBookingHandler = descriptor!.value as object;
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      createBookingHandler,
    ) as Array<new (...args: unknown[]) => unknown> | undefined;

    expect(guards).toContain(AuthGuard);
  });

  it('should delegate createBooking call to service with authenticated user id', async () => {
    const dto = {
      item_id: 'p1',
      check_in: '2026-08-01',
      check_out: '2026-08-05',
      guests: 2,
    };
    const user: AuthUser = { id: 'u1' };
    const res = await controller.createBooking(dto, user);
    expect(res).toEqual({ id: 'booking-id-123', data: 'booking-id-123' });
    expect(mockService.createBooking).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should pass req.user.id to getUserBookings', async () => {
    const user: AuthUser = { id: 'usr-7' };
    await controller.getUserBookings(user);
    expect(mockService.getUserBookings).toHaveBeenCalledWith('usr-7');
  });

  it('should pass req.user.id and status to getAdminBookings', async () => {
    const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
    await controller.getAdminBookings('confirmed', adminUser);
    expect(mockService.getAdminBookings).toHaveBeenCalledWith(
      'confirmed',
      'admin-1',
    );
  });

  it('should pass req.user.id and hostId to getBookingsForHost', async () => {
    const hostUser: AuthUser = { id: 'host-1' };
    await controller.getBookingsForHost(
      'host-1',
      '2026-08-01',
      '2026-08-30',
      hostUser,
    );
    expect(mockService.getBookingsForHost).toHaveBeenCalledWith(
      'host-1',
      '2026-08-01',
      '2026-08-30',
      'host-1',
    );
  });

  it('should pass req.user.id and body to updateBookingStatus', async () => {
    const user: AuthUser = { id: 'usr-7' };
    await controller.updateBookingStatus('b1', { status: 'confirmed' }, user);
    expect(mockService.updateBookingStatus).toHaveBeenCalledWith(
      'b1',
      'confirmed',
      undefined,
      'usr-7',
    );
  });

  it('should pass req.user.id to cancelBooking', async () => {
    const user: AuthUser = { id: 'usr-7' };
    await controller.cancelBooking('b1', user);
    expect(mockService.cancelBooking).toHaveBeenCalledWith('b1', 'usr-7');
  });

  it('should pass req.user.id and payoutStatus to updatePayoutStatus', async () => {
    const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
    await controller.updatePayoutStatus(
      'b1',
      { payoutStatus: 'paid' },
      adminUser,
    );
    expect(mockService.updatePayoutStatus).toHaveBeenCalledWith(
      'b1',
      'paid',
      'admin-1',
    );
  });

  it('should protect getAdminBookings with RolesGuard and RequireRole("admin")', () => {
    const handler = Object.getOwnPropertyDescriptor(
      BookingsController.prototype,
      'getAdminBookings',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, handler) as string[];
    expect(roles).toEqual(['admin']);
  });

  it('should protect updatePayoutStatus with RolesGuard and RequireRole("admin")', () => {
    const handler = Object.getOwnPropertyDescriptor(
      BookingsController.prototype,
      'updatePayoutStatus',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, handler) as string[];
    expect(roles).toEqual(['admin']);
  });
});
