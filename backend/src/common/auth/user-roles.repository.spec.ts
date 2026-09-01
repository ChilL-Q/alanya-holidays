import { Test, TestingModule } from '@nestjs/testing';
import { UserRolesRepository } from './user-roles.repository';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * Adversarial tests for the centralised role lookup (audit 1.2).
 * Role resolution must be a single shared repository (previously duplicated
 * in 9+ feature repositories) with safe failure handling.
 */
describe('UserRolesRepository', () => {
  let repository: UserRolesRepository;
  let mockSupabaseClient: {
    from: jest.Mock;
  };

  const UUID = '12345678-1234-1234-1234-123456789abc';

  const makeQuery = (data: unknown, error: unknown) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  });

  beforeEach(async () => {
    mockSupabaseClient = { from: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesRepository,
        {
          provide: SupabaseService,
          useValue: { getClient: () => mockSupabaseClient },
        },
      ],
    }).compile();

    repository = module.get<UserRolesRepository>(UserRolesRepository);
  });

  it('should return the profile role for a valid user id', async () => {
    const query = makeQuery({ role: 'admin' }, null);
    mockSupabaseClient.from.mockReturnValueOnce(query);

    const role = await repository.getRole(UUID);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    expect(query.eq).toHaveBeenCalledWith('id', UUID);
    expect(role).toBe('admin');
  });

  it('should return undefined for an invalid UUID without hitting the DB', async () => {
    const role = await repository.getRole("'; DROP TABLE profiles; --");

    expect(role).toBeUndefined();
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should return undefined when the profile does not exist (PGRST116)', async () => {
    const query = makeQuery(null, { code: 'PGRST116', message: 'no rows' });
    mockSupabaseClient.from.mockReturnValueOnce(query);

    const role = await repository.getRole(UUID);

    expect(role).toBeUndefined();
  });
});
