import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../auth/auth.guard';

describe('BookingsController', () => {
  let controller: BookingsController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      checkConflict: jest.fn().mockResolvedValue({ has_conflict: false, message: 'Available' }),
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
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should delegate checkConflict call to service', async () => {
    await controller.checkConflict('p1', 'property', '2026-08-01', '2026-08-05');
    expect(mockService.checkConflict).toHaveBeenCalledWith(
      'p1',
      'property',
      '2026-08-01',
      '2026-08-05',
    );
  });

  it('should delegate createBooking call to service', async () => {
    const dto = { item_id: 'p1', user_id: 'u1' };
    const res = await controller.createBooking(dto);
    expect(res).toBe('booking-id-123');
    expect(mockService.createBooking).toHaveBeenCalledWith(dto);
  });

  it('should pass req.user.id to getUserBookings', async () => {
    const req = { user: { id: 'usr-7' } };
    await controller.getUserBookings(req);
    expect(mockService.getUserBookings).toHaveBeenCalledWith('usr-7');
  });

  it('should pass req.user.id and body to updateBookingStatus', async () => {
    const req = { user: { id: 'usr-7' } };
    await controller.updateBookingStatus('b1', { status: 'confirmed' }, req);
    expect(mockService.updateBookingStatus).toHaveBeenCalledWith(
      'b1',
      'confirmed',
      undefined,
      'usr-7',
    );
  });
});
