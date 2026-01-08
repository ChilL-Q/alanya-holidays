import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { MOCK_PROPERTIES } from '../../constants';
import { PropertyCard } from '../ui/PropertyCard';

export const FeaturedProperties: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{t('featured.title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{t('featured.subtitle')}</p>
                </div>
                <Link to="#" className="hidden md:block text-teal-700 font-medium hover:underline">{t('featured.view_all')}</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {MOCK_PROPERTIES.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>
        </section>
    );
};
