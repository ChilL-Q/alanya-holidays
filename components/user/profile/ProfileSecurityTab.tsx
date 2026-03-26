import React from 'react';
import { Key, Mail, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface ProfileSecurityTabProps {
    userEmail: string;
    emailForm: { email: string; confirmEmail?: string };
    setEmailForm: React.Dispatch<React.SetStateAction<any>>;
    changingEmail: boolean;
    handleChangeEmail: (e: React.FormEvent) => void;
    passwordForm: { newPassword: string; confirmPassword: string };
    setPasswordForm: React.Dispatch<React.SetStateAction<any>>;
    changingPassword: boolean;
    handleChangePassword: (e: React.FormEvent) => void;
}

export const ProfileSecurityTab: React.FC<ProfileSecurityTabProps> = ({
    userEmail,
    emailForm,
    setEmailForm,
    changingEmail,
    handleChangeEmail,
    passwordForm,
    setPasswordForm,
    changingPassword,
    handleChangePassword
}) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            {/* Change Password */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Key size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('profile.change_password')}</h2>
                        <p className="text-slate-500 text-sm">{t('profile.password_subtitle')}</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.new_password')}</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.confirm_password')}</label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="bg-slate-900 dark:bg-slate-800/50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors hover:bg-slate-800 disabled:opacity-50"
                        >
                            {changingPassword ? t('auth.submitting') : t('profile.update_password')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Change Email */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 dark:bg-slate-800/50 rounded-xl text-indigo-600 dark:text-slate-200">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('profile.email_verify_title')}</h2>
                        <p className="text-slate-500 text-sm">{t('profile.email_verify_subtitle')}</p>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4 mb-6 flex gap-3">
                    <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0" size={20} />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        {t('profile.email_verify_notice')}
                    </p>
                </div>

                <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.current_email')}</label>
                        <input
                            type="email"
                            value={userEmail}
                            disabled
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.new_email')}</label>
                        <input
                            type="email"
                            value={emailForm.email}
                            onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                            required
                        />
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={changingEmail || emailForm.email === userEmail}
                            className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:grayscale"
                        >
                            {changingEmail ? t('auth.submitting') : t('profile.save_btn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
