
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../shared/types';

const defaultUrl = 'https://mdmizeyiyebvhkujjyjg.supabase.co';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || defaultUrl;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || '';

if (!supabaseAnonKey) {
    console.warn(
        'VITE_SUPABASE_ANON_KEY environment variable is missing from build environment.',
    );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

