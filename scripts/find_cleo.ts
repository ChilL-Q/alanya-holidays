
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function runSql() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Please provide a SQL file');
        process.exit(1);
    }
    
    // Note: We can't actually run raw SQL with supabase-js unless we have a specific function or use the REST API filters carefully.
    // For this debugging purpose, we'll try to map the intention (fetch property by title) to valid JS code.
    // If we wanted to run RAW sql we'd need admin rights or a different driver.
    // Instead, I'll write a specific script to find this property.
    
    console.log('Searching for property via Supabase JS...');
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('title', 'Cleopatra Beachfront Suite');

    if (error) console.error('Error:', error);
    else console.log('Found properties:', JSON.stringify(data, null, 2));
}

runSql();
