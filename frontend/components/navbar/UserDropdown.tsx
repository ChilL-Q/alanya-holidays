import React from 'react';
import { Link } from 'react-router-dom';
import { User, LayoutDashboard, LogOut, PlusCircle, ArrowRightLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface UserDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'directory' | 'rental';
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose, mode = 'directory' }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { openLogin, openRegister } = useModal();
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { currency, setCurrency } = useCurrency();

    if (!isOpen) return null;

    return (
        <div className="absolute top-full mt-3 right-0 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 hidden md:block">
            {/* User Header (Auth Only) */}
            {isAuthenticated && user && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800/50">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
            )}

            {/* Guest Actions */}
            {!isAuthenticated && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800/50">
                    <button
                        onClick={() => { openLogin(); onClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors"
                    >
                        {t('nav.login')}
                    </button>
                    <button
                        onClick={() => { openRegister(); onClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-teal-600 dark:text-cyan-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                    >
                        {t('nav.signup')}
                    </button>
                </div>
            )}

            <div className="p-2">
                {isAuthenticated && (
                    <>
                        <Link to="/inbox" onClick={onClose} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                            <div className="relative">
                                <div className="text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-inbox"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
                                </div>
                            </div>
                            {t('nav.messages') || 'Messages'}
                        </Link>
                        <Link to="/profile" onClick={onClose} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                            <User size={16} className="text-slate-400" />
                            {t('nav.profile')}
                        </Link>
                        {user?.role === 'admin' && (
                            <Link to="/admin" onClick={onClose} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                                <LayoutDashboard size={16} className="text-purple-600" />
                                {t('nav.admin_panel')}
                            </Link>
                        )}
                        {(user?.role === 'host' || user?.role === 'admin') && (
                            <>
                                <Link to="/host/dashboard" onClick={onClose} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                                    <LayoutDashboard size={16} className="text-teal-500 dark:text-cyan-400 " />
                                    {t('nav.host_dashboard')}
                                </Link>
                                <Link to="/list-property" onClick={onClose} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                                    <PlusCircle size={16} className="text-teal-500 dark:text-cyan-400" />
                                    {t('nav.list_property')}
                                </Link>
                                <Link to="/add-service" onClick={onClose} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                                    <PlusCircle size={16} className="text-teal-500 dark:text-cyan-400" />
                                    {t('nav.list_service')}
                                </Link>
                                <Link to="/add-listing" onClick={onClose} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                                    <PlusCircle size={16} className="text-teal-500 dark:text-cyan-400" />
                                    {t('nav.list_directory')}
                                </Link>
                            </>
                        )}
                        <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2"></div>
                        <button onClick={() => { logout(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                            <LogOut size={16} />
                            {t('auth.logout')}
                        </button>
                    </>
                )}

                {/* Mode switch, Language & Theme settings section */}
                <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2"></div>
                <div className="px-3 py-2 space-y-3">
                    {/* Switch Mode Toggle */}
                    <Link
                        to={mode === 'directory' ? '/services' : '/'}
                        onClick={onClose}
                        className="flex items-center gap-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-cyan-400 transition-colors"
                    >
                        <ArrowRightLeft size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate">
                            {mode === 'directory' 
                                ? (t('nav.switch_to_rentals') || 'Rentals & Services') 
                                : (t('nav.switch_to_directory') || 'Directory')}
                        </span>
                    </Link>

                    {/* Language Selector */}
                    <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/50 pt-2.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                            {t('nav.language') || 'Language'}
                        </span>
                        <div className="flex gap-1">
                            {(['en', 'ru', 'tr'] as const).map((langCode) => (
                                <button
                                    key={langCode}
                                    onClick={() => setLanguage(langCode as Language)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                        language === langCode
                                            ? 'bg-teal-500 dark:bg-cyan-600 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {langCode.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Currency Selector (Rental Mode Only) */}
                    {mode === 'rental' && (
                        <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/50 pt-2">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                {t('nav.currency') || 'Currency'}
                            </span>
                            <div className="flex gap-1">
                                {(['USD', 'EUR', 'TRY'] as const).map((curr) => (
                                    <button
                                        key={curr}
                                        onClick={() => setCurrency(curr)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                            currency === curr
                                                ? 'bg-teal-500 dark:bg-cyan-600 text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/50 pt-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                            {t('nav.theme') || 'Theme'}
                        </span>
                        <button
                            onClick={toggleTheme}
                            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
