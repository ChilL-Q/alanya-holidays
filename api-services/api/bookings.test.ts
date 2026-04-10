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
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mock-user-id', user_metadata: { role: 'admin' } } },
      error: null,
    });
  });

  const createChain = (data: any = null, error: any = null) => {
    const chain: any = {
       select: vi.fn().mockReturnThis(),
       insert: vi.fn().mockReturnThis(),
       update: vi.fn().mockReturnThis(),
       delete: vi.fn().mockReturnThis(),
       eq: vi.fn().mockReturnThis(),
       in: vi.fn().mockReturnThis(),
       order: vi.fn().mockReturnThis(),
       single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
       maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
       then: (resolve: any) => resolve({ data, error })
    };
    return chain;
  };

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

    it('calls check_booking_conflict RPC before creating booking', async () => {
      const mockConflictResult = { data: { has_conflict: false, conflict_type: 'none', message: 'No conflicts found' }, error: null };
      const mockCreateResult = { data: { data: 'booking-id-789', error: null }, error: null };
      
      // Mock conflict check to return no conflicts
      mockSupabase.rpc.mockResolvedValueOnce(mockConflictResult);
      // Mock create_booking RPC
      mockSupabase.rpc.mockResolvedValueOnce(mockCreateResult);

      // Mock profile fetch for name and property fetch for owner
      mockSupabase.from.mockImplementation((table) => {
          if (table === 'profiles') return createChain({ full_name: 'Guest' });
          if (table === 'properties') return createChain({ host_id: 'h1', title: 'V' });
          return createChain();
      });

      const result = await bookingsService.createBooking(mockBookingData);

      // Verify conflict check was called first
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'check_booking_conflict', {
        p_item_id: '550e8400-e29b-41d4-a716-446655440001',
        p_item_type: 'property',
        p_check_in: '2024-01-01',
        p_check_out: '2024-01-05'
      });

      // Then create_booking was called
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'create_booking', {
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

    it('throws error if conflict check finds conflicts', async () => {
      const mockConflictResult = { 
        data: { 
          has_conflict: true, 
          conflict_type: 'dates_booked', 
          message: 'Dates are already booked by another reservation' 
        }, 
        error: null 
      };
      
      mockSupabase.rpc.mockResolvedValueOnce(mockConflictResult);

      await expect(bookingsService.createBooking(mockBookingData)).rejects.toThrow(
        'Dates are already booked by another reservation'
      );
      
      // Should not call create_booking after conflict
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });

    it('throws error if conflict check RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Conflict check failed' } 
      });

      await expect(bookingsService.createBooking(mockBookingData)).rejects.toThrow(
        'Failed to validate booking availability'
      );
    });

    it('calls create_booking RPC with correct params when no conflicts', async () => {
      const mockConflictResult = { data: { has_conflict: false, conflict_type: 'none', message: 'No conflicts found' }, error: null };
      const mockCreateResult = { data: { data: 'booking-id-789', error: null }, error: null };
      
      mockSupabase.rpc.mockResolvedValueOnce(mockConflictResult);
      mockSupabase.rpc.mockResolvedValueOnce(mockCreateResult);

      mockSupabase.from.mockImplementation((table) => {
          if (table === 'profiles') return createChain({ full_name: 'Guest' });
          if (table === 'properties') return createChain({ host_id: 'h1', title: 'V' });
          return createChain();
      });

      const result = await bookingsService.createBooking(mockBookingData);
      expect(result).toEqual({ id: 'booking-id-789' });
    });
  });

  describe('getBookings', () => {
    it('fetches and enriches bookings (with data)', async () => {
      const mockBookings = [
        { id: 'b1', item_id: 'p1', item_type: 'property', check_in: '2024-01-01' },
        { id: 'b2', item_id: 's1', item_type: 'service', check_in: '2024-01-02' }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return createChain({ role: 'admin' }); // getUserRole
        if (table === 'bookings') return createChain(mockBookings);
        if (table === 'properties') return createChain([{ id: 'p1', title: 'Villa' }]);
        if (table === 'services') return createChain([{ id: 's1', title: 'Car' }]);
        return createChain();
      });

      const result = await bookingsService.getBookings('mock-user-id');
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('property');
      expect(result[1]).toHaveProperty('service');
    });
  });

  describe('getAdminBookings', () => {
    it('fetches all bookings for admin', async () => {
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'profiles') return createChain({ role: 'admin' });
            return createChain([]);
        });

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
            if (table === 'profiles') {
                // Return array for the profiles query in getBookingsForHost
                // but single object for getUserRole if needed
                return createChain(mockProfiles);
            }
            if (table === 'properties') return createChain(mockProps);
            if (table === 'bookings') return createChain(mockBookings);
            return createChain();
        });

        // Mock getUserRole explicitly for this test by making the first call return admin/host
        mockSupabase.from
            .mockReturnValueOnce(createChain({ role: 'admin' })) // getUserRole
            .mockReturnValueOnce(createChain(mockProps))        // properties fetch
            .mockReturnValueOnce(createChain(mockBookings))     // bookings fetch
            .mockReturnValueOnce(createChain(mockProfiles));    // guest profiles fetch

        const result = await bookingsService.getBookingsForHost('mock-user-id');
        expect(result.length).toBe(1);
        expect(result[0].itemTitle).toBe('My Villa');
    });
  });

  describe('updateBookingStatus', () => {
    it('updates status and triggers notifications', async () => {
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'profiles') return createChain({ role: 'admin' });
            if (table === 'bookings') return createChain({ id: 'b1', user_id: 'u1', property: { title: 'V' } });
            return createChain();
        });

        await bookingsService.updateBookingStatus('b1', 'confirmed');
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', expect.anything());
    });
  });

  describe('cancelBooking', () => {
    it('checks 48h policy and cancels', async () => {
        const recently = new Date().toISOString();
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'profiles') return createChain({ role: 'admin' });
            if (table === 'bookings') return createChain({ id: 'b1', created_at: recently, status: 'pending' });
            return createChain();
        });

        await bookingsService.cancelBooking('b1');
        expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
    });
  });
});
