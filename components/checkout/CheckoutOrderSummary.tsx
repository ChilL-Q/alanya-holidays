import React from 'react';
import { Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CheckoutOrderSummaryProps {
    items: any[];
    total: number;
    currency: string;
    convertAndFormat: (amount: number, fromCurrency?: 'USD' | 'EUR') => string;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({ items, total, currency, convertAndFormat }) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-md border border-slate-200 dark:border-slate-800/50 p-6 sticky top-24">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">{t('checkout.price_details')}</h3>

            <div className="space-y-3 mb-6">
                {items.map((item, idx) => {
                    const itemCleaningFee = item.cleaningFee || 0;
                    const itemTotal = item.price;
                    const rentalPrice = item.type === 'property' || item.type === 'RENTAL' ? (itemTotal - itemCleaningFee) : itemTotal;

                    return (
                        <div key={idx} className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>
                                    {item.type === 'property' || item.type === 'RENTAL'
                                        ? `${convertAndFormat((item.pricePerNight || 0), 'EUR')} x ${item.nights || 0} ${t('featured.night') || 'nights'}`
                                        : item.title
                                    }
                                </span>
                                <span>{convertAndFormat(rentalPrice)}</span>
                            </div>

                            {(item.type === 'property' || item.type === 'RENTAL') && itemCleaningFee > 0 && (
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex flex-col">
                                        <span>{t('checkout.cleaning_fee') || 'Cleaning Fee'}</span>
                                        <span className="text-[10px] text-slate-400">({t('checkout.set_by_host') || 'set by host'})</span>
                                    </div>
                                    <span>{convertAndFormat(itemCleaningFee)}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800/50">
                <span className="font-bold text-lg text-slate-900 dark:text-white">{t('prop.total')} ({currency})</span>
                <span className="font-bold text-xl text-slate-900 dark:text-white">
                    {convertAndFormat(total)}
                </span>
            </div>

            <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex gap-3 items-start">
                <Shield className="text-teal-700 dark:text-cyan-400 dark:text-slate-200 shrink-0" size={18} />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{t('checkout.free_cancel')}</span> {t('checkout.free_cancel_desc')}
                </p>
            </div>
        </div>
    );
};
