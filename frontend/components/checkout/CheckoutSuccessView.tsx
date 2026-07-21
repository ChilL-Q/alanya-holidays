import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const CheckoutSuccessView: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-xl text-center max-w-md animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('checkout.success_title') || 'Booking Confirmed!'}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{t('checkout.success_desc') || 'Your adventure in Alanya awaits. Redirecting to your dashboard...'}</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-full w-full animate-[progress_3s_linear]" />
                </div>
            </div>
        </div>
    );
};
