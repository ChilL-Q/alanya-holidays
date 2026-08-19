import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { NotificationsService } from '../notifications/notifications.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
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
      getUserRole: jest.fn(),
      getAdminBookings: jest.fn(),
      getPropertiesByHost: jest.fn(),
      getBookingsByPropertyIds: jest.fn(),
      getProfilesByIds: jest.fn(),
      getPropertiesByIds: jest.fn(),
      getServicesByIds: jest.fn(),
      getBookingById: jest.fn(),
      unblockDatesForBooking: jest.fn(),
      updateBookingStatus: jest.fn(),
      getBookingForCancellation: jest.fn(),
      updatePayoutStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: BookingsRepository,
          useValue: mockRepository,
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
        service.createBooking({
          item_id: 'p999',
          user_id: 'u1',
          check_in: '2026-08-01',
          check_out: '2026-08-05',
          total_price: 500,
          guests: 2,
          item_type: 'property',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user tries to book own property', async () => {
      mockRepository.getProperty.mockResolvedValueOnce({
        id: 'p1',
        status: 'approved',
        host_id: 'u1',
        title: 'Villa',
      });

      await expect(
        service.createBooking({
          item_id: 'p1',
          user_id: 'u1',
          check_in: '2026-08-01',
          check_out: '2026-08-05',
          total_price: 500,
          guests: 2,
          item_type: 'property',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create booking via atomic RPC', async () => {
      mockRepository.getProperty.mockResolvedValueOnce({
        id: 'p1',
        status: 'approved',
        host_id: 'host1',
        title: 'Villa',
      });
      mockRepository.createBookingRpc.mockResolvedValueOnce('b-100');

      const result = await service.createBooking({
        item_id: 'p1',
        user_id: 'user2',
        check_in: '2026-08-01',
        check_out: '2026-08-03',
        total_price: 300,
        guests: 2,
        item_type: 'property',
      });

      expect(result).toBe('b-100');
      expect(mockRepository.createBookingRpc).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'p1',
          userId: 'user2',
          checkIn: '2026-08-01',
          checkOut: '2026-08-03',
          totalPrice: 300,
          guests: 2,
          itemType: 'property',
        }),
      );
    });
  });

  describe('updateBookingStatus', () => {
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.updateBookingStatus('b1', 'confirmed', undefined, 'other-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update status and unblock dates if cancelled', async () => {
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      const result = await service.updateBookingStatus(
        'b1',
        'cancelled',
        'Reason',
        'user1',
      );

      expect(mockRepository.unblockDatesForBooking).toHaveBeenCalledWith('b1');
      expect(mockRepository.updateBookingStatus).toHaveBeenCalledWith(
        'b1',
        'cancelled',
      );
      expect(result).toEqual({ success: true });
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      const confirmResult = await service.updateBookingStatus(
        'b-20',
        'confirmed',
        undefined,
        'host-123',
      );
      expect(confirmResult).toEqual({ success: true });
      expect(mockRepository.updateBookingStatus).toHaveBeenCalledWith(
        'b-20',
        'confirmed',
      );
    });

    it('Admin workflow: should allow admin to view all bookings and update payout status', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
      mockRepository.getAdminBookings.mockResolvedValueOnce([
        { id: 'b-100', status: 'pending', user: { full_name: 'Alice' } },
      ]);

      const adminBookings = await service.getAdminBookings(
        'pending',
        'admin-id',
      );
      expect(adminBookings).toHaveLength(1);
      expect(mockRepository.getAdminBookings).toHaveBeenCalledWith('pending');

      mockRepository.getUserRole.mockResolvedValueOnce('admin');
      const payoutResult = await service.updatePayoutStatus(
        'b-100',
        'completed',
        'admin-id',
      );
      expect(payoutResult).toEqual({ success: true });
      expect(mockRepository.updatePayoutStatus).toHaveBeenCalledWith(
        'b-100',
        'completed',
      );
    });
  });
});
