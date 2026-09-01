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
        const searchData: { status: string; results?: Array<{ place_id: string; name: string; rating?: number; user_ratings_total?: number }> } = await searchRes.json();
        
        if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
            const place = searchData.results[0];
            const rating = place.rating;
            const count = place.user_ratings_total;
            
            // We only return it if it actually has ratings, otherwise it might just be a rough map pin with no reviews
            if (
              typeof rating === 'number' &&
              Number.isFinite(rating) &&
              rating >= 0 &&
              rating <= 5 &&
              typeof count === 'number' &&
              Number.isInteger(count) &&
              count > 0
            ) {
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
    .select('id, name, location, google_rating, google_review_count');

  if (error || !listings) {
    console.error('Error fetching listings from Supabase:', error);
    process.exit(1);
  }

  console.log(`Found ${listings.length} listings to sync.`);

  let updatedCount = 0;

  // 2. Iterate and sync
  for (const listing of listings) {
    try {
      console.log(`Fetching Google data for: ${listing.name}...`);
      const googleData = await fetchGoogleRating(listing.name, listing.location);
      
      if (googleData) {
          // If the rating or review count has changed, update the DB
          if (googleData.rating !== listing.google_rating || googleData.count !== listing.google_review_count) {
              console.log(`  -> Updating Google data: Rating ${listing.google_rating} => ${googleData.rating}, Count ${listing.google_review_count} => ${googleData.count}`);
              
              const { error: updateError } = await supabase
                  .from('directory_listings')
                  .update({ 
                      google_rating: googleData.rating,
                      google_review_count: googleData.count,
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
    } catch (err: any) {
      console.error(`  -> Unhandled error processing ${listing.name}:`, err.message);
    }
    
    // Small delay to respect Google API rate limits (don't blast all requests instantly)
    await sleep(300);
  }
  
  console.log(`\nSync complete! Successfully updated ${updatedCount} listings.`);
}

syncReviews()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during sync:', err);
    process.exit(1);
  });
