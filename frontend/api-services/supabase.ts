
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../shared/types';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '');
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '');

const missing: string[] = [];
if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

if (missing.length > 0) {
    throw new Error(
        `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'These must be set for the Supabase client to initialize.',
    );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
