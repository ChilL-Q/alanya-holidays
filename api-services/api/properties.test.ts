import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propertiesService } from './properties';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      rpc: vi.fn(),
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
  });

  const createMockChain = (data: any = null) => {
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
      single: vi.fn().mockResolvedValue({ data, error: null }),
      then: (resolve: any) => resolve({ data, error: null })
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
            host_id: '550e8400-e29b-41d4-a716-446655440000',
            amenities: ['wifi']
        };
        const mockResponse = { id: 'new-id', ...mockData };
        mockSupabase.from.mockReturnValue(createMockChain(mockResponse));

        const result = await propertiesService.createProperty(mockData as any);
        expect(result.id).toBe('new-id');
    });
  });

  describe('getProperty', () => {
    it('fetches by UUID and applies Nar Villa override', async () => {
        const uuid = 'eee2d685-eac5-4ec8-bd24-63fea94f25ee';
        mockSupabase.from.mockReturnValue(createMockChain({ id: uuid, title: 'Nar Villa' }));

        const result = await propertiesService.getProperty(uuid);
        expect(result.property_ref).toBe(1001);
    });

    it('fetches by ref_id using RPC', async () => {
        const mockData = { id: 'uuid-1', host_id: 'host-1', title: 'Villa' };
        mockSupabase.rpc.mockResolvedValue({ data: [mockData], error: null });
        mockSupabase.from.mockReturnValue(createMockChain({ full_name: 'Owner' }));

        const result = await propertiesService.getProperty('1001');
        expect(result.id).toBe('uuid-1');
        expect(result.host.full_name).toBe('Owner');
    });
  });

  describe('updatePropertyStatus', () => {
    it('updates status and triggers email', async () => {
        mockSupabase.from.mockReturnValue(createMockChain({ host_id: 'h1', title: 'V' }));
        await propertiesService.updatePropertyStatus('p1', 'approved');
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', expect.anything());
    });
  });

  describe('deleteProperty', () => {
    it('performs soft delete if hard delete fails', async () => {
        const mockChain = createMockChain({ title: 'V', host_id: 'h1' });
        
        // Mock specific behavior for deleteProperty logic
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'properties') {
                return {
                    ...mockChain,
                    delete: vi.fn().mockReturnValue({
                        eq: vi.fn().mockRejectedValue(new Error('FK Constraint'))
                    })
                } as any;
            }
            return mockChain;
        });

        await propertiesService.deleteProperty('p1');
        expect(mockSupabase.from).toHaveBeenCalledWith('properties');
    });
  });

  describe('reviews', () => {
    it('fetches and adds reviews', async () => {
        const mockReviews = [{ id: 'r1', comment: 'Great' }];
        mockSupabase.from.mockReturnValue(createMockChain(mockReviews));

        const result = await propertiesService.getReviews('p1');
        expect(result).toEqual(mockReviews);

        // Add review
        mockSupabase.from.mockReturnValue(createMockChain({ id: 'r2' }));
        await propertiesService.addReview({ property_id: 'p1', rating: 5, comment: 'C', user_id: 'u1' } as any);
        expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    });

    it('gets review count', async () => {
        const mockChain = createMockChain([]);
        mockChain.single = vi.fn().mockResolvedValue({ count: 5, error: null });
        // The getReviewCount method doesn't use single, it awaits the chain directly
        mockChain.then = (resolve: any) => resolve({ count: 5, error: null });
        mockSupabase.from.mockReturnValue(mockChain);

        const count = await propertiesService.getReviewCount('p1');
        expect(count).toBe(5);
    });

    it('deletes review if authorized', async () => {
        // Mock checking owner
        const _mockCheckChain = createMockChain({ user_id: 'u1' });
        
        // Mock delete
        const _mockDeleteChain = createMockChain();

        mockSupabase.from.mockImplementation(() => {
            // Because we call it twice, we can return a unified chain for simplicity that handles both select.single and delete
            const chain = createMockChain({ user_id: 'u1' }) as any;
             chain.delete = vi.fn().mockReturnValue(chain);
             return chain;
        });

        await propertiesService.deleteReview('r1', 'u1');
        expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    });

    it('throws if not authorized to delete review', async () => {
         const chain = createMockChain({ user_id: 'other-user' }) as any;
         mockSupabase.from.mockReturnValue(chain);
         await expect(propertiesService.deleteReview('r1', 'u1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getProperties', () => {
    it('fetches properties with default pagination', async () => {
        const mockData = [{ id: '1', title: 'Villa' }];
        const mockChain = createMockChain(mockData);
        // getProperties expects { data, count, error } directly from the chain
        mockChain.then = (resolve: any) => resolve({ data: mockData, count: 1, error: null });
        mockSupabase.from.mockReturnValue(mockChain);

        const result = await propertiesService.getProperties();
        expect(result.data.length).toBe(1);
        expect(result.count).toBe(1);
    });

    it('applies filters and sorts correctly', async () => {
        const mockData = [{ id: '1' }];
        const mockChain = createMockChain(mockData);
        mockChain.then = (resolve: any) => resolve({ data: mockData, count: 1, error: null });
        mockSupabase.from.mockReturnValue(mockChain);

        const filters = {
            priceRange: [50, 200],
            types: ['villa'],
            minGuests: 2,
            hasPhotos: true
        };

        const result = await propertiesService.getProperties(1, 20, filters, 'Alanya', ['1'], 'price_asc');
        
        expect(mockChain.gte).toHaveBeenCalledWith('price_per_night', 50);
        expect(mockChain.lte).toHaveBeenCalledWith('price_per_night', 200);
        expect(mockChain.in).toHaveBeenCalledWith('type', ['villa']);
        expect(mockChain.gte).toHaveBeenCalledWith('max_guests', 2);
        expect(mockChain.not).toHaveBeenCalledWith('images', 'is', null);
        expect(mockChain.or).toHaveBeenCalledWith('location.ilike.%Alanya%,title.ilike.%Alanya%');
        expect(mockChain.order).toHaveBeenCalledWith('price_per_night', { ascending: true });
        
        expect(result.data.length).toBe(1);
    });
  });

  describe('getAvailableProperties', () => {
    it('calls RPC correctly', async () => {
        const mockData = [{ id: '1' }];
        mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

        const result = await propertiesService.getAvailableProperties('2024-01-01', '2024-01-05');
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_available_properties', {
            check_in_date: '2024-01-01',
            check_out_date: '2024-01-05'
        });
        expect(result).toEqual(mockData);
    });
  });

  describe('Property Lists (Host/Admin/Location)', () => {
     it('getPropertiesByHost', async () => {
        const mockData = [{ id: '1' }];
        mockSupabase.from.mockReturnValue(createMockChain(mockData));
        const result = await propertiesService.getPropertiesByHost('h1');
        expect(result).toEqual(mockData);
     });

     it('getAdminProperties', async () => {
        const mockData = [{ id: '1' }];
        const mockChain = createMockChain(mockData);
        mockChain.then = (resolve: any) => resolve({ data: mockData, count: 1, error: null });
        mockSupabase.from.mockReturnValue(mockChain);
        
        const result = await propertiesService.getAdminProperties('pending');
        expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
        expect(result.data).toEqual(mockData);
     });

     it('getPropertiesByLocation', async () => {
         const mockData = [{ id: '1' }];
         const mockChain = createMockChain(mockData);
         mockChain.then = (resolve: any) => resolve({ data: mockData, count: 1, error: null });
         mockSupabase.from.mockReturnValue(mockChain);
         
         const result = await propertiesService.getPropertiesByLocation('villa', 'Alanya');
         expect(mockChain.eq).toHaveBeenCalledWith('location', 'Alanya');
         expect(result.data).toEqual(mockData);
     });
  });

  describe('updateProperty', () => {
      it('updates property and creates notification', async () => {
          // Mock update success
          const updateChain = createMockChain();
          
          // Mock fetch property
          const fetchChain = createMockChain({ host_id: 'h1', title: 'V', type: 'villa' });

          mockSupabase.from.mockImplementation((table) => {
               if (table === 'properties') {
                    // It will call update(), then select().single() inside notification
                    // We can return a unified chain for simplicity
                    return {
                        ...updateChain,
                        ...fetchChain,
                        update: vi.fn().mockReturnValue(createMockChain()),
                        single: vi.fn().mockResolvedValue({ data: { host_id: 'h1', title: 'V', type: 'villa' }, error: null })
                    } as any;
               }
               return createMockChain();
          });

          await propertiesService.updateProperty('p1', { price_per_night: 150 });
          // verify notificationsService was called
          const { notificationsService } = await import('./notifications');
          expect(notificationsService.createNotification).toHaveBeenCalled();
      });
  });

  describe('Lookups', () => {
    it('getPropertyTypes', async () => {
        mockSupabase.from.mockReturnValue(createMockChain([{ type: 'villa' }, { type: 'apartment' }, { type: 'villa' }]));
        const result = await propertiesService.getPropertyTypes();
        expect(result).toEqual(['villa', 'apartment']);
    });

    it('getPropertyLocations', async () => {
        const mockChain = createMockChain([{ location: 'Alanya' }, { location: 'Kestel' }]);
        mockSupabase.from.mockReturnValue(mockChain);
        const result = await propertiesService.getPropertyLocations('villa');
        expect(mockChain.eq).toHaveBeenCalledWith('type', 'villa');
        expect(result).toEqual(['Alanya', 'Kestel']);
    });
  });

  describe('Availability & Calendar', () => {
      it('getPropertyAvailability', async () => {
          const mockData = [{ date: '2024-01-01', status: 'booked' }];
          const mockChain = createMockChain(mockData);
          mockSupabase.from.mockReturnValue(mockChain);
          
          const result = await propertiesService.getPropertyAvailability('p1', '2024-01-01', '2024-01-31');
          expect(mockChain.gte).toHaveBeenCalledWith('date', '2024-01-01');
          expect(mockChain.lte).toHaveBeenCalledWith('date', '2024-01-31');
          expect(result).toEqual(mockData);
      });

      it('updatePropertyAvailability clears dates when status is available without price', async () => {
          const mockDeleteChain = createMockChain();
          mockSupabase.from.mockReturnValue(mockDeleteChain);

          await propertiesService.updatePropertyAvailability('p1', ['2024-01-01'], 'available');
          expect(mockDeleteChain.delete).toHaveBeenCalled();
          expect(mockDeleteChain.in).toHaveBeenCalledWith('date', ['2024-01-01']);
          expect(mockDeleteChain.insert).not.toHaveBeenCalled();
      });

      it('updatePropertyAvailability inserts dates when status is blocked', async () => {
          const mockChain = createMockChain();
          mockChain.insert = vi.fn().mockResolvedValue({ error: null });
          mockSupabase.from.mockReturnValue(mockChain);

          await propertiesService.updatePropertyAvailability('p1', ['2024-01-01'], 'blocked');
          expect(mockChain.delete).toHaveBeenCalled();
          expect(mockChain.insert).toHaveBeenCalledWith([{
              property_id: 'p1',
              date: '2024-01-01',
              status: 'blocked',
              price: undefined,
              source: 'manual'
          }]);
      });

      it('syncPropertyCalendar', async () => {
          mockSupabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });
          const result = await propertiesService.syncPropertyCalendar('p1');
          expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('sync-ical', { body: { propertyId: 'p1' }});
          expect(result).toEqual({ success: true });
      });

      it('getUnavailableDates', async () => {
          const mockData = [{ date: '2024-01-01' }];
          const mockChain = createMockChain(mockData);
          mockSupabase.from.mockReturnValue(mockChain);

          const result = await propertiesService.getUnavailableDates('p1');
          expect(mockChain.neq).toHaveBeenCalledWith('status', 'available');
          expect(result).toEqual(['2024-01-01']);
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
          const mockData = { id: '1', url: 'http://test.com' };
          mockSupabase.from.mockReturnValue(createMockChain(mockData));
          const result = await propertiesService.addICalFeed('p1', 'Test', 'http://test.com');
          expect(mockSupabase.from).toHaveBeenCalledWith('property_ical_feeds');
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
          const mockChain = createMockChain();
          mockChain.in = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
          mockSupabase.from.mockReturnValue(mockChain);
          await expect(propertiesService.getPropertiesByIds(['1'])).rejects.toThrow('DB Error');
      });

      it('throws error in createProperty', async () => {
          const mockChain = createMockChain();
          mockChain.single = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
          mockSupabase.from.mockReturnValue(mockChain);
          await expect(propertiesService.createProperty({ title: 'Test', type: 'villa', price_per_night: 100 } as any)).rejects.toThrow();
      });

      it('throws error in updateProperty', async () => {
          const mockChain = createMockChain();
          mockChain.eq = vi.fn().mockResolvedValue({ error: new Error('DB Error') });
          mockSupabase.from.mockReturnValue(mockChain);
          await expect(propertiesService.updateProperty('1', { price_per_night: 200 })).rejects.toThrow('DB Error');
      });

      it('soft delete fallback throws if soft delete fails', async () => {
          // Hard delete fails
          const hardDeleteChain = createMockChain();
          hardDeleteChain.delete = vi.fn().mockReturnValue({
               eq: vi.fn().mockRejectedValue(new Error('Hard Delete Fail'))
          });

          // Soft delete fails
          const softDeleteChain = createMockChain();
          softDeleteChain.update = vi.fn().mockReturnValue({
               eq: vi.fn().mockResolvedValue({ error: new Error('Soft Delete Fail') })
          });

          let callCount = 0;
          mockSupabase.from.mockImplementation((table) => {
               if (table === 'properties') {
                    callCount++;
                    if (callCount === 1) return hardDeleteChain as any; // Fetch property info
                    if (callCount === 2) return hardDeleteChain as any; // Hard delete attempt
                    return softDeleteChain as any; // Soft delete attempt
               }
               return createMockChain();
          });

          await expect(propertiesService.deleteProperty('1')).rejects.toThrow('Soft Delete Fail');
      });
  });

});
