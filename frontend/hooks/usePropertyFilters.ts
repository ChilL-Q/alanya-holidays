import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Property } from '../types/models';
import { propertiesService } from '../api-services/api/properties';
import { qk } from '../lib/queryKeys';

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
    
    // Initialize state from URL params
    const initialPage = parseInt(searchParams.get('page') || '1');
    const initialSort = searchParams.get('sort') || 'recommended';
    
    const [page, setPageState] = useState(initialPage);
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
        // Deep compare filters object to avoid reference comparison issues
        const hasFiltersChanged = JSON.stringify(prev.filters) !== JSON.stringify(filters);

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

    // Fetch Properties with useQuery
    const propertiesQuery = useQuery({
        queryKey: qk.properties.list(page, LIMIT, filters, location ?? undefined, sort, checkIn ?? undefined, checkOut ?? undefined),
        queryFn: async () => {
            let availableIds: string[] | null = null;
            if (checkIn && checkOut) {
                const available = await propertiesService.getAvailableProperties(checkIn, checkOut);
                availableIds = available.map(p => p.id);
            }
            return propertiesService.getProperties(page, LIMIT, filters, location || undefined, availableIds || undefined, sort);
        },
        staleTime: 2 * 60_000,
        placeholderData: keepPreviousData,
    });

    // Derive state from query result
    const rawResult = propertiesQuery.data;
    const mappedProperties: Property[] = (rawResult?.data ?? []).map(p => ({
        id: p.id,
        title: p.title,
        location: p.location,
        pricePerNight: p.price_per_night,
        price_per_night: p.price_per_night,
        latitude: p.latitude,
        longitude: p.longitude,
        max_guests: p.max_guests,
        rating: p.rating || 0,
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

    const filteredProperties = mappedProperties;
    const totalCount = rawResult?.count ?? 0;
    const isLoading = propertiesQuery.isLoading;
    const error = propertiesQuery.error as Error | null;
    const hasMore = (rawResult?.data?.length ?? 0) >= LIMIT;

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
