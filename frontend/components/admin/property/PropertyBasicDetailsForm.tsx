import React, { ChangeEvent } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Home } from 'lucide-react';

interface PropertyBasicForm {
    title: string;
    description: string;
    propertyType: string;
    price: string | number;
    cleaningFee: string | number;
    maxGuests: string | number;
    beds: string | number;
    bedrooms: string | number;
    bathrooms: string | number;
    address: string;
    isPromoted: boolean;
    [key: string]: unknown;
}

interface PropertyBasicDetailsFormProps {
    formData: PropertyBasicForm;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PropertyBasicDetailsForm: React.FC<PropertyBasicDetailsFormProps> = ({ formData, onChange }) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Basic Information</h3>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_title')}
                    </label>
                    <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_price')}
                    </label>
                    <input
                        type="number"
                        name="price"
                        required
                        min="1"
                        value={formData.price}
                        onChange={onChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Cleaning Fee (One-time)
                    </label>
                    <input
                        type="number"
                        name="cleaningFee"
                        min="0"
                        value={formData.cleaningFee}
                        onChange={onChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_type')}
                    </label>
                    <div className="relative">
                        <select
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={onChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all appearance-none"
                        >
                            <option value="apartment">Apartment</option>
                            <option value="villa">Villa</option>
                        </select>
                        <Home className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_max_guests')}
                    </label>
                    <input
                        type="number"
                        name="maxGuests"
                        required
                        min="1"
                        value={formData.maxGuests}
                        onChange={onChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_beds')}
                    </label>
                    <input
                        type="number"
                        name="beds"
                        required
                        min="1"
                        value={formData.beds}
                        onChange={onChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_bedrooms')}
                    </label>
                    <input
                        type="number"
                        name="bedrooms"
                        required
                        min="0"
                        value={formData.bedrooms}
                        onChange={onChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_bathrooms')}
                    </label>
                    <input
                        type="number"
                        name="bathrooms"
                        required
                        min="0"
                        value={formData.bathrooms}
                        onChange={onChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_address')}
                    </label>
                    <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('prop_form.label_desc')}
                    </label>
                    <textarea
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    ></textarea>
                </div>
            </div>

            <div className="mt-6 bg-indigo-50 dark:bg-slate-800/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                <input
                    type="checkbox"
                    id="isPromoted"
                    name="isPromoted"
                    checked={formData.isPromoted}
                    onChange={onChange}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="isPromoted" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Promote this Property
                    <span className="block text-xs font-normal text-slate-500">Property will appear with a 'Featured' badge</span>
                </label>
            </div>
        </div>
    );
};
