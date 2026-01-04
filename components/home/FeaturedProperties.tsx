import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MOCK_PROPERTIES } from '../../constants';

export const FeaturedProperties: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900">{t('featured.title')}</h2>
                    <p className="text-slate-500 mt-2">{t('featured.subtitle')}</p>
                </div>
                <Link to="#" className="hidden md:block text-teal-700 font-medium hover:underline">{t('featured.view_all')}</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {MOCK_PROPERTIES.map((property) => (
                    <Link key={property.id} to={`/property/${property.id}`} className="group block">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200 mb-4">
                            <img
                                src={property.image}
                                alt={property.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold text-slate-800 shadow-sm">
                                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                {property.rating}
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-lg line-clamp-1 group-hover:text-teal-700 transition">{property.title}</h3>
                                <p className="text-slate-500 text-sm">{property.location}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900 text-lg">${property.pricePerNight}</p>
                                <p className="text-xs text-slate-400">{t('featured.night')}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};
