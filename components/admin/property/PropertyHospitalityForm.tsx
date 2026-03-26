import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

interface PropertyHospitalityFormProps {
    formData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const PropertyHospitalityForm: React.FC<PropertyHospitalityFormProps> = ({ formData, onChange }) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                {t('prop_form.section_hospitality')}
                <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full ml-auto">
                    {t('prop_form.visible_after_booking')}
                </span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_checkin')}</label>
                    <input
                        type="text"
                        name="checkInTime"
                        placeholder={t('prop_form.checkin_time')}
                        value={formData.checkInTime}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_checkout')}</label>
                    <input
                        type="text"
                        name="checkOutTime"
                        placeholder={t('prop_form.checkout_time')}
                        value={formData.checkOutTime}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_method')}</label>
                    <input
                        type="text"
                        name="checkInMethod"
                        placeholder={t('prop_form.checkin_method')}
                        value={formData.checkInMethod}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_wifi')}</label>
                    <textarea
                        name="wifiDetails"
                        placeholder={t('prop_form.wifi')}
                        rows={2}
                        value={formData.wifiDetails}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_arrival')}</label>
                    <textarea
                        name="arrivalGuide"
                        placeholder={t('prop_form.arrival')}
                        rows={3}
                        value={formData.arrivalGuide}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_directions')}</label>
                    <textarea
                        name="directions"
                        placeholder={t('prop_form.directions')}
                        rows={2}
                        value={formData.directions}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_manual')}</label>
                    <textarea
                        name="houseManual"
                        placeholder={t('prop_form.house_manual')}
                        rows={3}
                        value={formData.houseManual}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_rules')}</label>
                    <textarea
                        name="houseRules"
                        placeholder={t('prop_form.house_rules')}
                        rows={3}
                        value={formData.houseRules}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_checkout_instr')}</label>
                    <textarea
                        name="checkoutInstructions"
                        placeholder={t('prop_form.checkout_instr')}
                        rows={2}
                        value={formData.checkoutInstructions}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_guidebooks')}</label>
                    <textarea
                        name="guidebooks"
                        placeholder={t('prop_form.recommendations')}
                        rows={2}
                        value={formData.guidebooks}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_interaction')}</label>
                    <textarea
                        name="interactionPreferences"
                        placeholder={t('prop_form.interaction')}
                        rows={2}
                        value={formData.interactionPreferences}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
};
