import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { EmailOutboxRepository } from './email-outbox.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockEmailOutbox: { enqueue: jest.Mock };

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      findOverlappingBookings: jest.fn().mockResolvedValue([]),
      checkPropertyAvailabilityBlocks: jest.fn().mockResolvedValue([]),
      getProperty: jest.fn(),
      getService: jest.fn(),
      insertBooking: jest.fn(),
      createBookingRpc: jest.fn().mockResolvedValue('b-100'),
      upsertPropertyAvailability: jest.fn(),
      getProfile: jest.fn(),
      invokeEmailFunction: jest.fn(),
      getUserBookings: jest.fn(),
      getAdminBookings: jest.fn(),
      getPropertiesByHost: jest.fn(),
      getBookingsByPropertyIds: jest.fn(),
      getProfilesByIds: jest.fn(),
      getPropertiesByIds: jest.fn(),
      getServicesByIds: jest.fn(),
      getBookingById: jest.fn(),
      unblockDatesForBooking: jest.fn(),
      updateBookingStatus: jest.fn(),
      transitionStatus: jest.fn().mockResolvedValue({
        id: 'b1',
        oldStatus: 'pending',
        newStatus: 'confirmed',
        unblockedDatesCount: 0,
        itemId: 'prop-1',
        itemType: 'property',
        userId: 'user1',
        checkIn: '2026-08-01',
        checkOut: '2026-08-05',
        totalPrice: 400,
      }),
      getBookingForCancellation: jest.fn(),
      updatePayoutStatus: jest.fn(),
      getPayoutStatus: jest.fn().mockResolvedValue('pending'),
    };

    mockEmailOutbox = { enqueue: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: BookingsRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
        {
          provide: EmailOutboxRepository,
          useValue: mockEmailOutbox,
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyUser: jest.fn(),
            getUserNotifications: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('checkConflict', () => {
    it('should return conflict true if overlapping bookings exist', async () => {
      mockRepository.findOverlappingBookings.mockResolvedValueOnce([
        { id: 'b1' },
      ]);

      const result = await service.checkConflict(
        'p1',
        'property',
        '2026-08-01',
        '2026-08-05',
      );
      expect(result.has_conflict).toBe(true);
      expect(result.message).toBe('Dates are already booked');
    });

    it('should return conflict false if no overlap or blocks', async () => {
      mockRepository.findOverlappingBookings.mockResolvedValueOnce([]);
      mockRepository.checkPropertyAvailabilityBlocks.mockResolvedValueOnce([]);

      const result = await service.checkConflict(
        'p1',
        'property',
        '2026-08-01',
        '2026-08-05',
      );
      expect(result.has_conflict).toBe(false);
    });

    it('should throw BadRequestException if dates are invalid', async () => {
      await expect(
        service.checkConflict('p1', 'property', 'invalid-date', '2026-08-05'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBooking', () => {
    it('should throw BadRequestException if property is not found', async () => {
      mockRepository.getProperty.mockResolvedValueOnce(null);

      await expect(
        service.createBooking(
          {
            item_id: 'p999',
            check_in: '2026-08-01',
            check_out: '2026-08-05',
            guests: 2,
            item_type: 'property',
          },
          'u1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user tries to book own property', async () => {
      mockRepository.getProperty.mockResolvedValueOnce({
        id: 'p1',
        status: 'approved',
        host_id: 'u1',
        title: 'Villa',
        price_per_night: 150,
        cleaning_fee: 50,
        currency: 'EUR',
      });

      await expect(
        service.createBooking(
          {
            item_id: 'p1',
            check_in: '2026-08-01',
            check_out: '2026-08-05',
            guests: 2,
            item_type: 'property',
          },
          'u1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create booking via atomic RPC with server-calculated property price', async () => {
      mockRepository.getProperty.mockResolvedValueOnce({
        id: 'p1',
        status: 'approved',
        host_id: 'host1',
        title: 'Villa',
        price_per_night: 150,
        cleaning_fee: 25,
        currency: 'EUR',
      });
      mockRepository.createBookingRpc.mockResolvedValueOnce('b-100');

      const result = await service.createBooking(
        {
          item_id: 'p1',
          check_in: '2026-08-01',
          check_out: '2026-08-03',
          guests: 2,
          item_type: 'property',
        },
        'user2',
      );

      expect(result).toBe('b-100');
      expect(mockRepository.createBookingRpc).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'p1',
          userId: 'user2',
          checkIn: '2026-08-01',
          checkOut: '2026-08-03',
          totalPrice: 325,
          guests: 2,
          itemType: 'property',
        }),
      );
    });
  });

  describe('updateBookingStatus (Atomic Transitions & Error Handling)', () => {
    it('should throw NotFoundException if booking does not exist', async () => {
      mockRepository.getBookingById.mockResolvedValueOnce(null);

      await expect(
        service.updateBookingStatus('b999', 'confirmed', undefined, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user has no rights to update', async () => {
      mockRepository.getBookingById.mockResolvedValueOnce({
        id: 'b1',
        user_id: 'user1',
        item_id: 'prop-1',
        item_type: 'property',
        check_in: '2026-08-01',
        check_out: '2026-08-05',
        total_price: 400,
        status: 'pending',
        property: { host_id: 'host1' },
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.updateBookingStatus('b1', 'confirmed', undefined, 'other-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should atomically transition status and trigger rejection email on pending cancellation', async () => {
      mockRepository.getBookingById.mockResolvedValueOnce({
        id: 'b1',
        user_id: 'user1',
        item_id: 'prop-1',
        item_type: 'property',
        status: 'pending',
        check_in: '2026-08-01',
        check_out: '2026-08-05',
        total_price: 400,
        property: { host_id: 'host1', title: 'Villa' },
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.transitionStatus.mockResolvedValueOnce({
        id: 'b1',
        oldStatus: 'pending',
        newStatus: 'cancelled',
        unblockedDatesCount: 4,
        itemId: 'prop-1',
        itemType: 'property',
        userId: 'user1',
        checkIn: '2026-08-01',
        checkOut: '2026-08-05',
        totalPrice: 400,
      });

      const result = await service.updateBookingStatus(
        'b1',
        'cancelled',
        'Host rejected application',
        'host1',
      );

      expect(mockRepository.transitionStatus).toHaveBeenCalledWith({
        bookingId: 'b1',
        newStatus: 'cancelled',
        userId: 'host1',
        reason: 'Host rejected application',
      });
      expect(result.success).toBe(true);
      expect(result.transition.unblockedDatesCount).toBe(4);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'booking_rejected',
          userId: 'user1',
        }),
      );
    });

    it('should trigger booking_cancelled and booking_cancelled_host when confirmed booking is cancelled', async () => {
      mockRepository.getBookingById.mockResolvedValueOnce({
        id: 'b1',
        user_id: 'user1',
        item_id: 'prop-1',
        item_type: 'property',
        status: 'confirmed',
        check_in: '2026-08-01',
        check_out: '2026-08-05',
        total_price: 400,
        property: { host_id: 'host1', title: 'Villa' },
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.transitionStatus.mockResolvedValueOnce({
        id: 'b1',
        oldStatus: 'confirmed',
        newStatus: 'cancelled',
        unblockedDatesCount: 4,
        itemId: 'prop-1',
        itemType: 'property',
        userId: 'user1',
        checkIn: '2026-08-01',
        checkOut: '2026-08-05',
        totalPrice: 400,
      });

      const result = await service.updateBookingStatus(
        'b1',
        'cancelled',
        'Guest cancelled',
        'user1',
      );

      expect(result.success).toBe(true);
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'booking_cancelled',
          userId: 'user1',
        }),
      );
      expect(mockEmailOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'booking_cancelled_host',
          userId: 'host1',
        }),
      );
    });
  });

  describe('Full Multi-Role Workflows (Client, Host/Vendor, Admin)', () => {
    it('Client workflow: should fetch client bookings', async () => {
      mockRepository.getUserBookings.mockResolvedValueOnce([
        {
          id: 'b-1',
          user_id: 'client-1',
          item_id: 'p-1',
          item_type: 'property',
          status: 'confirmed',
          itemTitle: 'Ocean Villa',
          property: { id: 'p-1', title: 'Ocean Villa' },
        },
      ]);

      const result = await service.getUserBookings('client-1');
      expect(result).toHaveLength(1);
      expect(result[0].itemTitle).toBe('Ocean Villa');
    });

    it('Host/Vendor workflow: should fetch host bookings and allow host to confirm booking', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getPropertiesByHost.mockResolvedValueOnce([
        { id: 'p-10', title: 'Luxury Penthouse' },
      ]);
      mockRepository.getBookingsByPropertyIds.mockResolvedValueOnce([
        {
          id: 'b-20',
          item_id: 'p-10',
          user_id: 'client-5',
          status: 'confirmed',
        },
      ]);
      mockRepository.getProfilesByIds.mockResolvedValueOnce([
        { id: 'client-5', full_name: 'John Doe', email: 'john@example.com' },
      ]);

      const hostBookings = await service.getBookingsForHost(
        'host-123',
        undefined,
        undefined,
        'host-123',
      );
      expect(hostBookings).toHaveLength(1);
      expect(
        (hostBookings[0].user as { full_name?: string } | undefined)?.full_name,
      ).toBe('John Doe');

      // Host confirms booking
      mockRepository.getBookingById.mockResolvedValueOnce({
        id: 'b-20',
        user_id: 'client-5',
        item_id: 'p-10',
        item_type: 'property',
        check_in: '2026-08-10',
        check_out: '2026-08-15',
        total_price: 500,
        status: 'pending',
        property: { host_id: 'host-123', title: 'Luxury Penthouse' },
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.transitionStatus.mockResolvedValueOnce({
        id: 'b-20',
        oldStatus: 'pending',
        newStatus: 'confirmed',
        unblockedDatesCount: 0,
        itemId: 'p-10',
        itemType: 'property',
        userId: 'client-5',
        checkIn: '2026-08-10',
        checkOut: '2026-08-15',
        totalPrice: 500,
      });

      const confirmResult = await service.updateBookingStatus(
        'b-20',
        'confirmed',
        undefined,
        'host-123',
      );
      expect(confirmResult.success).toBe(true);
      expect(mockRepository.transitionStatus).toHaveBeenCalledWith({
        bookingId: 'b-20',
        newStatus: 'confirmed',
        userId: 'host-123',
        reason: undefined,
      });
    });

    it('Admin workflow: should allow admin to view all bookings and update payout status', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getAdminBookings.mockResolvedValueOnce([
        { id: 'b-100', status: 'pending', user: { full_name: 'Alice' } },
      ]);

      const adminBookings = await service.getAdminBookings(
        'pending',
        'admin-id',
      );
      expect(adminBookings).toHaveLength(1);
      expect(mockRepository.getAdminBookings).toHaveBeenCalledWith('pending');

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      const payoutResult = await service.updatePayoutStatus(
        'b-100',
        'paid',
        'admin-id',
      );
      expect(payoutResult).toEqual({ success: true });
      expect(mockRepository.updatePayoutStatus).toHaveBeenCalledWith(
        'b-100',
        'paid',
      );
    });
  });
});
