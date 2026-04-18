import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propertiesService } from './properties';
import { notificationsService } from './notifications';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null })
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    }
  }
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('./notifications', () => ({
  notificationsService: {
    createNotification: vi.fn(),
  }
}));

describe('propertiesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null
    });
    // Default mock implementation
    mockSupabase.from.mockImplementation(() => createMockChain());
  });

  const createMockChain = (data: any = null, error: any = null) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      then: (resolve: any) => resolve({ data, count: error ? 0 : (Array.isArray(data) ? data.length : 1), error })
    };
    return chain;
  };

  describe('getPropertiesByIds', () => {
    it('fetches properties correctly', async () => {
        const mockData = [{ id: '1', title: 'Villa' }];
        mockSupabase.from.mockReturnValue(createMockChain(mockData));
        const result = await propertiesService.getPropertiesByIds(['1']);
        expect(result).toEqual(mockData);
    });
  });

  describe('createProperty', () => {
    it('successfully creates a property with valid data', async () => {
        const mockData = { 
            title: 'New Villa', 
            type: 'villa', 
            price_per_night: 100, 
            max_guests: 4, 
            bedrooms: 2, 
            bathrooms: 1, 
            beds: 2, 
            location: 'Alanya Center', 
            lat: 36.5, lng: 32.0, 
            description: 'Beautiful villa',
            images: ['img1.jpg'],
            host_id: '550e8400-e29b-41d4-a716-446655440001',
            amenities: ['wifi']
        };
        const mockResponse = { id: 'new-id', ...mockData };
        mockSupabase.from.mockReturnValue(createMockChain(mockResponse));

        const result = await propertiesService.createProperty(mockData as any);
        expect(result.id).toBe('new-id');
    });
  });

  describe('getProperty', () => {
    it('fetches property by UUID', async () => {
        const uuid = 'eee2d685-eac5-4ec8-bd24-63fea94f25ee';
        mockSupabase.from.mockReturnValue(createMockChain({ id: uuid, title: 'Nar Villa', ref_id: 1 }));

        const result = await propertiesService.getProperty(uuid);
        expect(result.id).toBe(uuid);
        expect(result.title).toBe('Nar Villa');
    });

    it('fetches by ref_id using RPC', async () => {
        mockSupabase.rpc.mockResolvedValueOnce({ data: [{ id: 'uuid-1', title: 'Ref Villa', host_id: 'h1' }], error: null });
        mockSupabase.from.mockReturnValue(createMockChain({ full_name: 'Owner' }));

        const result = await propertiesService.getProperty('1001');
        expect(result.id).toBe('uuid-1');
        expect(result.host.full_name).toBe('Owner');
    });
  });

  describe('updatePropertyStatus', () => {
    it('updates status and triggers email', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ 
          data: { user: { id: 'admin-user' } }, error: null 
        });

        mockSupabase.from.mockImplementation((table) => {
            if (table === 'profiles') return createMockChain({ role: 'admin' });
            return createMockChain({ host_id: 'h1', title: 'V' });
        });
        await propertiesService.updatePropertyStatus('p1', 'approved');
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', expect.anything());
    });

    it('throws when not admin', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: { id: 'h1' } }, error: null
        });
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'profiles') return createMockChain({ role: 'host' });
            return createMockChain({ host_id: 'h1', title: 'V' });
        });
        await expect(propertiesService.updatePropertyStatus('p1', 'approved')).rejects.toThrow('only admins can change property status');
    });
  });

  describe('deleteProperty', () => {
    it('performs soft delete if hard delete fails', async () => {
        const fetchChain = createMockChain({ host_id: '550e8400-e29b-41d4-a716-446655440001', title: 'V' });
        const updateChain = createMockChain();

        let propCallCount = 0;
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'properties') {
                propCallCount++;
                if (propCallCount === 1) return fetchChain;
                if (propCallCount === 2) return createMockChain(null, { message: 'Hard Delete Fail' });
                return updateChain;
            }
            return createMockChain();
        });

        await propertiesService.deleteProperty('p1');
        expect(updateChain.update).toHaveBeenCalled();
    });

    it('rejects non-owner non-admin', async () => {
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'properties') return createChain({ host_id: 'h2', title: 'V' });
            if (table === 'profiles') return createChain({ role: 'host' });
            return createMockChain();
        });

        // Use inline createChain helper for consistency
        const createChain = (data: any) => createMockChain(data);

        await expect(propertiesService.deleteProperty('p1')).rejects.toThrow('Not authorized');
    });

    it('allows admin to delete property', async () => {
        const fetchChain = createMockChain({ host_id: 'h2', title: 'V' });
        const profileChain = createMockChain({ role: 'admin' });
        const deleteChain = createMockChain();

        mockSupabase.from.mockImplementation((table) => {
            if (table === 'properties') return fetchChain;
            if (table === 'profiles') return profileChain;
            return deleteChain;
        });

        await propertiesService.deleteProperty('p1');
        expect(deleteChain.delete).toHaveBeenCalled();
    });
  });

  describe('Reviews', () => {
      it('fetches and adds reviews', async () => {
          const reviewData = [{ id: 'r1', rating: 5 }];
          const reviewsChain = createMockChain(reviewData);
          reviewsChain.range = vi.fn().mockResolvedValue({ data: reviewData, count: 1, error: null });
          mockSupabase.from.mockReturnValueOnce(reviewsChain);
          const reviews = await propertiesService.getReviews('p1');
          expect(reviews.data).toHaveLength(1);

          const noExistingChain = createMockChain(null);
          const bookingChain = createMockChain(null);
          bookingChain.then = (resolve: any) => resolve({ data: null, count: 1, error: null });
          const insertChain = createMockChain({ id: 'r2' });
          const propChain = createMockChain({ host_id: 'h1', title: 'T' });
          mockSupabase.from
              .mockReturnValueOnce(noExistingChain)
              .mockReturnValueOnce(bookingChain)
              .mockReturnValueOnce(insertChain)
              .mockReturnValueOnce(propChain);
          await propertiesService.addReview({
              property_id: '550e8400-e29b-41d4-a716-446655440001',
              rating: 5,
              comment: 'Great stay at this property'
          });
          expect(insertChain.insert).toHaveBeenCalled();
      });

      it('gets review count', async () => {
          const chain = createMockChain();
          chain.then = (resolve: any) => resolve({ data: null, count: 5, error: null });
          mockSupabase.from.mockReturnValue(chain);
          const count = await propertiesService.getReviewCount('p1');
          expect(count).toBe(5);
      });

      it('deletes review if authorized', async () => {
          const mockChain = createMockChain({ user_id: '550e8400-e29b-41d4-a716-446655440001' });
          mockSupabase.from.mockReturnValue(mockChain);
          await propertiesService.deleteReview('r1');
          expect(mockChain.delete).toHaveBeenCalled();
      });

      it('throws if not authorized to delete review', async () => {
          const mockChain = createMockChain({ user_id: 'other-user' });
          mockSupabase.from.mockReturnValue(mockChain);
          await expect(propertiesService.deleteReview('r1')).rejects.toThrow('You can only delete your own reviews');
      });

      it('throws delete review if unauthenticated', async () => {
          mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
          await expect(propertiesService.deleteReview('r1')).rejects.toThrow('Not authenticated');
      });
  });

  describe('Catalog', () => {
      it('fetches properties with default pagination', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([]));
          await propertiesService.getProperties();
          expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      });

      it('applies filters and sorts correctly', async () => {
          const mockChain = createMockChain([]);
          mockSupabase.from.mockReturnValue(mockChain);
          await propertiesService.getProperties(1, 10, { priceRange: [100, 200], types: ['Villa'] }, 'Alanya', [], 'price_asc');
          expect(mockChain.gte).toHaveBeenCalledWith('price_per_night', 100);
          expect(mockChain.lte).toHaveBeenCalledWith('price_per_night', 200);
          expect(mockChain.in).toHaveBeenCalledWith('type', ['villa']);
          expect(mockChain.order).toHaveBeenCalledWith('price_per_night', { ascending: true });
      });

      it('calls RPC correctly', async () => {
          mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });
          await propertiesService.getAvailableProperties('2024-01-01', '2024-01-05');
          expect(mockSupabase.rpc).toHaveBeenCalledWith('get_available_properties', expect.anything());
      });

      it('getPropertiesByHost', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([]));
          await propertiesService.getPropertiesByHost('h1');
          expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      });

      it('getAdminProperties', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([]));
          await propertiesService.getAdminProperties('pending');
          expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      });

      it('getPropertiesByLocation', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([]));
          await propertiesService.getPropertiesByLocation('villa', 'Alanya');
          expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      });

      it('updates property and creates notification', async () => {
          const fetchChain = createMockChain({ host_id: '550e8400-e29b-41d4-a716-446655440001', title: 'V', type: 'villa' });
          const updateChain = createMockChain();

          let propCallCount = 0;
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'properties') {
                  propCallCount++;
                  return propCallCount === 1 ? fetchChain : updateChain;
              }
              return createMockChain();
          });

          await propertiesService.updateProperty('p1', { title: 'New' });
          expect(updateChain.update).toHaveBeenCalledWith({ title: 'New' });
          expect(notificationsService.createNotification).toHaveBeenCalled();
      });

      it('throws when not owner', async () => {
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'properties') return createMockChain({ host_id: 'other', title: 'V' });
              if (table === 'profiles') return createMockChain({ role: 'host' });
              return createMockChain();
          });
          await expect(propertiesService.updateProperty('p1', { title: 'New' })).rejects.toThrow('Not authorized');
      });

      it('getPropertyTypes', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([{ type: 'villa' }]));
          const result = await propertiesService.getPropertyTypes();
          expect(result).toContain('villa');
      });

      it('getPropertyLocations', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([{ location: 'Alanya Center' }]));
          const result = await propertiesService.getPropertyLocations('villa');
          expect(result).toContain('Alanya Center');
      });
  });

  describe('Availability', () => {
      it('getPropertyAvailability', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([]));
          await propertiesService.getPropertyAvailability('p1', '2024-01-01', '2024-01-05');
          expect(mockSupabase.from).toHaveBeenCalledWith('property_availability');
      });

      it('updatePropertyAvailability clears dates when status is available without price', async () => {
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'properties') return createMockChain({ host_id: '550e8400-e29b-41d4-a716-446655440001' });
              if (table === 'profiles') return createMockChain({ role: 'host' });
              return createMockChain();
          });

          await propertiesService.updatePropertyAvailability('p1', ['2024-01-01'], 'available');
          expect(mockSupabase.from).toHaveBeenCalledWith('property_availability');
      });

      it('updatePropertyAvailability inserts dates when status is blocked', async () => {
          const chain = createMockChain();
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'properties') return createMockChain({ host_id: '550e8400-e29b-41d4-a716-446655440001' });
              if (table === 'profiles') return createMockChain({ role: 'host' });
              if (table === 'property_availability') return chain;
              return createMockChain();
          });

          await propertiesService.updatePropertyAvailability('p1', ['2024-01-01'], 'blocked');
          expect(chain.insert).toHaveBeenCalled();
      });

      it('syncPropertyCalendar', async () => {
          mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { synced: 1 }, error: null });
          await propertiesService.syncPropertyCalendar('p1');
          expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('sync-ical', expect.any(Object));
      });

      it('getUnavailableDates', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([{ date: '2024-01-01' }]));
          const dates = await propertiesService.getUnavailableDates('p1');
          expect(dates).toContain('2024-01-01');
      });
  });

  describe('ICal Feeds', () => {
      it('getICalFeeds', async () => {
          const mockData = [{ id: '1', url: 'http://test.com' }];
          mockSupabase.from.mockReturnValue(createMockChain(mockData));
          const result = await propertiesService.getICalFeeds('p1');
          expect(result).toEqual(mockData);
      });

      it('addICalFeed', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'h1' } }, error: null });
          const mockData = { id: '1', url: 'http://test.com' };
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'properties') return createMockChain({ host_id: 'h1' });
              if (table === 'profiles') return createMockChain({ role: 'host' });
              if (table === 'property_ical_feeds') return createMockChain(mockData);
              return createMockChain();
          });
          const result = await propertiesService.addICalFeed('p1', 'Test', 'http://test.com');
          expect(result).toEqual(mockData);
      });

      it('removeICalFeed', async () => {
          const mockChain = createMockChain();
          mockSupabase.from.mockReturnValue(mockChain);
          await propertiesService.removeICalFeed('f1');
          expect(mockChain.delete).toHaveBeenCalled();
      });
  });

  describe('Error Handling', () => {
      it('throws error in getPropertiesByIds', async () => {
          mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB Error')));
          await expect(propertiesService.getPropertiesByIds(['1'])).rejects.toThrow('DB Error');
      });

      it('throws error in createProperty', async () => {
          mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB Error')));
          await expect(propertiesService.createProperty({} as any)).rejects.toThrow();
      });

      it('throws error in updateProperty', async () => {
          let propCallCount = 0;
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'properties') {
                  propCallCount++;
                  if (propCallCount === 1) return createMockChain({ host_id: '550e8400-e29b-41d4-a716-446655440001' });
                  return createMockChain(null, new Error('DB Error'));
              }
              return createMockChain({ role: 'host' });
          });
          await expect(propertiesService.updateProperty('p1', {})).rejects.toThrow('DB Error');
      });

      it('soft delete fallback throws if soft delete fails', async () => {
          let propCallCount = 0;
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'properties') {
                  propCallCount++;
                  if (propCallCount === 1) return createMockChain({ host_id: '550e8400-e29b-41d4-a716-446655440001', title: 'V' });
                  return createMockChain(null, new Error('Hard Fail'));
              }
              return createMockChain();
          });

          await expect(propertiesService.deleteProperty('p1')).rejects.toThrow();
      });
  });
});
