import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@alanya-holidays/shared';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient<Database>;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseKey = serviceRoleKey || anonKey;

    if (isProduction) {
      if (!supabaseUrl || !serviceRoleKey) {
        const errorMsg =
          'CRITICAL: Supabase credentials missing in production! Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.';
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    } else {
      if (!supabaseUrl || !supabaseKey) {
        this.logger.warn(
          'Supabase credentials not found or incomplete. Falling back to placeholder client for local/test mode.',
        );
      } else if (!serviceRoleKey && anonKey) {
        this.logger.warn(
          'SUPABASE_SERVICE_ROLE_KEY not set; using anon key. Admin Supabase operations may fail.',
        );
      }
    }

    this.supabase = createClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key',
      {
        auth: { persistSession: false },
      },
    );
  }

  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }
}
