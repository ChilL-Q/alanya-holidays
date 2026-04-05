import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingsService } from './bookings';

// Mock the supabase client
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'mock-user-id', user_metadata: { role: 'admin' } } },
          error: null,
        }),
      },
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
    it('fetches and enriches bookings (with data)', async () => {
      const mockBookings = [
        { id: 'b1', item_id: 'p1', item_type: 'property', check_in: '2024-01-01' },
        { id: 'b2', item_id: 's1', item_type: 'service', check_in: '2024-01-02' }
      ];

      const createChain = (data: any = null) => {
        const chain: any = {
           select: vi.fn().mockReturnThis(),
           eq: vi.fn().mockReturnThis(),
           in: vi.fn().mockReturnThis(),
           order: vi.fn().mockReturnThis(),
           single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error: null }),
           then: vi.fn().mockImplementation((fn: any) => Promise.resolve({ data, error: null }).then(fn)),
        };
        // Make it a promise-like so await works
        chain.then = (onFullfilled: any) => Promise.resolve({ data, error: null }).then(onFullfilled);
        return chain;
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') return createChain(mockBookings);
        if (table === 'properties') return createChain([{ id: 'p1', title: 'Villa' }]);
        if (table === 'services') return createChain([{ id: 's1', title: 'Car' }]);
        return createChain();
      });

      const result = await bookingsService.getBookings('user-1');
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('property');
      expect(result[1]).toHaveProperty('service');
    });
  });

  describe('getAdminBookings', () => {
    it('fetches all bookings for admin', async () => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
        };
        mockSupabase.from.mockReturnValue(chain as any);

        const result = await bookingsService.getAdminBookings();
        expect(result).toEqual([]);
    });
  });

  describe('getBookingsForHost', () => {
    it('fetches bookings related to host properties', async () => {
        const mockProps = [{ id: 'p1', title: 'My Villa' }];
        const mockBookings = [{ id: 'b1', item_id: 'p1', item_type: 'property', user_id: 'g1' }];
        const mockProfiles = [{ id: 'g1', full_name: 'Guest' }];

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'properties') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: mockProps }) };
            if (table === 'bookings') {
                return { 
                    select: vi.fn().mockReturnThis(), 
                    in: vi.fn().mockReturnThis(), 
                    eq: vi.fn().mockReturnThis(), 
                    order: vi.fn().mockResolvedValue({ data: mockBookings, error: null }) 
                };
            }
            if (table === 'profiles') return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: mockProfiles }) };
            return { select: vi.fn().mockReturnThis() };
        });

        const result = await bookingsService.getBookingsForHost('host-1');
        expect(result.length).toBe(1);
        expect(result[0].itemTitle).toBe('My Villa');
        expect(result[0].user.full_name).toBe('Guest');
    });
  });

  describe('updateBookingStatus', () => {
    it('updates status and triggers notifications', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'b1', user_id: 'u1', property: { title: 'V' } }, error: null }),
            update: vi.fn().mockReturnThis(),
        };
        mockSupabase.from.mockReturnValue(mockChain as any);

        await bookingsService.updateBookingStatus('b1', 'confirmed');
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', expect.anything());
    });
  });

  describe('cancelBooking', () => {
    it('checks 48h policy and cancels', async () => {
        const recently = new Date().toISOString();
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'b1', created_at: recently, status: 'pending' }, error: null }),
            update: vi.fn().mockReturnThis(),
        };
        mockSupabase.from.mockReturnValue(mockChain as any);

        await bookingsService.cancelBooking('b1');
        expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
    });
  });
});
