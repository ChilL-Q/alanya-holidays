import { ProductsRepository } from './products.repository';
import { SupabaseService } from '../supabase/supabase.service';

describe('ProductsRepository pagination', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';

  const builder = (terminal: Record<string, unknown>) => {
    const query: Record<string, jest.Mock> = {};
    for (const method of ['select', 'eq', 'order']) {
      query[method] = jest.fn().mockReturnValue(query);
    }
    query.range = jest.fn().mockResolvedValue(terminal);
    query.in = jest.fn().mockResolvedValue(terminal);
    return query;
  };

  it('applies the requested inclusive ranges to products and variants', async () => {
    const products = builder({ data: [], error: null });
    const variants = builder({ data: [], error: null });
    const client = {
      from: jest.fn((table: string) =>
        table === 'products' ? products : variants,
      ),
    };
    const repository = new ProductsRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await repository.getProducts('food', 3, 10);
    await repository.getProductVariants(uuid, 2, 25);

    expect(products.order.mock.calls).toEqual([
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
    expect(variants.order.mock.calls).toEqual([
      ['created_at', { ascending: true }],
      ['id', { ascending: true }],
    ]);
    expect(products.range).toHaveBeenCalledWith(20, 29);
    expect(variants.range).toHaveBeenCalledWith(25, 49);
  });

  it('returns a counted searchable admin page beyond the first 20 products', async () => {
    const products = builder({
      data: [{ id: 21, name: 'Copper Lamp' }],
      error: null,
      count: 21,
    });
    products.or = jest.fn().mockReturnValue(products);
    const client = { from: jest.fn().mockReturnValue(products) };
    const repository = new ProductsRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await expect(
      repository.getProductsAdmin(7, 2, 20, 'copper'),
    ).resolves.toEqual({
      items: [{ id: 21, name: 'Copper Lamp' }],
      page: 2,
      limit: 20,
      total: 21,
    });
    expect(products.or).toHaveBeenCalledWith(
      'name.ilike.%copper%,description.ilike.%copper%',
    );
    expect(products.eq).toHaveBeenCalledWith('category_id', 7);
    expect(client.from).toHaveBeenCalledWith('product_items');
    expect(products.range).toHaveBeenCalledWith(20, 39);
  });

  it('performs admin catalog create, update, get, and delete against product_items', async () => {
    const query: Record<string, jest.Mock> = {};
    for (const method of ['insert', 'update', 'delete', 'select', 'eq']) {
      query[method] = jest.fn().mockReturnValue(query);
    }
    query.single = jest.fn().mockResolvedValue({
      data: { id: 31, name: 'Lamp' },
      error: null,
    });
    query.maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 31, name: 'Lamp' },
      error: null,
    });
    const client = { from: jest.fn().mockReturnValue(query) };
    const repository = new ProductsRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await repository.createCatalogItemAdmin({ name: 'Lamp', status: 'active' });
    await repository.getCatalogItemAdmin(31);
    await repository.updateCatalogItemAdmin(31, { stock: 8 });
    await repository.deleteCatalogItemAdmin(31);

    expect(client.from).toHaveBeenCalledTimes(4);
    expect(client.from).toHaveBeenNthCalledWith(1, 'product_items');
    expect(client.from).toHaveBeenNthCalledWith(2, 'product_items');
    expect(client.from).toHaveBeenNthCalledWith(3, 'product_items');
    expect(client.from).toHaveBeenNthCalledWith(4, 'product_items');
    expect(query.insert).toHaveBeenCalledWith({
      name: 'Lamp',
      status: 'active',
    });
    expect(query.update).toHaveBeenCalledWith({ stock: 8 });
    expect(query.delete).toHaveBeenCalledTimes(1);
  });

  it('pages catalog products before restricting variants to current page IDs', async () => {
    const products = builder({
      data: [{ id: 21 }, { id: 22 }],
      error: null,
    });
    const categories = builder({ data: [], error: null });
    categories.order.mockResolvedValue({ data: [], error: null });
    const variants = builder({
      data: [{ product_id: 21 }, { product_id: 21 }],
      error: null,
    });
    const client = {
      from: jest.fn((table: string) => {
        if (table === 'product_items') return products;
        if (table === 'product_categories') return categories;
        return variants;
      }),
    };
    const repository = new ProductsRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    const result = await repository.getShopCatalog({ page: 3, limit: 10 });

    expect(products.order.mock.calls).toEqual([
      ['created_at', { ascending: true }],
      ['id', { ascending: true }],
    ]);
    expect(products.range).toHaveBeenCalledWith(20, 29);
    expect(variants.in).toHaveBeenCalledWith('product_id', [21, 22]);
    expect(result.products).toEqual([
      { id: 21, variant_count: 2 },
      { id: 22, variant_count: undefined },
    ]);
  });
});
