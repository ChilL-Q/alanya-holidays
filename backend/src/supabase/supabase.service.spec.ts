import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should initialize and return Supabase client instance', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    service = new SupabaseService();
    const client = service.getClient();

    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
    expect(typeof client.auth).toBe('object');
  });

  it('should log warning if credentials are missing', () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    service = new SupabaseService();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Supabase credentials not found'),
    );

    warnSpy.mockRestore();
  });
});
