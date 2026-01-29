import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingsService } from './bookings';

// Mock the supabase client
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
  };
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

describe('bookingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    const mockBookingData = {
        item_id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        check_in: '2024-01-01',
        check_out: '2024-01-05',
        total_price: 500,
        guests: 2,
        message: 'Hello',
        payment_method: 'card',
        type: 'property'
    };

    it('calls create_booking RPC with correct params', async () => {

      const mockResponse = { data: 'booking-id-789', error: null };
      mockSupabase.rpc.mockResolvedValue({ data: mockResponse, error: null });

      // Mock property fetch for notification
      const mockSingle = vi.fn().mockResolvedValue({ data: { host_id: 'host-123', title: 'Villa' }, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await bookingsService.createBooking(mockBookingData);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_booking', {
        p_item_id: '550e8400-e29b-41d4-a716-446655440001',
        p_user_id: '550e8400-e29b-41d4-a716-446655440000',
        p_check_in: '2024-01-01',
        p_check_out: '2024-01-05',
        p_total_price: 500,
        p_guests: 2,
        p_message: 'Hello',
        p_payment_method: 'card',
        p_item_type: 'property'
      });
      expect(result).toEqual({ id: 'booking-id-789' });
    });

    it('throws error if RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC Error' } });
      await expect(bookingsService.createBooking(mockBookingData)).rejects.toEqual({ message: 'RPC Error' });
    });
  });

  describe('getBookings', () => {
    it('fetches and enriches bookings (empty case)', async () => {
      // Mock chain: from().select().eq().order()
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const result = await bookingsService.getBookings('user-1');
      expect(result).toEqual([]);
    });
  });
});
