import React from 'react';
import { User, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface PropertyHostCardProps {
    hostName: string;
    hostAvatar: string | null;
    onContact: () => void;
}

export const PropertyHostCard: React.FC<PropertyHostCardProps> = ({ hostName, hostAvatar, onContact }) => {
    const { t } = useLanguage();

    return (
        <div className="py-6 border-y border-slate-200 dark:border-slate-800/50 flex flex-col sm:flex-row items-center sm:justify-between gap-6 px-2 sm:px-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800/80 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 overflow-hidden shrink-0">
                    {hostAvatar ? (
                        <img src={hostAvatar} alt={hostName} className="w-full h-full object-cover" />
                    ) : (
                        <User size={24} />
                    )}
                </div>
                <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                        {t('prop.hosted_by')} {hostName || 'Alanya Holidays'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('prop.verified_host')} • {t('prop.superhost')}
                    </p>
                </div>
            </div>
            <button
                onClick={onContact}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 z-10"
            >
                <MessageCircle size={20} />
                Contact Host
            </button>
        </div>
    );
};
