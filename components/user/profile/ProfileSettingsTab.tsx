import React from 'react';
import { UserCircle, Phone, Home, Save } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface ProfileSettingsTabProps {
    profileForm: { name: string; phone: string; companyName: string };
    setProfileForm: React.Dispatch<React.SetStateAction<any>>;
    savingProfile: boolean;
    handleUpdateProfile: (e: React.FormEvent) => void;
    isHostOrAdmin: boolean;
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
    profileForm,
    setProfileForm,
    savingProfile,
    handleUpdateProfile,
    isHostOrAdmin
}) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('profile.personal_info')}</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            {t('auth.name')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                required
                            />
                            <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            {t('profile.phone')}
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                placeholder="+90..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                            />
                            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>

                {isHostOrAdmin && (
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            {t('profile.company_name')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={profileForm.companyName}
                                onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                                placeholder="Alanya Holidays Ltd."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                            />
                            <Home size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {savingProfile ? t('auth.submitting') : (
                            <>
                                <Save size={18} />
                                {t('profile.save_btn')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
