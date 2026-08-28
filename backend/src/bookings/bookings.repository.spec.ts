import { Test, TestingModule } from '@nestjs/testing';
import { BookingsRepository } from './bookings.repository';
import { SupabaseService } from '../supabase/supabase.service';
import {
  EntityNotFoundException,
  InvalidStatusTransitionException,
  BookingConflictException,
  DatabaseException,
} from '../common/domain/exceptions';

describe('BookingsRepository - transitionStatus Atomic RPC', () => {
  let repository: BookingsRepository;
  let mockRpc: jest.Mock;
  let mockClient: { rpc: jest.Mock; from: jest.Mock };

  beforeEach(async () => {
    mockRpc = jest.fn();
    mockClient = {
      rpc: mockRpc,
      from: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsRepository,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockClient),
          },
        },
      ],
    }).compile();

    repository = module.get<BookingsRepository>(BookingsRepository);
  });

  it('ranges user bookings before enriching the selected rows', async () => {
    const range = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'b-21',
          user_id: 'user-1',
          item_id: 'property-1',
          item_type: 'property',
        },
      ],
      error: null,
    });
    const orderedQuery = { order: jest.fn(), range };
    orderedQuery.order.mockReturnValue(orderedQuery);
    const eq = jest.fn().mockReturnValue(orderedQuery);
    const bookingSelect = jest.fn().mockReturnValue({ eq });
    const propertyIn = jest.fn().mockResolvedValue({
      data: [{ id: 'property-1', title: 'Ranged villa' }],
    });
    const serviceIn = jest.fn().mockResolvedValue({ data: [] });
    const profileIn = jest.fn().mockResolvedValue({
      data: [{ id: 'user-1', full_name: 'Guest' }],
    });

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'bookings') return { select: bookingSelect };
      if (table === 'properties') {
        return { select: jest.fn().mockReturnValue({ in: propertyIn }) };
      }
      if (table === 'services') {
        return { select: jest.fn().mockReturnValue({ in: serviceIn }) };
      }
      return { select: jest.fn().mockReturnValue({ in: profileIn }) };
    });

    const result = await repository.getUserBookings('user-1', 10, 20);

    expect(orderedQuery.order.mock.calls).toEqual([
      ['check_in', { ascending: true }],
      ['id', { ascending: true }],
    ]);
    expect(range).toHaveBeenCalledWith(20, 29);
    expect(propertyIn).toHaveBeenCalledWith('id', ['property-1']);
    expect(result).toEqual([
      expect.objectContaining({
        id: 'b-21',
        itemTitle: 'Ranged villa',
        property: expect.objectContaining({ id: 'property-1' }),
      }),
    ]);
  });

  it('should successfully transition status and return structured result', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        code: 'TRANSITION_SUCCESS',
        data: {
          id: 'b-100',
          old_status: 'pending',
          new_status: 'confirmed',
          unblocked_dates_count: 0,
          item_id: 'prop-1',
          item_type: 'property',
          user_id: 'guest-1',
          check_in: '2026-08-01',
          check_out: '2026-08-05',
          total_price: 500,
        },
      },
      error: null,
    });

    const result = await repository.transitionStatus({
      bookingId: 'b-100',
      newStatus: 'confirmed',
      userId: 'host-1',
      reason: 'Approved by host',
    });

    expect(mockRpc).toHaveBeenCalledWith('transition_booking_status', {
      p_booking_id: 'b-100',
      p_new_status: 'confirmed',
      p_user_id: 'host-1',
      p_reason: 'Approved by host',
      p_payment_status: null,
    });

    expect(result).toEqual({
      id: 'b-100',
      oldStatus: 'pending',
      newStatus: 'confirmed',
      unblockedDatesCount: 0,
      itemId: 'prop-1',
      itemType: 'property',
      userId: 'guest-1',
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
      totalPrice: 500,
    });
  });

  it('should handle unblocking dates count on cancellation', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        code: 'TRANSITION_SUCCESS',
        data: {
          id: 'b-100',
          old_status: 'confirmed',
          new_status: 'cancelled',
          unblocked_dates_count: 4,
          item_id: 'prop-1',
          item_type: 'property',
          user_id: 'guest-1',
          check_in: '2026-08-01',
          check_out: '2026-08-05',
          total_price: 500,
        },
      },
      error: null,
    });

    const result = await repository.transitionStatus({
      bookingId: 'b-100',
      newStatus: 'cancelled',
      userId: 'guest-1',
    });

    expect(result.unblockedDatesCount).toBe(4);
    expect(result.newStatus).toBe('cancelled');
  });

  it('should throw EntityNotFoundException when RPC returns NOT_FOUND', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: false,
        code: 'NOT_FOUND',
        error: 'Booking not found',
      },
      error: null,
    });

    await expect(
      repository.transitionStatus({
        bookingId: 'b-999',
        newStatus: 'confirmed',
      }),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('should throw InvalidStatusTransitionException when RPC returns INVALID_STATUS_TRANSITION', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: false,
        code: 'INVALID_STATUS_TRANSITION',
        error: 'Invalid status transition from "cancelled" to "confirmed"',
      },
      error: null,
    });

    await expect(
      repository.transitionStatus({
        bookingId: 'b-100',
        newStatus: 'confirmed',
      }),
    ).rejects.toThrow(InvalidStatusTransitionException);
  });

  it('should throw BookingConflictException on generic unsuccessful transition response', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: false,
        code: 'CONFLICT',
        error: 'Concurrent lock acquisition failed',
      },
      error: null,
    });

    await expect(
      repository.transitionStatus({
        bookingId: 'b-100',
        newStatus: 'confirmed',
      }),
    ).rejects.toThrow(BookingConflictException);
  });

  it('should throw DatabaseException when Supabase RPC returns network/driver error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'connection refused to pg pool',
        code: '08006',
      },
    });

    await expect(
      repository.transitionStatus({
        bookingId: 'b-100',
        newStatus: 'confirmed',
      }),
    ).rejects.toThrow(DatabaseException);
  });

  describe('confirmBookingsFromStripe', () => {
    it('should return empty array if bookingIds is empty', async () => {
      const result = await repository.confirmBookingsFromStripe(
        [],
        'user-1',
        'cs_1',
      );
      expect(result).toEqual([]);
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should use confirm_bookings_from_stripe RPC fast-path and map joined details', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            id: 'b-1',
            status: 'confirmed',
            payment_status: 'paid',
            check_in: '2026-09-01',
            check_out: '2026-09-05',
            guests: 2,
            property_title: 'Sea Villa',
            service_title: null,
            guest_email: 'guest@example.com',
          },
        ],
        error: null,
      });

      const result = await repository.confirmBookingsFromStripe(
        ['b-1'],
        'user-1',
        'cs_1',
        'pi_1',
      );

      expect(mockRpc).toHaveBeenCalledWith('confirm_bookings_from_stripe', {
        p_booking_ids: ['b-1'],
        p_user_id: 'user-1',
        p_session_id: 'cs_1',
        p_payment_intent_id: 'pi_1',
      });

      expect(result).toEqual([
        {
          id: 'b-1',
          status: 'confirmed',
          payment_status: 'paid',
          check_in: '2026-09-01',
          check_out: '2026-09-05',
          guests: 2,
          property: { title: 'Sea Villa' },
          service: null,
          profile: { email: 'guest@example.com' },
        },
      ]);
    });

    it('should fallback to 3 RTT legacy flow when RPC fails or throws', async () => {
      mockRpc.mockRejectedValueOnce(new Error('RPC missing'));

      mockClient.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 'b-1' }],
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                      data: [{ id: 'b-1' }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: jest.fn().mockResolvedValue({ data: [] }) };
      });

      const result = await repository.confirmBookingsFromStripe(
        ['b-1'],
        'user-1',
        'cs_1',
      );

      expect(result).toEqual([{ id: 'b-1' }]);
    });
  });
});
