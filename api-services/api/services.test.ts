import { describe, it, expect, vi, beforeEach } from 'vitest';
import { servicesService } from './services';
import { notificationsService } from './notifications';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
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
        createNotification: vi.fn()
    }
}));

describe('servicesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockChain = (data: any = null, error: any = null) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
      then: (resolve: any) => resolve({ data, count: error ? 0 : 1, error })
    };
    return chain;
  };

  describe('Core CRUD', () => {
    it('createService', async () => {
        const mockData = { id: 's1' };
        mockSupabase.from.mockReturnValue(createMockChain(mockData));

        const result = await servicesService.createService({ 
            title: 'Title', type: 'car', price: 10, provider_id: '550e8400-e29b-41d4-a716-446655440001', description: 'desc' 
        } as any);
        expect(result).toEqual(mockData);
    });

    it('updateService', async () => {
        const updateChain = createMockChain();
        const fetchChain = createMockChain({ provider_id: 'p1', title: 'T', type: 'car' });
        
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'services') {
                return {
                    ...updateChain,
                    ...fetchChain,
                    update: vi.fn().mockReturnValue(createMockChain()),
                    single: vi.fn().mockResolvedValue({ data: { provider_id: 'p1', title: 'T', type: 'car' }, error: null })
                } as any;
            }
            return createMockChain();
        });

        await servicesService.updateService('s1', { title: 'New' });
        expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('deleteService', async () => {
        const mockChain = createMockChain({ provider_id: 'p1', title: 'T', type: 'car' });
        mockSupabase.from.mockReturnValue(mockChain);

        await servicesService.deleteService('s1');
        expect(notificationsService.createNotification).toHaveBeenCalled();
        expect(mockChain.delete).toHaveBeenCalled();
    });

    it('getService (UUID)', async () => {
        const mockData = { id: 'uuid-1', service_ref: 100 };
        const chain = createMockChain(mockData);
        mockSupabase.from.mockReturnValue(chain);

        const result = await servicesService.getService('dffcc271-eac5-4ec8-bd24-63fea94f25ee');
        expect(chain.eq).toHaveBeenCalledWith('id', 'dffcc271-eac5-4ec8-bd24-63fea94f25ee');
        expect(result).toEqual(mockData);
    });

    it('getService (service_ref fallback)', async () => {
        // First query fails
        const failChain = createMockChain(null, new Error('Not found'));
        // Fallback query succeeds
        const fallbackChain = createMockChain({ id: 'uuid-1', service_ref: 123 });
        
        let callCount = 0;
        mockSupabase.from.mockImplementation(() => {
            callCount++;
            return callCount === 1 ? failChain : fallbackChain;
        });

        const result = await servicesService.getService('123');
        expect(fallbackChain.eq).toHaveBeenCalledWith('service_ref', 123);
        expect(result.id).toBe('uuid-1');
    });
  });

  describe('Lists & Filters', () => {
    it('getServices', async () => {
        const mockData = [{ id: '1', service_ref: 10 }];
        const chain = createMockChain(mockData);
        // We must override the `.range` to return the promise
        chain.range = vi.fn().mockResolvedValue({ data: mockData, count: 1, error: null });
        mockSupabase.from.mockReturnValue(chain);

        const result = await servicesService.getServices('car');
        expect(chain.eq).toHaveBeenCalledWith('type', 'car');
        expect(chain.eq).toHaveBeenCalledWith('status', 'approved');
        expect(result.data).toEqual(mockData);
    });

    it('getServicesByProvider', async () => {
        const mockData = [{ id: '1' }];
        mockSupabase.from.mockReturnValue(createMockChain(mockData));
        const result = await servicesService.getServicesByProvider('p1');
        expect(result).toEqual(mockData);
    });

    it('getAdminServices', async () => {
        const mockData = [{ id: '1' }];
        const chain = createMockChain(mockData);
        chain.range = vi.fn().mockResolvedValue({ data: mockData, count: 1, error: null });
        mockSupabase.from.mockReturnValue(chain);
        const result = await servicesService.getAdminServices('pending', ['car']);
        expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
        expect(chain.in).toHaveBeenCalledWith('type', ['car']);
        expect(result.data).toEqual(mockData);
    });
  });

  describe('Status Management', () => {
      it('updateServiceStatus - approved', async () => {
          const chain = createMockChain({ provider_id: 'p1', title: 'T', type: 'car' });
          mockSupabase.from.mockReturnValue(chain);

          await servicesService.updateServiceStatus('s1', 'approved');
          expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', expect.anything());
          expect(notificationsService.createNotification).toHaveBeenCalled();
      });

      it('approveService', async () => {
          const spy = vi.spyOn(servicesService, 'updateServiceStatus').mockResolvedValue(undefined);
          await servicesService.approveService('s1');
          expect(spy).toHaveBeenCalledWith('s1', 'approved');
          spy.mockRestore();
      });
  });

  describe('Service Models', () => {
      it('getServiceTypes', async () => {
          const types = await servicesService.getServiceTypes();
          expect(types).toContain('car');
      });

      it('getServiceBrands', async () => {
          mockSupabase.from.mockReturnValue(createMockChain([{ brand: 'BMW' }]));
          const brands = await servicesService.getServiceBrands('car');
          expect(brands).toEqual(['BMW']);
      });

      it('getServiceModels', async () => {
          const mockData = [{ id: '1', model: 'M3' }];
          mockSupabase.from.mockReturnValue(createMockChain(mockData));
          const models = await servicesService.getServiceModels('car', 'BMW');
          expect(models).toEqual(mockData);
      });

      it('getServiceModel', async () => {
          const mockData = { id: '1', model: 'M3' };
          mockSupabase.from.mockReturnValue(createMockChain(mockData));
          const model = await servicesService.getServiceModel('car', 'BMW', 'M3');
          expect(model).toEqual(mockData);
      });

      it('updateServiceModel', async () => {
          const chain = createMockChain();
          mockSupabase.from.mockReturnValue(chain);
          await servicesService.updateServiceModel('1', { brand: 'BMW' });
          expect(chain.update).toHaveBeenCalled();
      });

      it('getServicesByModel', async () => {
          const mockData = [{ id: '1' }];
          mockSupabase.from.mockReturnValue(createMockChain(mockData));
          const result = await servicesService.getServicesByModel('car', 'BMW', 'M3');
          expect(result).toEqual(mockData);
      });
  });

  describe('Service Edits Workflow', () => {
      it('requestServiceUpdate', async () => {
          const chain = createMockChain();
          mockSupabase.from.mockReturnValue(chain);
          await servicesService.requestServiceUpdate('s1', { title: 'N' });
          expect(chain.insert).toHaveBeenCalled();
      });

      it('getPendingServiceEdits', async () => {
          const mockData = [{ id: '1' }];
          mockSupabase.from.mockReturnValue(createMockChain(mockData));
          const result = await servicesService.getPendingServiceEdits();
          expect(result).toEqual(mockData);
      });

      it('getServiceEditsByService', async () => {
          const mockData = [{ id: '1' }];
          mockSupabase.from.mockReturnValue(createMockChain(mockData));
          const result = await servicesService.getServiceEditsByService('s1');
          expect(result).toEqual(mockData);
      });

      it('getMyPendingEdits', async () => {
          // First fetch user services
          const serviceChain = createMockChain([{ id: 's1' }]);
          serviceChain.then = (r: any) => r({ data: [{ id: 's1' }], error: null });

          // Then fetch edits
          const editChain = createMockChain([{ id: 'e1' }]);
          editChain.then = (r: any) => r({ data: [{ id: 'e1' }], error: null });

          let call = 0;
          mockSupabase.from.mockImplementation(() => {
              call++;
              return call === 1 ? serviceChain : editChain;
          });

          const result = await servicesService.getMyPendingEdits('u1');
          expect(result).toEqual([{ id: 'e1' }]);
      });

      it('getServiceEdit & deleteServiceEdit', async () => {
          const mockData = { id: 'e1' };
          const chain = createMockChain(mockData);
          mockSupabase.from.mockReturnValue(chain);

          const result = await servicesService.getServiceEdit('e1');
          expect(result).toEqual(mockData);

          await servicesService.deleteServiceEdit('e1');
          expect(chain.delete).toHaveBeenCalled();
      });

      it('approveServiceEdit', async () => {
          const mockEdit = { id: 'e1', service_id: 's1', changed_data: { title: 'N' } };
          const mockService = { provider_id: 'p1', title: 'T', type: 'car' };

          // Mock fetching edit, updating service, deleting edit, fetching service for notification
          mockSupabase.from.mockImplementation((table) => {
               if (table === 'service_edits') {
                   const chain = createMockChain(mockEdit) as any;
                   chain.delete = vi.fn().mockReturnThis();
                   chain.single = vi.fn().mockResolvedValue({ data: mockEdit, error: null });
                   return chain;
               }
               if (table === 'services') {
                   const chain = createMockChain(mockService) as any;
                   chain.update = vi.fn().mockReturnThis();
                   chain.single = vi.fn().mockResolvedValue({ data: mockService, error: null });
                   return chain;
               }
               return createMockChain();
          });

          await servicesService.approveServiceEdit('e1');
          expect(notificationsService.createNotification).toHaveBeenCalled();
      });

      it('rejectServiceEdit', async () => {
          const mockEdit = { id: 'e1', service_id: 's1' };
          const mockService = { provider_id: 'p1', title: 'T', type: 'car' };

          let editCalls = 0;
          mockSupabase.from.mockImplementation((table) => {
               if (table === 'service_edits') {
                   editCalls++;
                   const chain = createMockChain(mockEdit) as any;
                   chain.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
                   chain.single = vi.fn().mockResolvedValue({ data: mockEdit, error: null });
                   return chain;
               }
               if (table === 'services') {
                   return createMockChain(mockService);
               }
               return createMockChain();
          });

          await servicesService.rejectServiceEdit('e1', 'reason');
          expect(notificationsService.createNotification).toHaveBeenCalled();
      });
  });

  describe('Error Handling', () => {
      it('throws error in getServices', async () => {
          const chain = createMockChain();
          chain.range = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
          mockSupabase.from.mockReturnValue(chain);
          await expect(servicesService.getServices()).rejects.toThrow('DB Error');
      });

      it('throws error in createService', async () => {
          const chain = createMockChain();
          chain.single = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
          mockSupabase.from.mockReturnValue(chain);
          await expect(servicesService.createService({ title: 'TestTitle', type: 'car', price: 100, provider_id: '550e8400-e29b-41d4-a716-446655440001', description: 'desc' } as any)).rejects.toThrow('DB Error');
      });

      it('throws error in getService', async () => {
          const chain = createMockChain();
          // Simulate failure
          let callCount = 0;
          mockSupabase.from.mockImplementation(() => {
              callCount++;
              if (callCount === 1) return createMockChain(null, new Error('DB Error 1'));
              if (callCount === 2) return createMockChain(null, new Error('DB Error 2'));
          });
          
          await expect(servicesService.getService('123')).rejects.toThrow('DB Error 1');
      });

      it('returns null on getServiceModel error', async () => {
          const chain = createMockChain(null, new Error('Not found'));
          mockSupabase.from.mockReturnValue(chain);
          const result = await servicesService.getServiceModel('car', 'BMW', 'X5');
          expect(result).toBeNull();
      });
  });
});
