
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function updateProperties() {
    console.log('Updating properties (beds/guests only)...');

    // 1. Nar Villa
    const { error: err1 } = await supabase
        .from('properties')
        .update({ beds: 7, max_guests: 10 })
        .eq('id', 'eee2d685-eac5-4ec8-bd24-63fea94f25ee'); // Nar Villa
    
    if (err1) console.error('Error updating Nar Villa:', err1);
    else console.log('Updated Nar Villa (7 beds, 10 guests)');

    // 2. Castle View Penthouse (Find ID first)
    const { data: castle, error: castleErr } = await supabase
        .from('properties')
        .select('id')
        .eq('title', 'Castle View Penthouse')
        .single();

    if (castleErr) console.error('Castle View not found:', castleErr);
    else if (castle) {
        const { error: err2 } = await supabase
            .from('properties')
            .update({ beds: 7, max_guests: 6 })
            .eq('id', castle.id);

        if (err2) console.error('Error updating Castle View:', err2);
        else console.log('Updated Castle View (7 beds, 6 guests)');
    }
}

updateProperties();
