import { Test, TestingModule } from '@nestjs/testing';
import { BookingsAdminController } from './bookings-admin.controller';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';

describe('BookingsAdminController', () => {
  let controller: BookingsAdminController;
  let mockService: Partial<Record<keyof BookingsService, jest.Mock>>;

  const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };

  beforeEach(async () => {
    mockService = {
      getAdminBookings: jest
        .fn()
        .mockResolvedValue([{ id: 'b-1', status: 'confirmed' }]),
      updateBookingStatus: jest.fn().mockResolvedValue({ success: true }),
      updatePayoutStatus: jest.fn().mockResolvedValue({ success: true }),
      cancelBooking: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsAdminController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingsAdminController>(BookingsAdminController);
  });

  it('should be protected with AuthGuard, RolesGuard and RequireRole("admin") at class level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      BookingsAdminController,
    );
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, BookingsAdminController);
    expect(roles).toEqual(['admin']);
  });

  it('should delegate getAdminBookings with status filter and userId', async () => {
    const res = await controller.getAdminBookings('pending', adminUser);
    expect(mockService.getAdminBookings).toHaveBeenCalledWith(
      'pending',
      'admin-1',
    );
    expect(res).toEqual([{ id: 'b-1', status: 'confirmed' }]);
  });

  it('should delegate updateBookingStatus with status, reason and userId', async () => {
    const res = await controller.updateBookingStatus(
      'b-1',
      { status: 'cancelled', reason: 'Admin refund' },
      adminUser,
    );
    expect(mockService.updateBookingStatus).toHaveBeenCalledWith(
      'b-1',
      'cancelled',
      'Admin refund',
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });

  it('should delegate updatePayoutStatus with payoutStatus and userId', async () => {
    const res = await controller.updatePayoutStatus(
      'b-1',
      { payoutStatus: 'paid' },
      adminUser,
    );
    expect(mockService.updatePayoutStatus).toHaveBeenCalledWith(
      'b-1',
      'paid',
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });

  it('should delegate refundBooking to cancelBooking with id and userId', async () => {
    const res = await controller.refundBooking('b-1', adminUser);
    expect(mockService.cancelBooking).toHaveBeenCalledWith('b-1', 'admin-1');
    expect(res).toEqual({ success: true });
  });
});
