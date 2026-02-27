import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from './products';

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

    const createMockChain = (data: any = null, error: any = null) => {
        const chain: any = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data, error }),
            then: (resolve: any) => resolve({ data, error })
        };
        return chain;
    };

    describe('getProducts', () => {
        it('fetches products without category', async () => {
             const mockProducts = [{ id: '1', title: 'Product 1' }];
             const chain = createMockChain(mockProducts);
             chain.order = vi.fn().mockResolvedValue({ data: mockProducts, error: null });
             
             mockSupabase.from.mockReturnValue(chain);

             const result = await productsService.getProducts();

             expect(mockSupabase.from).toHaveBeenCalledWith('products');
             expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
             expect(result).toEqual(mockProducts);
        });

        it('fetches products with category filter', async () => {
             const mockProducts = [{ id: '1' }];
             const chain = createMockChain(mockProducts);
             chain.order = vi.fn().mockResolvedValue({ data: mockProducts, error: null });

             mockSupabase.from.mockReturnValue(chain);

             const result = await productsService.getProducts('electronics');

             expect(chain.eq).toHaveBeenCalledWith('category', 'electronics');
             expect(result).toEqual(mockProducts);
        });

        it('throws error when fetch fails', async () => {
             const chain = createMockChain(null, new Error('DB Error'));
             chain.order = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
             mockSupabase.from.mockReturnValue(chain);

             await expect(productsService.getProducts()).rejects.toThrow('DB Error');
        });
    });

    describe('getProduct', () => {
        it('fetches a single product', async () => {
            const mockProduct = { id: '1', title: 'P1' };
            const chain = createMockChain(mockProduct);
            mockSupabase.from.mockReturnValue(chain);

            const result = await productsService.getProduct('1');
            expect(chain.eq).toHaveBeenCalledWith('id', '1');
            expect(result).toEqual(mockProduct);
        });

        it('throws on db error', async () => {
            mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB Error')));
            await expect(productsService.getProduct('1')).rejects.toThrow('DB Error');
        });
    });

    describe('createProduct', () => {
        it('inserts product', async () => {
             const mockProduct = { title: 'New Product', price: 100 };
             const chain = createMockChain({ id: '1', ...mockProduct });
             mockSupabase.from.mockReturnValue(chain);
             
             const result = await productsService.createProduct(mockProduct as any);
             
             expect(mockSupabase.from).toHaveBeenCalledWith('products');
             expect(chain.insert).toHaveBeenCalledWith([mockProduct]);
             expect(result).toEqual({ id: '1', ...mockProduct });
        });

        it('throws on db error', async () => {
             mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB Error')));
             await expect(productsService.createProduct({} as any)).rejects.toThrow('DB Error');
        });
    });

    describe('updateProduct', () => {
        it('updates product', async () => {
            const chain = createMockChain();
            mockSupabase.from.mockReturnValue(chain);
            await productsService.updateProduct('1', { price: 200 });
            expect(chain.update).toHaveBeenCalledWith({ price: 200 });
            expect(chain.eq).toHaveBeenCalledWith('id', '1');
        });

        it('throws on db error', async () => {
            const chain = createMockChain();
            chain.eq = vi.fn().mockResolvedValue({ error: new Error('DB Error') });
            mockSupabase.from.mockReturnValue(chain);
            await expect(productsService.updateProduct('1', {})).rejects.toThrow('DB Error');
        });
    });

    describe('deleteProduct', () => {
        it('deletes product', async () => {
            const chain = createMockChain();
            mockSupabase.from.mockReturnValue(chain);
            await productsService.deleteProduct('1');
            expect(chain.delete).toHaveBeenCalled();
            expect(chain.eq).toHaveBeenCalledWith('id', '1');
        });

        it('throws on db error', async () => {
            const chain = createMockChain();
            chain.eq = vi.fn().mockResolvedValue({ error: new Error('DB Error') });
            mockSupabase.from.mockReturnValue(chain);
            await expect(productsService.deleteProduct('1')).rejects.toThrow('DB Error');
        });
    });
});
