import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@alanya-holidays/shared';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://placeholder.supabase.co';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      'placeholder-key';

    if (
      !process.env.VITE_SUPABASE_URL &&
      !process.env.SUPABASE_URL &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.VITE_SUPABASE_ANON_KEY
    ) {
      console.warn(
        'Supabase credentials not found. Booking functionality will fail.',
      );
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }
}
