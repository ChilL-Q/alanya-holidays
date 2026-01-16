import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { db } from '../services/db';
import { PropertyCard } from '../components/ui/PropertyCard';

export const FavoritesPage: React.FC = () => {
    const { favorites } = useFavorites();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            setLoading(true);
            try {
                // Fetch only favorite properties directly using IDs
                const data = await db.getPropertiesByIds(favorites);

                const formattedData = data?.map((p: any) => ({
                    ...p,
                    pricePerNight: p.price_per_night,
                    image: p.images?.[0] || '',
                    guests: p.guests || 2,
                    bedrooms: p.bedrooms || 1,
                    rating: p.rating || 0,
                    reviewsCount: p.reviews_count || 0
                })) || [];

                setProperties(formattedData);
            } catch (error) {
                console.error('Error fetching favorite properties:', error);
            } finally {
                setLoading(false);
            }
        };

        if (favorites.length > 0) {
            fetchFavorites();
        } else {
            setProperties([]);
            setLoading(false);
        }
    }, [favorites]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-16 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Heart className="text-rose-500 fill-rose-500" />
                        Shortlist
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {properties.length} saved properties
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading favorites...</div>
                ) : properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart size={32} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No favorites yet</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                            Start exploring our diverse collection of properties and save your favorites here for easy access.
                        </p>
                        <Link
                            to="/search"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                        >
                            Explore Stays
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};
