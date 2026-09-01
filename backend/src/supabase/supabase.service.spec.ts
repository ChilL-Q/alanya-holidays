import { Logger } from '@nestjs/common';
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

  it('should initialize and return Supabase client instance with service role key', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    service = new SupabaseService();
    const client = service.getClient();

    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
    expect(typeof client.auth).toBe('object');
  });

  it('should throw an error in production if SUPABASE_URL is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});

    expect(() => new SupabaseService()).toThrow(
      'CRITICAL: Supabase credentials missing in production!',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Supabase credentials missing in production'),
    );

    errorSpy.mockRestore();
  });

  it('should throw an error in production if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_KEY;

    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});

    expect(() => new SupabaseService()).toThrow(
      'CRITICAL: Supabase credentials missing in production!',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Supabase credentials missing in production'),
    );

    errorSpy.mockRestore();
  });

  it('should log warning if credentials are missing in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_KEY;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});

    service = new SupabaseService();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Supabase credentials not found'),
    );

    warnSpy.mockRestore();
  });

  it('should log warning if falling back to anon key in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_KEY;
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';

    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});

    service = new SupabaseService();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'SUPABASE_SERVICE_ROLE_KEY not set; using anon key',
      ),
    );

    warnSpy.mockRestore();
  });
});
