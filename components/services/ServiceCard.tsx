import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency, Currency } from '../../context/CurrencyContext';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    imageUrl?: string;
    price?: string;
    rawPrice?: number;
    baseCurrency?: Currency;
    actionLabel?: string;
    onClick?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
    title,
    description,
    icon: Icon,
    imageUrl,
    price,
    rawPrice,
    baseCurrency = 'EUR',
    actionLabel,
    onClick
}) => {
    const { convertPrice, formatPrice } = useCurrency();

    const displayPrice = rawPrice
        ? formatPrice(convertPrice(rawPrice, baseCurrency))
        : price;
    return (
        <div className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all duration-300">
            {imageUrl && (
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-2 rounded-xl shadow-sm">
                        <Icon className="w-5 h-5 text-primary dark:text-white" />
                    </div>
                </div>
            )}

            <div className="p-6">
                {!imageUrl && (
                    <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary dark:text-teal-400">
                        <Icon size={24} />
                    </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{description}</p>

                <div className="flex items-center justify-between mt-auto">
                    {displayPrice && (
                        <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider block">Starts from</span>
                            <span className="text-lg font-bold text-primary dark:text-teal-400">{displayPrice}</span>
                        </div>
                    )}

                    <button
                        onClick={onClick}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${displayPrice
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md'
                            : 'w-full bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30'
                            }`}
                    >
                        {actionLabel || 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    );
};
