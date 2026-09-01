import { UserRolesRepository } from './user-roles.repository';
import { SupabaseService } from '../../supabase/supabase.service';

describe('UserRolesRepository Adversarial Challenge', () => {
  const VALID_UUID_1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const VALID_UUID_2 = 'b1ffcd88-8b0a-4de7-aa5c-5aa8ac270b22';
  const VALID_UUID_UPPER = 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11';

  let mockSupabaseClient: any;
  let mockSupabaseService: SupabaseService;
  let userRolesRepo: UserRolesRepository;

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn(),
    };
    mockSupabaseService = {
      getClient: () => mockSupabaseClient,
    } as unknown as SupabaseService;

    userRolesRepo = new UserRolesRepository(mockSupabaseService);
  });

  describe('1. Malformed UUIDs & Input Resilience', () => {
    const malformedInputs = [
      '',
      '   ',
      'not-a-uuid',
      '12345',
      "'; DROP TABLE profiles; --",
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1', // 35 chars
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a111', // 37 chars
      'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // non-hex 'g'
      'a0eebc99_9c0b_4ef8_bb6d_6bb9bd380a11', // underscores
      ' a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 ', // leading/trailing spaces
      'null',
      'undefined',
      '{}',
      '<script>alert(1)</script>',
      '00000000-0000-0000-0000-000000000000\n',
    ];

    test.each(malformedInputs)(
      'should immediately reject malformed input "%s" without calling DB',
      async (invalidInput) => {
        const role = await userRolesRepo.getRole(invalidInput);
        expect(role).toBeUndefined();
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      },
    );

    it('should correctly accept valid uppercase UUIDs', async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(query);

      const role = await userRolesRepo.getRole(VALID_UUID_UPPER);
      expect(role).toBe('admin');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(query.eq).toHaveBeenCalledWith('id', VALID_UUID_UPPER);
    });
  });

  describe('2. Network Timeouts, DB Outages & PostgREST Error Codes', () => {
    it('should return undefined when network throws AbortError / TimeoutError', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Connection timed out (ETIMEDOUT)');
      });

      const role = await userRolesRepo.getRole(VALID_UUID_1);
      expect(role).toBeUndefined();
    });

    it('should return undefined when single() promise rejects with network failure', async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockRejectedValue(new Error('Network socket disconnected')),
      };
      mockSupabaseClient.from.mockReturnValue(query);

      const role = await userRolesRepo.getRole(VALID_UUID_1);
      expect(role).toBeUndefined();
    });

    it('should handle PGRST116 (No rows found) cleanly', async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'The result contains 0 rows' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(query);

      const role = await userRolesRepo.getRole(VALID_UUID_1);
      expect(role).toBeUndefined();
    });

    it('should handle 22P02 (Postgres invalid text representation) cleanly', async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: '22P02',
            message: 'invalid input syntax for type uuid',
          },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(query);

      const role = await userRolesRepo.getRole(VALID_UUID_1);
      expect(role).toBeUndefined();
    });

    it('should handle statement timeout 57014 without throwing', async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: '57014',
            message: 'canceling statement due to statement timeout',
          },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(query);

      const role = await userRolesRepo.getRole(VALID_UUID_1);
      expect(role).toBeUndefined();
    });

    it('should handle profile with null or empty role property', async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: null },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(query);

      const role = await userRolesRepo.getRole(VALID_UUID_1);
      expect(role).toBeUndefined();
    });
  });

  describe('3. Concurrency & High Load Stress Testing', () => {
    it('should handle 100 concurrent role lookups under mixed outcomes without state corruption', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table !== 'profiles') throw new Error('Wrong table');
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockImplementation((_col: string, val: string) => {
            return {
              single: jest.fn().mockImplementation(() => {
                if (val === VALID_UUID_1)
                  return Promise.resolve({
                    data: { role: 'admin' },
                    error: null,
                  });
                if (val === VALID_UUID_2)
                  return Promise.resolve({
                    data: { role: 'user' },
                    error: null,
                  });
                if (val === '00000000-0000-0000-0000-000000000000')
                  return Promise.resolve({
                    data: null,
                    error: { code: 'PGRST116' },
                  });
                return Promise.reject(new Error('Timeout error'));
              }),
            };
          }),
        };
      });

      const promises: Promise<string | undefined>[] = [];
      const expectedResults: (string | undefined)[] = [];

      for (let i = 0; i < 100; i++) {
        const mod = i % 5;
        if (mod === 0) {
          promises.push(userRolesRepo.getRole(VALID_UUID_1));
          expectedResults.push('admin');
        } else if (mod === 1) {
          promises.push(userRolesRepo.getRole(VALID_UUID_2));
          expectedResults.push('user');
        } else if (mod === 2) {
          promises.push(
            userRolesRepo.getRole('00000000-0000-0000-0000-000000000000'),
          );
          expectedResults.push(undefined);
        } else if (mod === 3) {
          promises.push(userRolesRepo.getRole('malformed-uuid-' + i));
          expectedResults.push(undefined);
        } else {
          promises.push(
            userRolesRepo.getRole('ffffffff-ffff-ffff-ffff-ffffffffffff'),
          );
          expectedResults.push(undefined);
        }
      }

      const results = await Promise.all(promises);
      expect(results).toEqual(expectedResults);
    });
  });
});
