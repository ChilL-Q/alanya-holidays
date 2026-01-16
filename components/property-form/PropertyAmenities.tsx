import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AMENITIES_LIST } from '../../data/constants';

interface PropertyAmenitiesProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const PropertyAmenities: React.FC<PropertyAmenitiesProps> = ({ formData, setFormData }) => {
    const { t } = useLanguage();

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_LIST.map(am => (
                    <label key={am.label} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                            type="checkbox"
                            checked={(formData.amenities as string[] || []).includes(am.label)}
                            onChange={(e) => {
                                const current = (formData.amenities as string[]) || [];
                                if (e.target.checked) {
                                    setFormData((prev: any) => ({ ...prev, amenities: [...current, am.label] }));
                                } else {
                                    setFormData((prev: any) => ({ ...prev, amenities: current.filter((a: string) => a !== am.label) }));
                                }
                            }}
                            className="w-4 h-4 text-accent rounded focus:ring-accent border-gray-300"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{t(am.label)}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};
