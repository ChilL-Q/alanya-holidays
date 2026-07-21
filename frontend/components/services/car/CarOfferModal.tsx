import React from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Check, MessageCircle } from 'lucide-react';
import { ServiceData } from '../../../api-services';
import { useLanguage } from '../../../context/LanguageContext';

interface CarOfferModalProps {
    offer: ServiceData;
    onClose: () => void;
    onBook: (offer: ServiceData) => void;
    formatPrice: (price: string | number) => string;
    convertPrice: (price: number, from: 'USD' | 'EUR') => number;
}

export const CarOfferModal: React.FC<CarOfferModalProps> = ({ offer, onClose, onBook, formatPrice, convertPrice }) => {
    const { t } = useLanguage();

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-slate-900/90 rounded-full shadow-lg z-50 hover:scale-110 transition-transform cursor-pointer group"
                >
                    <X size={24} className="text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors" />
                </button>

                <div className="overflow-y-auto flex-1 overscroll-contain">
                    <div className="h-64 md:h-80 w-full bg-slate-100 dark:bg-slate-900 flex overflow-x-auto snap-x snap-mandatory">
                        {offer.images && offer.images.length > 0 ? (
                            offer.images.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Gallery ${idx}`}
                                    className="w-full h-full object-contain flex-shrink-0 snap-center scale-[1.75]"
                                />
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                No Images Available
                            </div>
                        )}
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 justify-between items-start mb-8 border-b border-slate-100 dark:border-slate-800/50 pb-8">
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">
                                    {offer.title}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                                        <Star size={16} fill="currentColor" />
                                        <span>5.0</span>
                                    </div>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-slate-500 text-sm">Top Rated</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">
                                    {formatPrice(convertPrice(offer.price, 'EUR'))}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">per day</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('offer.features') || 'Features'}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {offer.features && Object.entries(offer.features).map(([key, value]) => {
                                            if (!value || key === 'brand' || key === 'model') return null;
                                            return (
                                                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                                    <Check size={18} className="text-teal-600 dark:text-cyan-400 dark:text-slate-200" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                                                        <p className="font-medium text-slate-900 dark:text-white capitalize">{value.toString()}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('offer.provider') || 'Provider'}</h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-teal-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-teal-600 dark:text-cyan-400 font-bold text-xl">
                                            {offer.provider?.company_name?.charAt(0) || offer.provider?.full_name?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{offer.provider?.company_name || offer.provider?.full_name || 'Verified Provider'}</p>
                                            <p className="text-xs text-slate-500">Joined 2024</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-center gap-2">
                                        <MessageCircle size={16} />
                                        Active since 2024
                                    </button>
                                </div>

                                <button
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10"
                                    onClick={() => onBook(offer)}
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
