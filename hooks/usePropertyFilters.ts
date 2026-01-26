import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { FilterState } from '../components/ui/PropertyFilters';

interface UsePropertyFiltersProps {
    checkIn: string | null;
    checkOut: string | null;
    location: string | null;
    guests: string | null;
}

export const usePropertyFilters = ({ checkIn, checkOut, location, guests }: UsePropertyFiltersProps) => {
    const [properties, setProperties] = useState<any[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState<FilterState>({
        priceRange: [0, 0], // 0 means "Any" for max price
        types: [],
        amenities: [],
        minGuests: 1,
        minBedrooms: 0,
        minBeds: 1,
        minBathrooms: 1,
        hasPhotos: false
    });

    // 1. Fetch Properties
    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                let rawData: any[] = [];

                // If dates are selected, use the availability filter
                if (checkIn && checkOut) {
                    rawData = await db.getAvailableProperties(checkIn, checkOut);
                } else {
                    // Otherwise fetch all standard properties
                    const { data } = await db.getProperties(1, 100);
                    rawData = data || [];
                }

                const formattedData = rawData.map((p: any) => ({
                    ...p,
                    pricePerNight: p.price_per_night,
                    image: p.images?.[0] || '', // Use first image or empty
                    guests: p.max_guests || 2, // Corrected from p.guests to p.max_guests
                    bedrooms: p.bedrooms || 1,
                    beds: p.beds || 1,
                    bathrooms: p.bathrooms || 1,
                    rating: p.rating || 0, // Will be updated by trigger if reviews exist
                    reviewsCount: p.reviews_count || 0,
                    images: p.images || []
                })) || [];
                setProperties(formattedData);
                // Initial filter will happen in next effect
            } catch (error) {
                console.error('Error fetching properties:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperties();
    }, [checkIn, checkOut]);

    // 2. Filter Properties
    useEffect(() => {
        if (!properties.length && !isLoading) {
            setFilteredProperties([]);
            return;
        }

        let filtered = [...properties];

        // 1. Text Search (Location/Title)
        if (location) {
            const lowerLocation = location.toLowerCase();
            filtered = filtered.filter(p =>
                p.location?.toLowerCase().includes(lowerLocation) ||
                p.title?.toLowerCase().includes(lowerLocation)
            );
        }

        // 2. Filter by Price
        filtered = filtered.filter(p => {
            const matchesMin = p.pricePerNight >= filters.priceRange[0];
            const matchesMax = filters.priceRange[1] === 0 || p.pricePerNight <= filters.priceRange[1];
            return matchesMin && matchesMax;
        });

        // 3. Filter by Type
        if (filters.types.length > 0) {
            filtered = filtered.filter(p =>
                filters.types.some(t => p.type?.toLowerCase().includes(t.toLowerCase()))
            );
        }

        // 4. Filter by Capacity (Guests, Bedrooms, Beds, Bathrooms)
        filtered = filtered.filter(p =>
            (p.guests || 0) >= filters.minGuests &&
            (p.bedrooms || 0) >= filters.minBedrooms &&
            (p.beds || 0) >= filters.minBeds &&
            (p.bathrooms || 0) >= filters.minBathrooms
        );

        // 5. Filter by Photos
        if (filters.hasPhotos) {
            filtered = filtered.filter(p => p.images && p.images.length > 0);
        }

        // 6. Filter by Amenities
        if (filters.amenities.length > 0) {
            filtered = filtered.filter(p => {
                // Determine property amenities list (handle both object array and string array if necessary)
                // Assuming p.amenities is Array<{label: string}> based on PropertyDB
                const propAmenities = p.amenities?.map((a: any) => a.label?.toLowerCase() || '') || [];

                // Check if property has ALL selected amenities
                return filters.amenities.every(filterAmenity =>
                    propAmenities.some((pa: string) => pa.includes(filterAmenity.toLowerCase()))
                );
            });
        }

        setFilteredProperties(filtered);
    }, [location, properties, filters, isLoading]);

    // 3. Calculate active filter count
    const activeFilterCount =
        filters.types.length +
        filters.amenities.length +
        (filters.priceRange[0] > 0 ? 1 : 0) +
        (filters.priceRange[1] > 0 ? 1 : 0) +
        (filters.minGuests > 1 ? 1 : 0) +
        (filters.minBedrooms > 0 ? 1 : 0) +
        (filters.minBeds > 1 ? 1 : 0) +
        (filters.minBathrooms > 1 ? 1 : 0) +
        (filters.hasPhotos ? 1 : 0);

    return {
        properties,
        filteredProperties,
        isLoading,
        filters,
        setFilters,
        activeFilterCount
    };
};
