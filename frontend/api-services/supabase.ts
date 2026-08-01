
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../shared/types';

const defaultUrl = 'https://mdmizeyjabyvhkuijyjg.supabase.co';
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || defaultUrl;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || '';

if (!import.meta.env?.VITE_SUPABASE_ANON_KEY && (typeof process === 'undefined' || !process.env?.VITE_SUPABASE_ANON_KEY)) {
    console.warn(
        'VITE_SUPABASE_ANON_KEY environment variable is not defined. ' +
        'Supabase client initialized with fallback.',
    );
}


export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey || 'placeholder-anon-key');

