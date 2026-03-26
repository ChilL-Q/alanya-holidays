import React from 'react';
import { Building2, Home } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

interface PropertyTypeStepProps {
    propertyType: string;
    onChange: (type: string) => void;
}

export const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({ propertyType, onChange }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step1_title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => onChange('apartment')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all hover:border-teal-600 ${propertyType === 'apartment'
                        ? 'border-teal-600 bg-teal-50 dark:bg-slate-800/50'
                        : 'border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                        }`}
                >
                    <Building2 size={32} className={`mb-4 ${propertyType === 'apartment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('list_prop.type_apt')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('list_prop.type_apt_desc')}</p>
                </button>

                <button
                    onClick={() => onChange('villa')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all hover:border-teal-600 ${propertyType === 'villa'
                        ? 'border-teal-600 bg-teal-50 dark:bg-slate-800/50'
                        : 'border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                        }`}
                >
                    <Home size={32} className={`mb-4 ${propertyType === 'villa' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('list_prop.type_villa')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('list_prop.type_villa_desc')}</p>
                </button>
            </div>
        </div>
    );
};
