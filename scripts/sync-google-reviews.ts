import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const googleApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

if (!googleApiKey) {
  console.error('Missing VITE_GOOGLE_MAPS_API_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchGoogleRating(name: string, location: string): Promise<{ rating: number; count: number } | null> {
    try {
        // Use Text Search to find the place and its rating automatically
        const query = encodeURIComponent(`${name} ${location} Alanya Turkiye`);
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${googleApiKey}`;
        
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json() as any;
        
        if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
            const place = searchData.results[0];
            const rating = place.rating || 0;
            const count = place.user_ratings_total || 0;
            
            // We only return it if it actually has ratings, otherwise it might just be a rough map pin with no reviews
            if (count > 0) {
                return { rating, count };
            }
            return null;
        } else {
            console.log(`No Google Maps results found for ${name} (Status: ${searchData.status})`);
            return null;
        }
    } catch (e: any) {
        console.error(`Error fetching from Google for ${name}: ${e.message}`);
        return null;
    }
}

async function syncReviews() {
  console.log('Starting Google Maps reviews sync...');
  
  // 1. Fetch all currently stored directory listings
  const { data: listings, error } = await supabase
    .from('directory_listings')
    .select('id, name, location, reviews_average, reviews_count');

  if (error || !listings) {
    console.error('Error fetching listings from Supabase:', error);
    return;
  }

  console.log(`Found ${listings.length} listings to sync.`);

  let updatedCount = 0;

  // 2. Iterate and sync
  for (const listing of listings) {
    console.log(`Fetching Google data for: ${listing.name}...`);
    const googleData = await fetchGoogleRating(listing.name, listing.location);
    
    if (googleData) {
        // If the rating or review count has changed, update the DB
        if (googleData.rating !== listing.reviews_average || googleData.count !== listing.reviews_count) {
            console.log(`  -> Updating: Rating ${listing.reviews_average} => ${googleData.rating}, Count ${listing.reviews_count} => ${googleData.count}`);
            
            const { error: updateError } = await supabase
                .from('directory_listings')
                .update({ 
                    reviews_average: googleData.rating, 
                    reviews_count: googleData.count,
                    updated_at: new Date().toISOString()
                })
                .eq('id', listing.id);
                
            if (updateError) {
                console.error(`  -> Failed to update ${listing.name} in DB:`, updateError.message);
            } else {
                updatedCount++;
            }
        } else {
            console.log(`  -> ${listing.name} is already up to date.`);
        }
    }
    
    // Small delay to respect Google API rate limits (don't blast all requests instantly)
    await sleep(300);
  }
  
  console.log(`\nSync complete! Successfully updated ${updatedCount} listings.`);
}

syncReviews().catch(console.error);
