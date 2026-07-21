import React from 'react';
import { Star, Calendar, Settings2, Fuel } from 'lucide-react';
import { ServiceData } from '../../../api-services';

interface CarOfferCardProps {
    offer: ServiceData;
    onSelect: (offer: ServiceData) => void;
    onBook: (offer: ServiceData) => void;
    formatPrice: (price: string | number) => string;
    convertPrice: (price: number, from: 'USD' | 'EUR') => number;
}

export const CarOfferCard: React.FC<CarOfferCardProps> = ({ offer, onSelect, onBook, formatPrice, convertPrice }) => {
    return (
        <div
            onClick={() => onSelect(offer)}
            className="bg-white dark:bg-slate-800/80 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 transition-transform hover:scale-[1.01] cursor-pointer group hover:ring-2 hover:ring-teal-500/20 animate-fade-up"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-teal-600 dark:text-cyan-400 font-bold text-xl">
                    {offer.provider?.company_name?.charAt(0) || offer.provider?.full_name?.charAt(0) || 'P'}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-teal-600 dark:text-cyan-400 transition-colors">
                        {offer.provider?.company_name || offer.provider?.full_name || 'Verified Provider'}
                    </h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                        <Star size={14} fill="currentColor" />
                        <span>5.0</span>
                        <span className="text-slate-400 ml-1">(New)</span>
                    </div>
                    <div className="text-xs text-teal-600 dark:text-cyan-400 font-medium mt-1 md:hidden">
                        Click to view details
                    </div>
                </div>
            </div>

            <div className="flex-1 md:px-8">
                <div className="flex flex-wrap gap-3">
                    {offer.features?.year && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/5">
                            <Calendar size={14} className="text-slate-400 dark:text-slate-200" />
                            <span>{offer.features.year}</span>
                        </div>
                    )}
                    {offer.features?.transmission && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/5">
                            <Settings2 size={14} className="text-slate-400 dark:text-slate-200" />
                            <span className="capitalize">{offer.features.transmission}</span>
                        </div>
                    )}
                    {offer.features?.fuel && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/5">
                            <Fuel size={14} className="text-slate-400 dark:text-slate-200" />
                            <span className="capitalize">{offer.features.fuel}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right mr-2">
                    <div className="text-2xl font-bold text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">
                        {formatPrice(convertPrice(offer.price, 'EUR'))}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">per day</div>
                </div>
                <button className="hidden md:block px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-teal-600 dark:text-cyan-400 hover:bg-teal-50 dark:hover:bg-slate-700/80 transition-colors">
                    View Details
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBook(offer);
                    }}
                    className="bg-slate-900 dark:bg-white text-white dark:text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                    Book Now
                </button>
            </div>
        </div>
    );
};
