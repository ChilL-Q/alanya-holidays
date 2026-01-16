import React from 'react';
import { MapPin, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LocationPicker } from '../ui/LocationPicker';
import toast from 'react-hot-toast';

interface PropertyLocationProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const PropertyLocation: React.FC<PropertyLocationProps> = ({ formData, handleChange, setFormData }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    {t('list.form.license')}
                    <div className="group relative">
                        <Info size={16} className="text-slate-400 hover:text-accent cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                            {t('list.form.license_info')}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                        </div>
                    </div>
                </label>
                <input
                    type="text"
                    name="rentalLicense"
                    placeholder="e.g. 07-1234..."
                    value={formData.rentalLicense}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('list.form.location')} (Area)
                </label>
                <div className="relative mb-4">
                    <input
                        type="text"
                        name="location"
                        placeholder="e.g. Mahmutlar"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pin Exact Location
                </label>
                <div className="h-64 md:h-80 w-full mb-4">
                    <LocationPicker
                        onLocationSelect={(lat, lng) => setFormData((prev: any) => ({ ...prev, latitude: lat, longitude: lng }))}
                        onAddressSelect={(address, city) => {
                            setFormData((prev: any) => ({
                                ...prev,
                                address: address, // Auto-fill full address
                                location: city || prev.location // Auto-fill Area/City if found, otherwise keep existing
                            }));
                            toast.success('Address found: ' + (city ? `${city}` : address));
                        }}
                        initialLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : undefined}
                    />
                </div>
                <p className="text-xs text-slate-500 mb-2">Click on the map to set the exact location of your property.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Address
                </label>
                <input
                    type="text"
                    name="address"
                    placeholder="Street, Building No, Apartment No..."
                    required
                    value={formData.address || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                />
            </div>
        </div>
    );
};
