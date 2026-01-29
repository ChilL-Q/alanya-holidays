
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function forceDelete() {
    console.log('Finding Cleopatra...');
    // Use exact ID from previous steps
    const prop = { id: '5d02c67b-ef4e-4b08-bac5-085ab5b9788f' };
    const propErr = null;

    if (propErr || !prop) {
        console.error('Property not found:', propErr);
        return;
    }

    console.log('Property ID:', prop.id);

    // 1. Try to fetch reviews to see if we can see them (proving read access)
    const { data: reviews, error: revErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', prop.id);
    
    console.log('Reviews visible:', reviews?.length, 'Error:', revErr?.message);

    // 2. Try to Delete Reviews
    console.log('Attempting DELETE reviews...');
    const { count, error: delErr } = await supabase
        .from('reviews')
        .delete({ count: 'exact' })
        .eq('property_id', prop.id);

    if (delErr) {
        console.error('DELETE Failed:', delErr);
    } else {
        console.log('Deleted count:', count);
    }

    // 3. Try to Update Reviews (set property_id = null)
    if (delErr || count === 0) {
        console.log('Attempting UPDATE reviews (nullify)...');
        const { count: upCount, error: upErr } = await supabase
            .from('reviews')
            .update({ property_id: null })
            .eq('property_id', prop.id)
            .select('*', { count: 'exact' });

        if (upErr) {
            console.error('UPDATE Failed:', upErr);
        } else {
            console.log('Updated count:', upCount);
        }
    }
}

forceDelete();
