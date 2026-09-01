import { AdminRepository } from './admin.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

describe('AdminRepository enquiry persistence', () => {
  const failedInsert = (message: string) => {
    const builder = {
      insert: jest.fn(),
      select: jest.fn(),
      single: jest.fn(),
    };
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: null, error: { message } });
    return builder;
  };

  it('rejects when neither enquiry table can persist the request', async () => {
    const primary = failedInsert('concierge table unavailable');
    const fallback = failedInsert('messages table unavailable');
    const client = {
      from: jest
        .fn()
        .mockReturnValueOnce(primary)
        .mockReturnValueOnce(fallback),
    };
    const repository = new AdminRepository({
      getClient: () => client,
    } as unknown as SupabaseService);
    const dto: CreateEnquiryDto = {
      name: 'Launch Guest',
      email: 'guest@example.com',
      message: 'Villa availability request',
    };

    await expect(repository.submitEnquiry(dto)).rejects.toThrow(
      'messages table unavailable',
    );
    expect(client.from).toHaveBeenNthCalledWith(1, 'concierge_enquiries');
    expect(client.from).toHaveBeenNthCalledWith(2, 'messages');
  });

  it('selects only fields needed for the public recent-enquiry feed', async () => {
    const builder = {
      select: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
    };
    builder.select.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.limit.mockResolvedValue({
      data: [
        {
          subject: 'Personal Shopper Request — Gift Items',
          created_at: '2026-08-30T10:00:00.000Z',
        },
      ],
      error: null,
    });
    const client = { from: jest.fn().mockReturnValue(builder) };
    const repository = new AdminRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await repository.getRecentEnquiries(5);

    expect(builder.select).toHaveBeenCalledWith('subject, created_at');
  });

  it('uses the same safe projection for the legacy messages fallback', async () => {
    const primary = {
      select: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
    };
    primary.select.mockReturnValue(primary);
    primary.order.mockReturnValue(primary);
    primary.limit.mockResolvedValue({
      data: null,
      error: { message: 'table unavailable' },
    });

    const fallback = {
      select: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
    };
    fallback.select.mockReturnValue(fallback);
    fallback.order.mockReturnValue(fallback);
    fallback.limit.mockResolvedValue({ data: [], error: null });

    const client = {
      from: jest
        .fn()
        .mockReturnValueOnce(primary)
        .mockReturnValueOnce(fallback),
    };
    const repository = new AdminRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await repository.getRecentEnquiries(5);

    expect(primary.select).toHaveBeenCalledWith('subject, created_at');
    expect(fallback.select).toHaveBeenCalledWith('subject, created_at');
  });
});
