import React from 'react';
import { Camera, Grid, Home, Car, Banknote, Settings, Shield, LogOut } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface ProfileSidebarProps {
    user: any;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    uploading: boolean;
    handleLogout: () => void;
    setIsHostModalOpen: (val: boolean) => void;
    loading: boolean;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    user,
    activeTab,
    setActiveTab,
    fileInputRef,
    handleAvatarUpload,
    uploading,
    handleLogout,
    setIsHostModalOpen,
    loading
}) => {
    const { t } = useLanguage();

    return (
        <div className="lg:col-span-3 space-y-6">
            {/* User Card */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm p-6 text-center border border-slate-100 dark:border-slate-800/50">
                <div className="relative inline-block mb-4 group/avatar">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800/50 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Camera size={24} className="text-white" />
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                    >
                        <Camera size={16} />
                    </button>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{user.name}</h2>
                <p className="text-slate-500 text-sm mb-4">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                    {user.role === 'host' ? t('profile.role.host') : user.role === 'admin' ? t('profile.role.admin') : t('profile.role.guest')}
                </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/50">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'overview' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                >
                    <Grid size={20} />
                    <span className="font-medium">{t('profile.bookings') || 'Overview'}</span>
                </button>

                {/* Host Only Tabs */}
                {(user.role === 'host' || user.role === 'admin') && (
                    <>
                        <button
                            onClick={() => setActiveTab('my_properties')}
                            className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'my_properties' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                        >
                            <Home size={20} />
                            <span className="font-medium">{t('profile.my_properties')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('my_services')}
                            className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'my_services' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                        >
                            <Car size={20} />
                            <span className="font-medium">{t('profile.my_services')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'payouts' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                        >
                            <Banknote size={20} />
                            <span className="font-medium">{t('profile.payout_details') || 'Payout Details'}</span>
                        </button>
                    </>
                )}

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'settings' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                >
                    <Settings size={20} />
                    <span className="font-medium">{t('profile.settings')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'security' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                >
                    <Shield size={20} />
                    <span className="font-medium">{t('profile.security')}</span>
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800/50 mt-2 pt-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-6 py-4 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">{t('auth.logout')}</span>
                    </button>
                </div>
            </nav>

            {/* Become a Host Call to Action */}
            {user.role === 'guest' && (
                <div className="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Home size={80} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 relative z-10">{t('profile.become_host_title') || 'Become a Host'}</h3>
                    <p className="text-white/90 text-sm mb-4 relative z-10">
                        {t('profile.become_host_desc') || 'Earn money by renting out your property or vehicle.'}
                    </p>
                    <button
                        onClick={() => setIsHostModalOpen(true)}
                        disabled={loading}
                        className="w-full bg-white text-primary font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors relative z-10"
                    >
                        {loading ? t('auth.submitting') : t('profile.upgrade_btn')}
                    </button>
                </div>
            )}
        </div>
    );
};
