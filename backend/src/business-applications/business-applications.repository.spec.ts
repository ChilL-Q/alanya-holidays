import { SupabaseService } from '../supabase/supabase.service';
import { BusinessApplicationsRepository } from './business-applications.repository';

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  applicant_user_id: 'user-1',
  account_type: 'seller',
  business_name: 'Alanya Crafts',
  contact_email: 'owner@example.com',
  contact_phone: null,
  website: null,
  status: 'pending',
  rejection_reason: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const createBuilder = () => {
  const builder = {
    select: jest.fn(),
    insert: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  return builder;
};

describe('BusinessApplicationsRepository', () => {
  it('returns the deterministic latest application for the applicant', async () => {
    const builder = createBuilder();
    builder.maybeSingle.mockResolvedValue({ data: row, error: null });
    const client = { from: jest.fn().mockReturnValue(builder), rpc: jest.fn() };
    const repository = new BusinessApplicationsRepository({
      getClient: () => client,
    } as unknown as SupabaseService);

    await expect(repository.findMine('user-1')).resolves.toMatchObject({
      userId: 'user-1',
      businessName: 'Alanya Crafts',
    });
    expect(client.from).toHaveBeenCalledWith('business_account_applications');
    expect(builder.select).toHaveBeenCalledWith(
      'id,applicant_user_id,account_type,business_name,contact_email,contact_phone,website,status,rejection_reason,reviewed_by,reviewed_at,created_at,updated_at',
    );
    expect(builder.eq).toHaveBeenCalledWith('applicant_user_id', 'user-1');
    expect(builder.order).toHaveBeenNthCalledWith(1, 'created_at', {
      ascending: false,
    });
    expect(builder.order).toHaveBeenNthCalledWith(2, 'id', {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(1);
    expect(builder.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('builds persistence data only from server identity and allowed DTO fields', async () => {
    const builder = createBuilder();
    builder.single.mockResolvedValue({ data: row, error: null });
    const repository = new BusinessApplicationsRepository({
      getClient: () => ({ from: () => builder, rpc: jest.fn() }),
    } as unknown as SupabaseService);

    await repository.create('trusted-user', {
      accountType: 'seller',
      businessName: '  Alanya Crafts  ',
      contactEmail: '  owner@example.com  ',
      contactPhone: '  +90 555 000 0000  ',
      website: '  https://example.com  ',
    });

    expect(builder.insert).toHaveBeenCalledWith({
      applicant_user_id: 'trusted-user',
      account_type: 'seller',
      business_name: 'Alanya Crafts',
      contact_email: 'owner@example.com',
      contact_phone: '+90 555 000 0000',
      website: 'https://example.com',
      status: 'pending',
    });
  });

  it('filters the admin review queue to pending before count and pagination', async () => {
    const builder = createBuilder();
    builder.range.mockResolvedValue({ data: [row], error: null, count: 21 });
    const repository = new BusinessApplicationsRepository({
      getClient: () => ({ from: () => builder, rpc: jest.fn() }),
    } as unknown as SupabaseService);

    await expect(repository.findAll(2, 20)).resolves.toMatchObject({
      page: 2,
      limit: 20,
      total: 21,
      items: [{ id: row.id }],
    });
    expect(builder.select).toHaveBeenCalledWith(
      'id,applicant_user_id,account_type,business_name,contact_email,contact_phone,website,status,rejection_reason,reviewed_by,reviewed_at,created_at,updated_at',
      { count: 'exact' },
    );
    expect(builder.eq).toHaveBeenCalledWith('status', 'pending');
    expect(builder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(builder.range).toHaveBeenCalledWith(20, 39);
    expect(builder.eq.mock.invocationCallOrder[0]).toBeLessThan(
      builder.order.mock.invocationCallOrder[0],
    );
    expect(builder.order.mock.invocationCallOrder[0]).toBeLessThan(
      builder.range.mock.invocationCallOrder[0],
    );
  });

  it('calls the backend-only transition RPC with exact database parameters', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: row, error: null });
    const repository = new BusinessApplicationsRepository({
      getClient: () => ({ from: jest.fn(), rpc }),
    } as unknown as SupabaseService);

    await repository.approve(row.id, 'admin-1');
    await repository.reject(row.id, 'admin-1', 'Insufficient evidence');

    expect(rpc).toHaveBeenNthCalledWith(
      1,
      'transition_business_account_application',
      {
        p_application_id: row.id,
        p_status: 'approved',
        p_reviewed_by: 'admin-1',
        p_rejection_reason: null,
      },
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'transition_business_account_application',
      {
        p_application_id: row.id,
        p_status: 'rejected',
        p_reviewed_by: 'admin-1',
        p_rejection_reason: 'Insufficient evidence',
      },
    );
  });

  it('surfaces RPC errors instead of returning false success', async () => {
    const repository = new BusinessApplicationsRepository({
      getClient: () => ({
        from: jest.fn(),
        rpc: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'P0001', message: 'not pending' },
        }),
      }),
    } as unknown as SupabaseService);

    await expect(repository.approve(row.id, 'admin-1')).rejects.toMatchObject({
      code: 'P0001',
      message: 'not pending',
    });
  });
});
