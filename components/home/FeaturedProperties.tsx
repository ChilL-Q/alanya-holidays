import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../services/db';
import { PropertyCard } from '../ui/PropertyCard';

export const FeaturedProperties: React.FC = () => {
    const { t } = useLanguage();
    const [properties, setProperties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const data = await db.getProperties();
                const formattedData = data?.slice(0, 3).map((p: any) => ({
                    ...p,
                    pricePerNight: p.price_per_night,
                    image: p.images?.[0] || '', // Use first image or empty
                    guests: p.guests || 2, // Fallback
                    bedrooms: p.bedrooms || 1, // Fallback
                    rating: p.rating || 0,
                    reviewsCount: p.reviews_count || 0
                })) || [];
                setProperties(formattedData);
            } catch (error) {
                console.error('Error fetching featured properties:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperties();
    }, []);

    if (isLoading) {
        return (
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{t('featured.title')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('featured.subtitle')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-[400px] animate-pulse"></div>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex justify-between items-end mb-8 animate-fade-up">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{t('featured.title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{t('featured.subtitle')}</p>
                </div>
                <Link to="/search" className="hidden md:block text-teal-700 font-medium hover:text-teal-900 hover:underline transition-colors duration-300">{t('featured.view_all')}</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((property, index) => (
                    <div
                        key={property.id}
                        className="animate-fade-up opacity-0 fill-mode-forwards"
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        <PropertyCard property={property} />
                    </div>
                ))}
            </div>

            {properties.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No properties currently available.
                </div>
            )}
        </section>
    );
};
