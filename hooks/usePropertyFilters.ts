import { useState, useMemo, useEffect } from 'react';
import { Property, PropertyDB } from '../types/models';
import { propertiesService } from '../services/api/properties';

export interface FilterState {
    priceRange: [number, number];
    types: string[];
    amenities: string[];
    minGuests: number;
    minBedrooms: number;
    minBeds: number;
    minBathrooms: number;
    hasPhotos: boolean;
}

interface UsePropertyFiltersProps {
    checkIn: string | null;
    checkOut: string | null;
    location: string | null;
    guests: string | null;
}

export const usePropertyFilters = ({ checkIn, checkOut, location, guests }: UsePropertyFiltersProps) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState('recommended');
    const LIMIT = 12;

    const [filters, setFilters] = useState<FilterState>({
        priceRange: [0, 1000],
        types: [],
        amenities: [],
        minGuests: guests ? parseInt(guests) : 1,
        minBedrooms: 0,
        minBeds: 1,
        minBathrooms: 1,
        hasPhotos: false
    });

    // Reset pagination when filters/sort change
    useEffect(() => {
        setPage(1);
        setProperties([]);
        setHasMore(true);
    }, [location, checkIn, checkOut, filters, sort]); 

    // Fetch Properties
    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Availability Filter (Base)
                let availableIds: string[] | null = null;
                if (checkIn && checkOut) {
                    const available = await propertiesService.getAvailableProperties(checkIn, checkOut);
                    availableIds = available.map(p => p.id);
                }

                // 2. Fetch Page with Filters & Sort
                let result = await propertiesService.getProperties(
                    page, 
                    LIMIT, 
                    filters, 
                    location || undefined, 
                    availableIds || undefined,
                    sort
                );
                let fetchedProps = result.data || [];
                
                // Update Total Count
                if (result.count !== null) {
                    setTotalCount(result.count);
                }

                // 4. Map to UI Model (Property)
                const mappedProps: Property[] = fetchedProps.map(p => ({
                    id: p.id,
                    title: p.title,
                    location: p.location,
                    pricePerNight: p.price_per_night,
                    // Keep raw fields for Map component compatibility
                    price_per_night: p.price_per_night, 
                    latitude: p.latitude,
                    longitude: p.longitude,
                    max_guests: p.max_guests,
                    
                    rating: p.rating || 0,
                    reviewsCount: p.reviews_count || 0,
                    image: p.images?.[0] || '',
                    images: p.images || [],
                    guests: p.max_guests || 0,
                    bedrooms: p.bedrooms || 0,
                    beds: p.beds || 0,
                    bathrooms: p.bathrooms || 0,
                    description: p.description,
                    amenities: p.amenities || [],
                    hostName: p.host?.full_name || 'Host',
                    property_ref: p.property_ref,
                    ref_id: p.ref_id,
                    type: p.type
                }));

                if (page === 1) {
                    setProperties(mappedProps);
                } else {
                    // Replace properties for pagination (Standard Pages)
                    setProperties(mappedProps);
                }
                
                // Check if we reached the end relative to total count
                // Not strictly needed for page-based solving, but good for hasMore check if kept
                if (result.data.length < LIMIT) {
                    setHasMore(false);
                } else {
                     setHasMore(true);
                }
                
                // Initialize text search filters if needed? No, separate state.

            } catch (err) {
                console.error(err);
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, [page, location, checkIn, checkOut, filters, sort]); // Re-fetch when filters/sort change 

    const loadMore = () => {
        if (!isLoading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    // Client-side filtering removed - properties are now already filtered from backend
    const filteredProperties = properties;

    const activeFilterCount = Object.keys(filters).reduce((acc, key) => {
        // @ts-ignore
        if (key === 'priceRange') return acc;
        // @ts-ignore
        if (Array.isArray(filters[key])) return acc + filters[key].length;
         // @ts-ignore
        if (typeof filters[key] === 'boolean') return acc + (filters[key] ? 1 : 0);
         // @ts-ignore
        if (key.startsWith('min') && filters[key] > (key === 'minGuests' ? 1 : 0)) return acc + 1;
        return acc;
    }, 0);

    const totalPages = Math.ceil(totalCount / LIMIT);

    return {
        filteredProperties,
        totalCount,
        totalPages,
        page,
        setPage,
        sort,
        setSort,
        isLoading,
        error,
        filters,
        setFilters,
        activeFilterCount,
        hasMore
    };
};
