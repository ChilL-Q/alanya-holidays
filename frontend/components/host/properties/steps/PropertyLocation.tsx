import React, { useEffect, useState } from 'react';
import { Info, MapPin } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import { LocationPicker } from '../../../ui/LocationPicker';
import toast from 'react-hot-toast';
import { PropertyFormData } from '../../../../types/models';
import { db } from '../../../../api-services';
import { LocationDB } from '../../../../types/models';

interface PropertyLocationProps {
    formData: PropertyFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
}

export const PropertyLocation: React.FC<PropertyLocationProps> = ({ formData, handleChange, setFormData }) => {
    const { t } = useLanguage();
    const [dbLocations, setDbLocations] = useState<LocationDB[]>([]);

    useEffect(() => {
        db.getLocations()
            .then(setDbLocations)
            .catch(() => setDbLocations([]));
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step2_title')}</h2>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    {t('list.form.license')}
                    <div className="group relative">
                        <Info size={16} className="text-slate-400 hover:text-accent dark:text-amber-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                            {t('list.form.license_info')}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                        </div>
                    </div>
                </label>
                <input
                    type="text"
                    name="rentalLicense"
                    placeholder={t('prop_form.license_placeholder')}
                    value={formData.rentalLicense}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    {t('prop_form.location') || 'Location'}
                </label>
                <select
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                >
                    <option value="">{formData.location || 'Select location'}</option>
                    {dbLocations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('prop_form.pin_location')}
                </label>
                <div className="h-64 md:h-80 w-full mb-4">
                    <LocationPicker
                        onLocationSelect={(lat, lng) => setFormData((prev: any) => ({ ...prev, latitude: lat, longitude: lng }))}
                        onAddressSelect={(address, city) => {
                            setFormData((prev: any) => ({
                                ...prev,
                                address: address,
                                location: city || prev.location
                            }));
                            toast.success('Address found: ' + (city ? `${city}` : address));
                        }}
                        initialLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : undefined}
                    />
                </div>
                <p className="text-xs text-slate-500 mb-2">{t('prop_form.pin_hint')}</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('prop_form.label_address')}
                </label>
                <input
                    type="text"
                    name="address"
                    placeholder={t('prop_form.address_placeholder')}
                    required
                    value={formData.address || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                />
            </div>
        </div >
    );
};
