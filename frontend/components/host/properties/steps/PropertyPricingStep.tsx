import React from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { PropertyHospitality } from './PropertyHospitality';
import { PropertyFormData } from '../../../../types/models';

interface PropertyPricingStepProps {
    formData: PropertyFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const PropertyPricingStep: React.FC<PropertyPricingStepProps> = ({ formData, handleChange }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('list_prop.step7_title')}</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/50">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('list_prop.set_price')}</label>
                    <div className="relative max-w-xs">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">€</span>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-0 focus:border-teal-600 outline-none font-bold text-3xl"
                        />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{t('list_prop.per_night')}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/50 mt-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cleaning Fee (One-time)</label>
                    <div className="relative max-w-xs">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">€</span>
                        <input
                            type="number"
                            name="cleaningFee"
                            value={formData.cleaningFee}
                            onChange={handleChange}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="0"
                            className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-0 focus:border-teal-600 outline-none font-bold text-xl"
                        />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">Added once per reservation</p>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Promotions (Optional)</h3>
                    <div className="space-y-6">
                        <div className="bg-orange-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-orange-100 dark:border-slate-700/50">
                            <label className="block text-sm font-bold text-orange-800 dark:text-slate-200 mb-2">Promotion Price</label>
                            <div className="relative max-w-xs">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold text-lg">€</span>
                                <input
                                    type="number"
                                    name="promotionPrice"
                                    value={formData.promotionPrice}
                                    onChange={handleChange}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-orange-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-0 focus:border-orange-500 outline-none font-bold text-xl"
                                />
                            </div>
                            <p className="text-sm text-orange-600 dark:text-slate-200 mt-2">Set a lower price to attract more guests</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Promotion Description</label>
                            <textarea
                                name="promotionDescription"
                                value={formData.promotionDescription}
                                onChange={handleChange}
                                rows={2}
                                placeholder="e.g. Early bird discount for summer bookings"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <PropertyHospitality formData={formData} handleChange={handleChange} />
        </div>
    );
};
