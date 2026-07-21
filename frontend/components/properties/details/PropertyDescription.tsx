import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

interface PropertyDescriptionProps {
    description: string;
}

export const PropertyDescription: React.FC<PropertyDescriptionProps> = ({ description }) => {
    const { t } = useLanguage();

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.about')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {description || 'No description provided.'}
            </p>
        </div>
    );
};
