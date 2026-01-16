import React from 'react';
import { Home } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PropertyBasicInfoProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PropertyBasicInfo: React.FC<PropertyBasicInfoProps> = ({ formData, handleChange }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('list.form.prop_title')}
                    </label>
                    <input
                        type="text"
                        name="title"
                        required
                        placeholder="e.g. Luxury Seaview Apartment"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('list.form.name')}
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        readOnly={true}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all opacity-60 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('list.form.email')}
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        readOnly={true}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all opacity-60 cursor-not-allowed"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('list.form.price')}
                    </label>
                    <input
                        type="number"
                        name="price"
                        required
                        min="1"
                        value={formData.price}
                        onChange={handleChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('list.form.type')}
                    </label>
                    <div className="relative">
                        <select
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all appearance-none"
                        >
                            <option value="apartment">{t('list.form.type.apartment')}</option>
                            <option value="villa">{t('list.form.type.villa')}</option>
                        </select>
                        <Home className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Max Guests
                    </label>
                    <input
                        type="number"
                        name="maxGuests"
                        required
                        min="1"
                        value={formData.maxGuests}
                        onChange={handleChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bedrooms
                    </label>
                    <input
                        type="number"
                        name="bedrooms"
                        required
                        min="0"
                        value={formData.bedrooms}
                        onChange={handleChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bathrooms
                    </label>
                    <input
                        type="number"
                        name="bathrooms"
                        required
                        min="0"
                        value={formData.bathrooms}
                        onChange={handleChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Number of Beds
                    </label>
                    <input
                        type="number"
                        name="beds"
                        required
                        min="1"
                        value={formData.beds}
                        onChange={handleChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
};
