import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, MapPin, Filter, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/db';
import { PropertyCard } from '../components/ui/PropertyCard';
import { Map } from '../components/ui/Map';

import { PropertyFilters, FilterState } from '../components/ui/PropertyFilters';

export const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const location = searchParams.get('location');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    const { t } = useLanguage();

    const [properties, setProperties] = useState<any[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
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

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const { data } = await db.getProperties(1, 100);
                const formattedData = data?.map((p: any) => ({
                    ...p,
                    pricePerNight: p.price_per_night,
                    image: p.images?.[0] || '', // Use first image or empty
                    guests: p.guests || 2, // Fallback
                    bedrooms: p.bedrooms || 1, // Fallback
                    beds: p.beds || 1, // Fallback
                    bathrooms: p.bathrooms || 1, // Fallback
                    rating: p.rating || 0,
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
    }, []);

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

    // Calculate active filter count
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-16 transition-colors relative">
            <PropertyFilters
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                onFilterChange={setFilters}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
                            {location ? `Stays in "${location}"` : 'All Stays in Alanya'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {filteredProperties.length} properties found • {checkIn && checkOut ? `${checkIn} - ${checkOut}` : 'Any dates'} • {guests || 1} guests
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:shadow-sm transition-all font-medium ${showMap ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'}`}
                        >
                            <MapPin size={18} />
                            {showMap ? t('search.show_list') : t('search.show_map')}
                        </button>
                        <button
                            onClick={() => setShowFilters(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:shadow-sm transition-all font-medium text-slate-700 dark:text-slate-200"
                        >
                            <Filter size={18} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="text-center py-20 text-slate-500">Loading stays...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Properties Grid */}
                        <div className={`grid grid-cols-1 ${showMap ? 'lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8 transition-all duration-500`}>
                            {filteredProperties.map((property, index) => (
                                <div
                                    key={property.id}
                                    className="animate-fade-up opacity-0 fill-mode-forwards"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <PropertyCard property={property} />
                                </div>
                            ))}
                        </div>

                        {/* Map Section */}
                        {showMap && (
                            <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900 p-4 md:static md:p-0 md:h-[600px] md:w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 animate-fade-up">
                                <div className="md:hidden flex justify-end mb-4">
                                    <button onClick={() => setShowMap(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                                </div>
                                <Map properties={filteredProperties} />
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && filteredProperties.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Filter size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No properties match your filters</h3>
                        <p className="text-slate-500 font-medium mb-6">Try adjusting your price range or removing some filters.</p>
                        <button
                            onClick={() => setFilters({
                                priceRange: [0, 0],
                                types: [],
                                amenities: [],
                                minGuests: 1,
                                minBedrooms: 0,
                                minBeds: 1,
                                minBathrooms: 1,
                                hasPhotos: false
                            })}
                            className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
