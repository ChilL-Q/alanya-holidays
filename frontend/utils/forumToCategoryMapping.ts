/**
 * Maps forum category slugs to directory category IDs.
 * This enables showing related directory listings on forum threads.
 */

export function mapForumCategoryToDirectoryCategories(forumCategorySlug: string | null | undefined): string[] {
    if (!forumCategorySlug) return [];

    const slug = forumCategorySlug.toLowerCase();

    // Beaches & Nature category
    if (slug.startsWith('beaches-') || slug === 'beaches' || slug === 'nature') {
        return ['nature'];
    }

    // Food & Nightlife category
    if (slug.startsWith('food-')) {
        if (slug.includes('restaurant') || slug.includes('street')) {
            return ['restaurants'];
        }
        if (slug.includes('cafe') || slug.includes('breakfast')) {
            return ['cafes'];
        }
        if (slug.includes('bar') || slug.includes('nightlife') || slug.includes('alcohol')) {
            return ['nightlife'];
        }
        // Default for food: restaurants + cafes
        return ['restaurants', 'cafes'];
    }

    // Things to Do category
    if (slug.startsWith('things-')) {
        if (slug.includes('water') || slug.includes('jet') || slug.includes('dive') || slug.includes('ski')) {
            return ['tours', 'transport'];
        }
        if (slug.includes('boat') || slug.includes('tour')) {
            return ['tours'];
        }
        return ['tours'];
    }

    // Travel & Vacation Planning
    if (slug.startsWith('travel-')) {
        if (slug.includes('hotel') || slug.includes('accommodation') || slug.includes('stay')) {
            return ['accommodations', 'villas', 'apartments'];
        }
        if (slug.includes('flight') || slug.includes('airport') || slug.includes('transfer')) {
            return ['transport'];
        }
        if (slug.includes('itinerary') || slug.includes('budget') || slug.includes('first')) {
            // General travel: show diverse options
            return ['tours', 'restaurants', 'accommodations'];
        }
        // Default for travel
        return ['tours', 'restaurants', 'accommodations'];
    }

    // Expats & Digital Nomads
    if (slug.startsWith('expat') || slug.startsWith('expat-')) {
        if (slug.includes('cowork') || slug.includes('internet') || slug.includes('remote')) {
            return ['real-estate'];
        }
        if (slug.includes('healthcare')) {
            return ['medical'];
        }
        return ['real-estate', 'accommodations'];
    }

    // Real Estate & Investment
    if (slug.startsWith('realestate-') || slug === 'real-estate') {
        return ['real-estate'];
    }

    // Local Life & Culture
    if (slug.startsWith('culture-') || slug === 'culture') {
        // Cultural attractions and experiences: tours
        return ['tours', 'restaurants', 'cafes'];
    }

    // Events & Meetups
    if (slug.startsWith('events-') || slug === 'events') {
        return ['tours'];
    }

    // Default: no mapping
    return [];
}
