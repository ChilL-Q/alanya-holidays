import { createClient } from '@supabase/supabase-js';
import { MOCK_DIRECTORY_DATA } from '../data/directoryData';
import * as dotenv from 'dotenv';
import { DirectoryListingDB } from '../types/models';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDirectory() {
  console.log('Starting seed directory script...');
  
  // Optionally check if table exists or has data
  const { data: existing, error: countError } = await supabase
    .from('directory_listings')
    .select('id')
    .limit(1);
    
  if (countError) {
      console.error('Error checking directory_listings table:', countError);
      // It might be an RLS issue or table does not exist.
  } else if (existing && existing.length > 0) {
      console.log('Data already exists in directory_listings. Exiting to avoid duplicate seeds.');
      // return;
  }
  
  // Since we might need RLS bypass, we can use service_role key if available, but let's try anon key first.
  // Actually, anon key might fail if RLS is enabled for INSERTS on directory_listings.
  // If we can't seed, we'll see the error and deal with it.

  const mappedData = MOCK_DIRECTORY_DATA.map(item => ({
    category_id: item.categoryId,
    name: item.name,
    short_description: item.shortDescription,
    is_featured: item.isFeatured || false,
    is_verified: item.isVerified || false,
    website: item.website || null,
    whatsapp: item.whatsapp || null,
    gallery: item.gallery || [],
    reviews_average: item.reviews?.average || 0,
    reviews_count: item.reviews?.count || 0,
    languages_spoken: item.languagesSpoken || null,
    certifications: item.certifications || null,
    location: item.location,
    google_map_url: item.googleMapUrl || null,
    price_level: item.priceLevel || null
  }));

  for (const item of mappedData) {
    const { data, error } = await supabase
        .from('directory_listings')
        .insert(item);
        
    if (error) {
        console.error('Failed to insert item:', item.name, error.message);
    } else {
        console.log(`Inserted ${item.name}`);
    }
  }
  
  console.log('Done seeding directory data.');
}

seedDirectory().catch(console.error);
