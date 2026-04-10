import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from './products';

vi.mock('../auth', () => ({
    getUserRole: vi.fn().mockResolvedValue('host'),
    isAdmin: vi.fn().mockResolvedValue(false),
}));

const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null })
            }
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
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null
            });
        });

        it('inserts product', async () => {
             const mockProduct = {
                 title: 'New Product',
                 description: 'A great product for testing',
                 price: 100,
                 stock: 10,
                 category: 'electronics',
                 images: ['https://example.com/img.jpg'],
             };
             const chain = createMockChain({ id: '1', ...mockProduct, seller_id: '550e8400-e29b-41d4-a716-446655440001' });
             mockSupabase.from.mockReturnValue(chain);

             const result = await productsService.createProduct(mockProduct as any);

             expect(mockSupabase.from).toHaveBeenCalledWith('products');
             expect(chain.insert).toHaveBeenCalledWith([expect.objectContaining({
                 title: 'New Product',
                 price: 100,
                 seller_id: '550e8400-e29b-41d4-a716-446655440001',
             })]);
             expect(result).toEqual({ id: '1', ...mockProduct, seller_id: '550e8400-e29b-41d4-a716-446655440001' });
        });

        it('throws on validation error', async () => {
             await expect(productsService.createProduct({} as any)).rejects.toThrow();
        });

        it('throws on db error', async () => {
             mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB Error')));
             await expect(productsService.createProduct({
                 title: 'New Product',
                 description: 'A great product for testing',
                 price: 100,
                 stock: 10,
                 category: 'electronics',
                 images: ['https://example.com/img.jpg'],
             } as any)).rejects.toThrow('DB Error');
        });
    });

    describe('updateProduct', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null
            });
        });

        it('updates product', async () => {
            const fetchChain = createMockChain({ seller_id: '550e8400-e29b-41d4-a716-446655440001' });
            const updateChain = createMockChain();
            mockSupabase.from.mockReturnValueOnce(fetchChain);
            mockSupabase.from.mockReturnValueOnce(updateChain);
            await productsService.updateProduct('1', { price: 200 });
            expect(updateChain.update).toHaveBeenCalledWith({ price: 200 });
            expect(updateChain.eq).toHaveBeenCalledWith('id', '1');
        });

        it('throws when not owner', async () => {
            mockSupabase.from.mockReturnValue(createMockChain({ seller_id: 'other-user' }));
            await expect(productsService.updateProduct('1', { price: 200 })).rejects.toThrow('Not authorized');
        });

        it('throws on db error', async () => {
            const deleteChain = createMockChain();
            deleteChain.eq = vi.fn().mockResolvedValue({ error: new Error('DB Error') });
            mockSupabase.from.mockReturnValueOnce(createMockChain({ seller_id: '550e8400-e29b-41d4-a716-446655440001' }));
            mockSupabase.from.mockReturnValueOnce(deleteChain);
            await expect(productsService.updateProduct('1', {})).rejects.toThrow('DB Error');
        });
    });

    describe('deleteProduct', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null
            });
        });

        it('deletes product', async () => {
            const fetchChain = createMockChain({ seller_id: '550e8400-e29b-41d4-a716-446655440001' });
            const deleteChain = createMockChain();
            mockSupabase.from.mockReturnValueOnce(fetchChain);
            mockSupabase.from.mockReturnValueOnce(deleteChain);
            await productsService.deleteProduct('1');
            expect(deleteChain.delete).toHaveBeenCalled();
            expect(deleteChain.eq).toHaveBeenCalledWith('id', '1');
        });

        it('throws when not owner', async () => {
            mockSupabase.from.mockReturnValue(createMockChain({ seller_id: 'other-user' }));
            await expect(productsService.deleteProduct('1')).rejects.toThrow('Not authorized');
        });

        it('throws on db error', async () => {
            const deleteChain = createMockChain();
            deleteChain.eq = vi.fn().mockResolvedValue({ error: new Error('DB Error') });
            mockSupabase.from.mockReturnValueOnce(createMockChain({ seller_id: '550e8400-e29b-41d4-a716-446655440001' }));
            mockSupabase.from.mockReturnValueOnce(deleteChain);
            await expect(productsService.deleteProduct('1')).rejects.toThrow('DB Error');
        });
    });
});
