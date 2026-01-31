import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from './products';

// Mock supabase client
const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
        }
    }
});

vi.mock('../supabase', () => ({
    supabase: mockSupabase
}));

describe('productsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProducts', () => {
        it('fetches visible products', async () => {
             const mockProducts = [{ id: 'prod-1', name: 'Product 1' }];
             const mockOrder = vi.fn().mockResolvedValue({ data: mockProducts, error: null });
             
             // Chain: from().select().[if category].order()
             // Actually select() happens first.
             // If no category, it chains select().order().
             
             // BUT, the implementation:
             // let query = supabase.from('products').select(...);
             // if (category) query = query.eq(...);
             // await query.order(...)
             
             const mockSelect = vi.fn().mockReturnThis();
             const mockEq = vi.fn().mockReturnThis();
             const mockOrderFn = vi.fn().mockResolvedValue({ data: mockProducts, error: null });
             
             // We need to return an object that has eq, order etc.
             const mockQueryBuilder = {
                 select: mockSelect,
                 eq: mockEq,
                 order: mockOrderFn,
                 then: (resolve: any) => resolve({ data: mockProducts, error: null }) // Make it thenable if needed, though await works on promise returned by order
             };
             
             // To support "await query.order()", order must return a Promise (or a Builder that is thenable).
             // In implementation: `await query.order(...)`. So order() returns the Result.
             
             mockSelect.mockReturnValue(mockQueryBuilder);
             mockEq.mockReturnValue(mockQueryBuilder); // If chained
             mockSupabase.from.mockReturnValue(mockQueryBuilder); // from returns builder

             const result = await productsService.getProducts();

             expect(mockSupabase.from).toHaveBeenCalledWith('products');
             // In default case, no eq is called for 'is_visible' based on code I saw?
             // Checking code: `supabase.from('products').select('*, artisan:profiles(full_name)')`.
             // `if (category) query = query.eq('category', category)`.
             // So no 'is_visible' filter by default in implementation I saw.
             
             expect(result).toEqual(mockProducts);
        });

        it('throws error when fetch fails', async () => {
             const mockSelect = vi.fn().mockReturnThis();
             const mockOrder = vi.fn().mockResolvedValue({ data: null, error: 'DB Error' });
             
             mockSupabase.from.mockReturnValue({
                 select: mockSelect,
                 order: mockOrder,
                 eq: vi.fn().mockReturnThis()
             });
             mockSelect.mockReturnValue({ order: mockOrder });

             await expect(productsService.getProducts()).rejects.toBe('DB Error');
        });
    });

    describe('createProduct', () => {
        it('inserts product', async () => {
             const mockProduct = { name: 'New Product', price: 100 };
             const mockSingle = vi.fn().mockResolvedValue({ data: { id: '1', ...mockProduct }, error: null });
             const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
             const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
             
             const mockQueryBuilder = {
                 insert: mockInsert
             };
             mockSupabase.from.mockReturnValue(mockQueryBuilder as any);
             
             const result = await productsService.createProduct(mockProduct as any);
             
             expect(mockSupabase.from).toHaveBeenCalledWith('products');
             expect(mockInsert).toHaveBeenCalledWith([mockProduct]);
             expect(result).toEqual(expect.objectContaining(mockProduct));
        });
    });
});
