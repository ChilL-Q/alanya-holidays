
import 'dotenv/config';
import { propertiesService } from '../api-services/api/properties';
import { supabase } from '../api-services/supabase';

async function verifyPaginationAndFiltering() {
    console.log('Starting Pagination & Filtering Verification...');
    const LIMIT = 5;

    // 1. Basic Pagination Check
    console.log('\n--- Basic Pagination Check ---');
    const page1 = await propertiesService.getProperties(1, LIMIT);
    const page2 = await propertiesService.getProperties(2, LIMIT);
    const idsPage1 = page1.data.map(p => p.id);
    const idsPage2 = page2.data.map(p => p.id);
    
    // Check duplicates
    const duplicates = idsPage1.filter(id => idsPage2.includes(id));
    if (duplicates.length > 0) console.error('ERROR: Duplicates found:', duplicates);
    else console.log('SUCCESS: No duplicates between pages.');


    // 2. Filter by Type (Villa)
    console.log('\n--- Filter by Type: Villa ---');
    const villaFilters = { types: ['villa'] };
    // Assuming filters argument is the 3rd one
    const villas = await propertiesService.getProperties(1, 10, villaFilters);
    console.log(`Villas Found: ${villas.count}`);
    const nonVillas = villas.data.filter(p => p.type !== 'villa');
    if (nonVillas.length > 0) console.error('ERROR: Found non-villas:', nonVillas.map(p => p.type));
    else console.log('SUCCESS: All returned items are villas.');


    // 3. Filter by Price (Cheap)
    console.log('\n--- Filter by Price: < 100 ---');
    const priceFilters = { priceRange: [0, 100] };
    const cheapProps = await propertiesService.getProperties(1, 10, priceFilters);
    console.log(`Cheap Props Found: ${cheapProps.count}`);
    const expensive = cheapProps.data.filter(p => p.price_per_night > 100);
    if (expensive.length > 0) console.error('ERROR: Found expensive items:', expensive.map(p => p.price_per_night));
    else console.log('SUCCESS: All returned items are < 100.');


    // 4. Filter by Location (Mahmutlar)
    console.log('\n--- Filter by Location: Mahmutlar ---');
    // Location is 4th argument
    const mahmutlar = await propertiesService.getProperties(1, 10, undefined, 'Mahmutlar');
    console.log(`Mahmutlar Props Found: ${mahmutlar.count}`);
    // Check if location string match (loose check as data might vary)
    const wrongLoc = mahmutlar.data.filter(p => !p.location.includes('Mahmutlar') && !p.title.includes('Mahmutlar'));
    if (wrongLoc.length > 0) console.warn('WARNING: Possible location mismatch (check ilike logic):', wrongLoc.map(p => p.location));
    else console.log('SUCCESS: Location filter seems correct.');

    console.log('\nVerification Complete.');
}

verifyPaginationAndFiltering().catch(console.error);
