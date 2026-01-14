import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, MapPin, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/db';
import { PropertyCard } from '../components/ui/PropertyCard';
import { Map } from '../components/ui/Map';

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

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const data = await db.getProperties();
                const formattedData = data?.map((p: any) => ({
                    ...p,
                    pricePerNight: p.price_per_night,
                    image: p.images?.[0] || '', // Use first image or empty
                    guests: p.guests || 2, // Fallback
                    bedrooms: p.bedrooms || 1, // Fallback
                    rating: p.rating || 0,
                    reviewsCount: p.reviews_count || 0
                })) || [];
                setProperties(formattedData);
                setFilteredProperties(formattedData);
            } catch (error) {
                console.error('Error fetching properties:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperties();
    }, []);

    useEffect(() => {
        if (!properties.length) return;

        if (location) {
            const lowerLocation = location.toLowerCase();
            const filtered = properties.filter(p =>
                p.location?.toLowerCase().includes(lowerLocation) ||
                p.title?.toLowerCase().includes(lowerLocation)
            );
            setFilteredProperties(filtered);
        } else {
            setFilteredProperties(properties);
        }
    }, [location, properties]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-16 transition-colors">
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
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:shadow-sm transition-all font-medium text-slate-700 dark:text-slate-200">
                            <Filter size={18} />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="text-center py-20 text-slate-500">Loading stays...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Properties Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProperties.map((property, index) => (
                                <div
                                    key={property.id}
                                    className="animate-stagger-enter"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <PropertyCard property={property} />
                                </div>
                            ))}
                        </div>

                        {/* Map Section */}
                        {showMap && (
                            <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 animate-fade-up">
                                <Map properties={filteredProperties} />
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && filteredProperties.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-xl text-slate-500 font-medium">No properties found matching your criteria.</p>
                        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Clear search</Link>
                    </div>
                )}
            </div>
        </div>
    );
};
