import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface CheckoutWelcomePackProps {
    isAdded: boolean;
    onAdd: () => void;
}

export const CheckoutWelcomePack: React.FC<CheckoutWelcomePackProps> = ({ isAdded, onAdd }) => {
    const { t } = useLanguage();

    return (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border border-teal-100 dark:border-slate-700/50 p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-slate-800/80 rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0">
                🧺
            </div>
            <div className="flex-grow text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('checkout.welcome_pack_title') || 'Arrive in Comfort'}</h3>
                    <span className="font-bold text-teal-700 dark:text-cyan-400 dark:text-accent dark:text-amber-400 text-sm">€30</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                    {t('checkout.welcome_pack_desc') || 'Don\'t worry about shopping immediately. We\'ll stock your fridge with essentials: bread, water, milk, eggs, cheese, and seasonal fruit.'}
                </p>
            </div>
            <button
                onClick={onAdd}
                disabled={isAdded}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm whitespace-nowrap ${isAdded
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white hover:shadow-md active:scale-95'}`}
            >
                {isAdded ? (t('checkout.added') || 'Added') : (t('checkout.add_welcome') || 'Add')}
            </button>
        </div>
    );
};
