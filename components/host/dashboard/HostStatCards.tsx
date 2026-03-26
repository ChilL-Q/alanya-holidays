import React from 'react';
import { DollarSign, Calendar, Home } from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';
import { useLanguage } from '../../../context/LanguageContext';

interface HostStatCardsProps {
    totalEarnings: number;
    pendingPayouts: number;
    totalBookings: number;
    totalProperties: number;
}

export const HostStatCards: React.FC<HostStatCardsProps> = ({
    totalEarnings, pendingPayouts, totalBookings, totalProperties
}) => {
    const { convertPrice, formatPrice } = useCurrency();
    const { t } = useLanguage();

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-teal-50 dark:bg-slate-800/50 rounded-xl text-teal-600 dark:text-cyan-400 dark:text-slate-200">
                        <DollarSign size={24} />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('host.stats.earnings')}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatPrice(convertPrice(totalEarnings, 'EUR'))}</h3>
                <p className="text-xs text-slate-400 mt-1">Total Net Earnings</p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
                        <DollarSign size={24} />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Payouts</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatPrice(convertPrice(pendingPayouts, 'EUR'))}</h3>
                <p className="text-xs text-slate-400 mt-1">Funds held by platform</p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 dark:bg-slate-800/50 rounded-xl text-blue-600 dark:text-slate-200">
                        <Calendar size={24} />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('host.stats.bookings')}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalBookings}</h3>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 dark:bg-slate-800/50 rounded-xl text-purple-600 dark:text-slate-200">
                        <Home size={24} />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('host.stats.properties')}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalProperties}</h3>
            </div>
        </div>
    );
};
