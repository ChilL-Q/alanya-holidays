import React from 'react';
import { Counter } from '../../../ui/Counter';
import { useLanguage } from '../../../../context/LanguageContext';
import { PropertyFormData } from '../../../../types/models';

interface PropertyBasicsStepProps {
    formData: PropertyFormData;
    setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
}

export const PropertyBasicsStep: React.FC<PropertyBasicsStepProps> = ({ formData, setFormData }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step3_title')}</h2>
            <div className="max-w-md">
                <Counter
                    label={t('prop_form.label_max_guests')} 
                    subtitle={t('list_prop.guests_subtitle')}
                    value={formData.maxGuests} min={1} max={16}
                    onChange={(v) => setFormData({ ...formData, maxGuests: v })}
                />
                <Counter
                    label={t('prop_form.label_bedrooms')}
                    value={formData.bedrooms} min={0} max={10}
                    onChange={(v) => setFormData({ ...formData, bedrooms: v })}
                />
                <Counter
                    label={t('prop_form.label_beds')}
                    value={formData.beds} min={1} max={20}
                    onChange={(v) => setFormData({ ...formData, beds: v })}
                />
                <Counter
                    label={t('prop_form.label_bathrooms')}
                    value={formData.bathrooms} min={1} max={10}
                    onChange={(v) => setFormData({ ...formData, bathrooms: v })}
                />
            </div>
        </div>
    );
};
