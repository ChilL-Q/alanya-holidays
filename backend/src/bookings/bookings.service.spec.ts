import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOverlappingBookings: jest.fn().mockResolvedValue([]),
      checkPropertyAvailabilityBlocks: jest.fn().mockResolvedValue([]),
      getProperty: jest.fn(),
      getService: jest.fn(),
      insertBooking: jest.fn(),
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

    it('should create booking and upsert availability blocks for property', async () => {
      mockRepository.getProperty.mockResolvedValueOnce({
        id: 'p1',
        status: 'approved',
        host_id: 'host1',
        title: 'Villa',
      });
      mockRepository.insertBooking.mockResolvedValueOnce({ id: 'b-100' });

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
      expect(mockRepository.upsertPropertyAvailability).toHaveBeenCalled();
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
        status: 'pending',
        check_in: '2026-08-01',
        check_out: '2026-08-05',
        property: { host_id: 'host1', title: 'Villa' },
      });
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      const result = await service.updateBookingStatus(
        'b1',
        'cancelled',
        'Reason',
        'user1',
      );

      expect(result).toEqual({ success: true });
      expect(mockRepository.unblockDatesForBooking).toHaveBeenCalledWith('b1');
      expect(mockRepository.updateBookingStatus).toHaveBeenCalledWith(
        'b1',
        'cancelled',
      );
    });
  });
});
