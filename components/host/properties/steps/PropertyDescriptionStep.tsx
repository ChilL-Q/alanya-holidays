import React from 'react';
import { useLanguage } from '../../../../context/LanguageContext';

interface PropertyDescriptionStepProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const PropertyDescriptionStep: React.FC<PropertyDescriptionStepProps> = ({ formData, handleChange }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step6_title')}</h2>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('list_prop.create_title')}</label>
                <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t('prop_form.title')}
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-lg"
                />
                <p className="text-right text-xs text-slate-400 mt-1">{formData.title.length}/50</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('list_prop.create_desc')}</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder={t('prop_form.description')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
                />
            </div>
        </div>
    );
};
