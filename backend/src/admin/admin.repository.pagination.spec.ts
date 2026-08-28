import { AdminRepository } from './admin.repository';
import { SupabaseService } from '../supabase/supabase.service';

describe('AdminRepository enquiry pagination', () => {
  const query = (result: object) => {
    const builder = {
      select: jest.fn(),
      order: jest.fn(),
      range: jest.fn(),
    };
    builder.select.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.range.mockResolvedValue(result);
    return builder;
  };

  it('applies the requested bounded range to the primary query', async () => {
    const primary = query({ data: [], error: null });
    const client = { from: jest.fn().mockReturnValue(primary) };
    const repository = new AdminRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await repository.getEnquiries(3, 25);

    expect(primary.range).toHaveBeenCalledWith(50, 74);
  });

  it('caps the fallback messages query at 100 rows', async () => {
    const primary = query({ data: null, error: { message: 'missing table' } });
    const fallback = query({ data: [], error: null });
    const client = {
      from: jest
        .fn()
        .mockReturnValueOnce(primary)
        .mockReturnValueOnce(fallback),
    };
    const repository = new AdminRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await repository.getEnquiries(2, 500);

    expect(primary.range).toHaveBeenCalledWith(100, 199);
    expect(fallback.range).toHaveBeenCalledWith(100, 199);
  });
});
