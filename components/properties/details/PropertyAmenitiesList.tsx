import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface PropertyAmenitiesListProps {
    amenities: string[];
}

export const PropertyAmenitiesList: React.FC<PropertyAmenitiesListProps> = ({ amenities }) => {
    const { t } = useLanguage();

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.offers')}</h3>
            <div className="grid grid-cols-2 gap-4">
                {(amenities || []).map((am, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
                            <CheckCircle size={16} />
                        </div>
                        {t(am)}
                    </div>
                ))}
            </div>
        </div>
    );
};
