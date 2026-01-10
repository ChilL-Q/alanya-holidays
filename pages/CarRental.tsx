import React from 'react';
import { Car, Check, ChevronRight, Shield, Fuel, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CARS } from '../constants';
import { useLightbox } from '../context/LightboxContext';
import { useCurrency } from '../context/CurrencyContext';

export const CarRental: React.FC = () => {
    const { t } = useLanguage();
    const { openLightbox } = useLightbox();
    const { convertPrice, formatPrice } = useCurrency();

    const allCarImages = CARS.map(c => ({ src: c.image, title: t(`car.${c.id}.title` as any) }));

    const stats = [
        { label: t('car.stats.fleet'), value: '50+' },
        { label: t('car.stats.clients'), value: '1.2k' },
        { label: t('car.stats.years'), value: '12' },
    ];

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

                        <div className="flex gap-4">
                            <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-teal-600/20 transition-all duration-300 hover:shadow-teal-600/40 hover:scale-105 active:scale-95 flex items-center gap-2">
                                {t('car.button')} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-teal-100 dark:bg-teal-900/30 rounded-full blur-3xl opacity-50"></div>
                        <img
                            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2940&auto=format&fit=crop"
                            alt="Luxury Car Rental"
                            className="relative rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
                        />
                    </div>
                </div>
            </div>

            {/* Fleet Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">{t('car.popular')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CARS.map((car, index) => (
                        <div
                            key={car.id}
                            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 group animate-stagger-enter"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <div
                                className="aspect-[4/3] overflow-hidden relative cursor-zoom-in"
                                onClick={() => openLightbox(allCarImages, index)}
                            >
                                <img
                                    src={car.image}
                                    alt={car.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm">
                                    {t(`car.${car.id}.type` as any)}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t(`car.${car.id}.title` as any)}</h3>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-teal-600">
                                            {formatPrice(convertPrice(car.price, 'EUR'))}
                                        </div>
                                        <div className="text-xs text-slate-500">{t('car.per_day')}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {[t(`car.${car.id}.f1` as any), t(`car.${car.id}.f2` as any), t(`car.${car.id}.f3` as any)].map((feature, i) => (
                                        <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                                <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                                    {t('car.book')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
