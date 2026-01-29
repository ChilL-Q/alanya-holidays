
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Use service role to skip RLS overhead for pure DB benchmark, or anon for realistic?
// Real client uses anon key + RLS. Admin uses service role.
// Let's test with Service Role to test pure DB speed, avoiding RLS policy overhead checks might be cheating but RLS is part of query.
// Let's use SERVICE ROLE for now to just check data retrieval speed.
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !KEY) {
    console.error('❌ Missing Env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, KEY);

async function benchmark() {
    console.log('🚀 Starting DB Benchmark (Backend Speed)...');

    // 1. Fetch All Properties
    const startProps = performance.now();
    const { data: props, error: errProps } = await supabase
        .from('properties')
        .select('id, title, price_per_night, location, images')
        .limit(1000);
    const endProps = performance.now();
    
    if (errProps) console.error(errProps);
    console.log(`\n🏠 Properties (Fetch 500+):`);
    console.log(`   Count: ${props?.length}`);
    console.log(`   Time: ${(endProps - startProps).toFixed(2)}ms`);

    // 2. Fetch All Bookings (Admin View)
    const startBookings = performance.now();
    const { data: bookings, error: errBookings } = await supabase
        .from('bookings')
        .select('*, property:properties(title)')
        .limit(5000);
    const endBookings = performance.now();

    if (errBookings) console.error(errBookings);
    console.log(`\n📅 Bookings (Fetch 2000+):`);
    console.log(`   Count: ${bookings?.length}`);
    console.log(`   Time: ${(endBookings - startBookings).toFixed(2)}ms`);

    // 3. Search Filter Simulation (Find Villas in Alanya)
    const startSearch = performance.now();
    const { data: search, error: errSearch } = await supabase
        .from('properties')
        .select('id')
        .eq('type', 'villa')
        .ilike('location', '%Alanya%');
    const endSearch = performance.now();

    if (errSearch) console.error(errSearch);
    console.log(`\n🔍 Search Query (Filter Villas in Alanya):`);
    console.log(`   Count: ${search?.length}`);
    console.log(`   Time: ${(endSearch - startSearch).toFixed(2)}ms`);

}

benchmark();
