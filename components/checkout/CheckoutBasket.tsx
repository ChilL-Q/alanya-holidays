import React from 'react';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface CheckoutBasketProps {
    items: any[];
    removeFromCart: (id: string) => void;
    convertAndFormat: (amount: number, fromCurrency?: 'USD' | 'EUR') => string;
}

export const CheckoutBasket: React.FC<CheckoutBasketProps> = ({ items, removeFromCart, convertAndFormat }) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('checkout.basket')}</h2>

            {items.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">{t('checkout.empty')}</p>
                    <Link to="/" className="text-teal-700 dark:text-cyan-400 dark:text-slate-200 font-medium underline">{t('checkout.start')}</Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/50 pb-6 last:border-0 last:pb-0">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.type === 'RENTAL' || item.type === 'property'
                                        ? 'bg-teal-100 dark:bg-slate-800/50 text-teal-800 dark:text-cyan-400 dark:text-slate-200'
                                        : 'bg-orange-100 dark:bg-slate-800/50 text-orange-800 dark:text-slate-200'
                                        }`}>
                                        {item.type === 'property' ? 'STAY' : item.type}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.details}</p>
                                {(item.startDate || item.date) && (
                                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {item.startDate ? (
                                            `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate!).toLocaleDateString()}`
                                        ) : item.date}
                                        {item.guests ? ` • ${item.guests} Guests` : ''}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right">
                                <span className="font-medium text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">{convertAndFormat(item.price)}</span>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
