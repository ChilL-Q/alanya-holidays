
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function updateCleopatra() {
    console.log('Updating Cleopatra Beachfront Suite...');

    // Update beds to 2 to match the bedroom count and likely user expectation
    const { error: err } = await supabase
        .from('properties')
        .update({ beds: 2 })
        .eq('title', 'Cleopatra Beachfront Suite');
    
    if (err) console.error('Error updating:', err);
    else console.log('Updated Cleopatra: beds = 2');
}

updateCleopatra();
