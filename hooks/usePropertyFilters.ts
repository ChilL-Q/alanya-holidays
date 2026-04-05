import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Property } from '../types/models';
import { propertiesService } from '../api-services/api/properties';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const isMountedRef = useRef(false);
    
    // Initialize state from URL params
    const initialPage = parseInt(searchParams.get('page') || '1');
    const initialSort = searchParams.get('sort') || 'recommended';
    
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPageState] = useState(initialPage);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSortState] = useState(initialSort);
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

    // Sync Page with URL
    const setPage = (newPage: number | ((prev: number) => number)) => {
        const value = typeof newPage === 'function' ? newPage(page) : newPage;
        setPageState(value);
        setSearchParams(prev => {
            prev.set('page', value.toString());
            return prev;
        });
    };

    // Sync Sort with URL
    const setSort = (newSort: string) => {
        setSortState(newSort);
        setSearchParams(prev => {
            prev.set('sort', newSort);
            return prev;
        });
    };

    // Track previous dependencies to prevent unwanted page resets (Strict Mode / Initial Mount)
    const prevDeps = useRef({
        location,
        checkIn,
        checkOut,
        filters,
        sort
    });

    // Reset pagination ONLY when filters/sort/location/dates actually change
    // Uses ref comparison to avoid JSON.stringify serialization overhead
    useEffect(() => {
        const prev = prevDeps.current;
        const hasLocationChanged = prev.location !== location;
        const hasDatesChanged = prev.checkIn !== checkIn || prev.checkOut !== checkOut;
        const hasSortChanged = prev.sort !== sort;
        const hasFiltersChanged = prev.filters !== filters;

        if (hasLocationChanged || hasDatesChanged || hasSortChanged || hasFiltersChanged) {
            setPageState(1);
            setSearchParams(prev => { prev.set('page', '1'); return prev; });

            prevDeps.current = {
                location,
                checkIn,
                checkOut,
                filters,
                sort
            };
        }
    }, [location, checkIn, checkOut, filters, sort, setSearchParams]);

    // Fetch Properties
    useEffect(() => {
        isMountedRef.current = true;
        const fetchProperties = async () => {
            if (isMountedRef.current) setIsLoading(true);
            if (isMountedRef.current) setError(null);
            try {
                // 1. Availability Filter (Base)
                let availableIds: string[] | null = null;
                if (checkIn && checkOut) {
                    const available = await propertiesService.getAvailableProperties(checkIn, checkOut);
                    availableIds = available.map(p => p.id);
                }

                // 2. Fetch Page with Filters & Sort
                const result = await propertiesService.getProperties(
                    page,
                    LIMIT,
                    filters,
                    location || undefined,
                    availableIds || undefined,
                    sort
                );
                const fetchedProps = result.data || [];

                // Update Total Count
                if (result.count !== null && isMountedRef.current) {
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
                    // @ts-ignore - reviews joined dynamically
                    reviewsCount: p.reviews?.[0]?.count ?? (p.reviews_count || 0),
                    image: p.images?.[0] || '',
                    images: p.images || [],
                    guests: p.max_guests || 0,
                    bedrooms: p.bedrooms || 0,
                    beds: p.beds || 0,
                    bathrooms: p.bathrooms || 0,
                    description: p.description,
                    amenities: p.amenities || [],
                    hostName: p.host?.full_name || 'Host',
                    ref_id: p.ref_id,
                    type: p.type
                }));

                if (isMountedRef.current) setProperties(mappedProps);

                // Check if we reached the end
                if (result.data.length < LIMIT) {
                    setHasMore(false);
                } else {
                     setHasMore(true);
                }

            } catch (err) {
                console.error(err);
                if (isMountedRef.current) setError(err as Error);
            } finally {
                if (isMountedRef.current) setIsLoading(false);
            }
        };

        fetchProperties();
        return () => { isMountedRef.current = false; };
    }, [page, location, checkIn, checkOut, filters, sort]);

    // Client-side filtering removed - properties are now already filtered from backend
    const filteredProperties = properties;

    const activeFilterCount = (Object.keys(filters) as Array<keyof FilterState>).reduce((acc, key) => {
        const value = filters[key];
        if (key === 'priceRange') return acc;
        if (Array.isArray(value)) return acc + value.length;
        if (typeof value === 'boolean') return acc + (value ? 1 : 0);
        if (typeof value === 'number' && key.startsWith('min') && value > (key === 'minGuests' ? 1 : 0)) return acc + 1;
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
