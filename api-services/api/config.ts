import { supabase } from '../supabase';

/**
 * Fetches a property UUID override for a given slug.
 * This allows using friendly slugs in URLs while mapping them to actual property UUIDs.
 * 
 * @param slug - The property slug to look up
 * @returns The property UUID if found, otherwise null
 */
export async function getPropertyOverride(slug: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('property_overrides')
        .select('uuid')
        .eq('slug', slug)
        .maybeSingle();

    if (error) {
        console.error('Error fetching property override:', error);
        return null;
    }

    return data?.uuid || null;
}
