import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCars } from '../hooks/useCars';
import { CarCard } from '../components/services/CarCard';

export const CarRental: React.FC = () => {
    const { t } = useLanguage();
    const { carGroups, loading } = useCars();

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('car.hero.title') }} />

                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {t('car.hero.subtitle')}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-10">
                            {[t('car.features.delivery'), t('car.features.deposit'), t('car.features.support')].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Check size={16} className="text-teal-500" />
                                    {feature}
                                </div>
                            ))}
                        </div>


                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-teal-100 dark:bg-teal-900/30 rounded-full blur-3xl opacity-50"></div>
                        <img
                            src="/images/transportation/cars/Rent-a-Car-Services-page.jpg"
                            alt="Luxury Car Rental"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            className="relative rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
                        />
                    </div>
                </div>
            </div>

            {/* Fleet Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">{t('car.popular')}</h2>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading fleet...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {carGroups.map((car) => (
                            <CarCard key={car.id} car={car} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

