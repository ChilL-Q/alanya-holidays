import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

interface PropertyCrossSellProps {
    services: any[];
    onNavigate: (id: string) => void;
    displayPrice: (amount: number) => string;
}

export const PropertyCrossSell: React.FC<PropertyCrossSellProps> = ({ services, onNavigate, displayPrice }) => {
    const { t } = useLanguage();

    if (services.length === 0) return null;

    return (
        <section id="cross-sell" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/50 py-16 animate-fade-up">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('cross.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {services.map(service => (
                        <div
                            key={service.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer group"
                            onClick={() => onNavigate(service.id)}
                        >
                            {/* Image Section */}
                            <div className="h-48 overflow-hidden relative shrink-0">
                                <img
                                    src={service.images?.[0] || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'}
                                    alt={service.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm z-10 capitalize">
                                    {service.type === 'car' ? 'Car Rental' :
                                        service.type === 'bike' ? 'Bike Rental' :
                                            service.type === 'esim' ? 'eSIM' :
                                                service.type}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-5 flex flex-col gap-3 flex-1">
                                <div className="min-h-[3rem]">
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-teal-600 dark:text-cyan-400 transition-colors">
                                        {service.title}
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex-1 truncate">{service.duration || 'Flexible duration'}</span>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 font-medium">From</span>
                                        <span className="font-bold text-lg text-teal-600 dark:text-cyan-400">
                                            {displayPrice(service.price)}
                                        </span>
                                    </div>
                                    <button
                                        className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
                                    >
                                        {t('request_details')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
