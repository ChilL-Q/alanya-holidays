import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { CarGroup } from '../../hooks/useCarAggregation';

interface CarCardProps {
    car: CarGroup;
}

export const CarCard: React.FC<CarCardProps> = ({ car }) => {
    const navigate = useNavigate();
    const { convertPrice, formatPrice } = useCurrency();
    const { t } = useLanguage();

    return (
        <div
            className="bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800/50 group cursor-pointer"
            onClick={() => navigate(`/services/car-rental/${car.id}`, { state: { brand: car.brand, model: car.model } })}
        >
            <div className="aspect-[4/3] overflow-hidden relative">
                <img
                    src={car.image}
                    alt={car.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm">
                    {car.year}
                </div>
                {car.count > 1 && (
                    <div className="absolute top-3 left-3 bg-teal-500 dark:bg-cyan-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {car.count} Offers
                    </div>
                )}
            </div>
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{car.title}</h3>
                    <div className="text-right">
                        <div className="text-sm text-slate-500 dark:text-slate-400">from</div>
                        <div className="text-xl font-bold text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">
                            {formatPrice(convertPrice(car.minPrice, 'EUR'))}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('car.per_day')}</div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    {car.features.map((feature, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium capitalize">
                            {feature}
                        </span>
                    ))}
                </div>
                <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                    {t('car.book')}
                </button>
            </div>
        </div>
    );
};
