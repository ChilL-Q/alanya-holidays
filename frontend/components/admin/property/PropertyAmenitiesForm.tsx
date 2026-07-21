import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { AMENITIES_LIST } from '../../../data/constants';

interface PropertyAmenitiesFormProps {
    amenities: string[];
    onChange: (amenities: string[]) => void;
}

export const PropertyAmenitiesForm: React.FC<PropertyAmenitiesFormProps> = ({ amenities, onChange }) => {
    const { t } = useLanguage();

    const handleCheck = (amLabel: string, checked: boolean) => {
        const current = amenities || [];
        if (checked) {
            onChange([...current, amLabel]);
        } else {
            onChange(current.filter(a => a !== amLabel));
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {t('prop_form.label_amenities')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_LIST.map(am => (
                    <label key={am.label} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-colors">
                        <input
                            type="checkbox"
                            checked={(amenities || []).includes(am.label)}
                            onChange={(e) => handleCheck(am.label, e.target.checked)}
                            className="w-4 h-4 text-accent dark:text-amber-400 rounded focus:ring-accent border-gray-300"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{t(am.label)}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};
