import { createClient } from '@supabase/supabase-js';
import { afterEach } from 'vitest';

// Клиент с service role для очистки данных между тестами
export const adminSupabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Очистка тестовых данных после каждого теста
afterEach(async () => {
    await adminSupabase.from('bookings').delete().eq('message', '__test__');
});