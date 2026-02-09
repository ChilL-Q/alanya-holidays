
import 'dotenv/config';
import { propertiesService } from '../api-services/api/properties';
import { supabase } from '../api-services/supabase';

async function debugNarVillaAndPagination() {
    console.log('--- Debugging Nar Villa & Pagination ---');

    // 1. Check Nar Villa Status
    const { data: nar, error } = await supabase
        .from('properties')
        .select('id, title, status')
        .ilike('title', '%Nar Villa%');
    
    if (error) console.error('Error fetching Nar Villa:', error);
    else {
        console.log('Nar Villa Search Results:', nar);
    }

    // 2. Simulate Frontend Pagination Flow
    console.log('\n--- Simulating Frontend Pagination ---');
    const LIMIT = 12; // As in hook
    const filters = {
        priceRange: [0, 1000],
        types: [],
        amenities: [],
        minGuests: 1,
        minBedrooms: 0,
        minBeds: 1,
        minBathrooms: 1,
        hasPhotos: false
    };

    // Page 1
    const p1 = await propertiesService.getProperties(1, LIMIT, filters);
    console.log(`Page 1: ${p1.data.length} items. (IDs 0-2: ${p1.data.slice(0, 3).map(p => p.id)})`);

    // Page 2
    const p2 = await propertiesService.getProperties(2, LIMIT, filters);
    console.log(`Page 2: ${p2.data.length} items. (IDs 0-2: ${p2.data.slice(0, 3).map(p => p.id)})`);

    // Check overlap
    const p1Ids = new Set(p1.data.map(p => p.id));
    const duplicates = p2.data.filter(p => p1Ids.has(p.id));
    console.log(`Duplicates between P1 and P2: ${duplicates.length}`);
    if (duplicates.length > 0) {
        console.log('First duplicate:', duplicates[0].id, duplicates[0].title);
    }
}

debugNarVillaAndPagination();
