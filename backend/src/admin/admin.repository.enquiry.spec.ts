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
});
