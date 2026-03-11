import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Globe, ChevronDown, Check, Home, Car, LogOut, User, LayoutDashboard, Heart, Banknote, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { useCurrency, Currency } from '../../context/CurrencyContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const { currency, setCurrency } = useCurrency();
    const { openLogin, openRegister } = useModal();

    const [expandedSection, setExpandedSection] = useState<'lang' | 'curr' | null>(null);

    if (!isOpen) return null;

    return (
        <div className="absolute top-20 right-0 left-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50 shadow-2xl p-4 flex flex-col gap-4 z-40 animate-in slide-in-from-top-10 duration-300 md:hidden max-h-[85vh] overflow-y-auto">

            {/* Auth Section */}
            {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { openLogin(); onClose(); }} className="py-3 rounded-xl border border-slate-200 dark:border-slate-800/50 text-slate-900 dark:text-white font-bold text-center hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-colors">{t('nav.login')}</button>
                    <button onClick={() => { openRegister(); onClose(); }} className="py-3 rounded-xl bg-teal-600 dark:bg-cyan-600 text-white font-bold text-center hover:bg-teal-700 dark:bg-cyan-600 transition-colors">{t('nav.signup')}</button>
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800/50 overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={24} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-1">
                {/* Main Nav */}
                <Link to="/stays" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                    <Home size={18} className="text-slate-400" />
                    {t('nav.stays')}
                </Link>
                <Link to="/services" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                    <Car size={18} className="text-slate-400" />
                    {t('nav.services')}
                </Link>
                <Link to="/shop" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                    <ShoppingBag size={18} className="text-slate-400" />
                    {t('shop')}
                </Link>
                <Link to="/zero-fees" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-bold text-teal-600 dark:text-cyan-400 dark:text-slate-200 bg-teal-50/50 dark:bg-slate-800/50">
                    <Banknote size={18} />
                    {t('value.zero_fees.title')}
                </Link>
                <Link to="/list-property" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                    <Home size={18} className="text-slate-400" />
                    {t('profile.become_host_title')}
                </Link>

                {/* User Links (if auth) */}
                {isAuthenticated && (
                    <>
                        <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2 mx-4"></div>
                        <Link to="/favorites" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                            <Heart size={18} className="text-slate-400" />
                            {t('nav.favorites')}
                        </Link>
                        <Link to="/profile" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                            <User size={18} className="text-slate-400" />
                            {t('nav.profile')}
                        </Link>
                        {user?.role === 'admin' && (
                            <Link to="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                                <LayoutDashboard size={18} className="text-purple-600" />
                                {t('nav.admin_panel')}
                            </Link>
                        )}
                        {(user?.role === 'host' || user?.role === 'admin') && (
                            <Link to="/host/dashboard" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 font-medium text-slate-700 dark:text-slate-200">
                                <LayoutDashboard size={18} className="text-teal-500 dark:text-cyan-400 " />
                                {t('nav.host_dashboard')}
                            </Link>
                        )}
                    </>
                )}
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800/80"></div>

            {/* Listing CTA */}
            <div className="flex gap-2">
                <Link to="/list-property" onClick={onClose} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex flex-col items-center justify-center gap-2 text-center group active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800/50 rounded-full flex items-center justify-center text-teal-600 dark:text-cyan-400 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <Home size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('nav.list_property')}</span>
                </Link>
                <Link to="/add-service" onClick={onClose} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex flex-col items-center justify-center gap-2 text-center group active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800/50 rounded-full flex items-center justify-center text-purple-600 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <Car size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('nav.list_service')}</span>
                </Link>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800/80"></div>

            {/* Settings (Theme, Lang, Currency) */}
            <div className="space-y-3">
                {/* Theme */}
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('nav.theme')}</span>
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1">
                        <button onClick={() => theme === 'dark' && toggleTheme()} className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow text-orange-500' : 'text-slate-400'}`}><Sun size={18} /></button>
                        <button onClick={() => theme === 'light' && toggleTheme()} className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-600 shadow text-white' : 'text-slate-400'}`}><Moon size={18} /></button>
                    </div>
                </div>

                {/* Currency */}
                <div className="flex flex-col gap-2">
                    <button onClick={() => setExpandedSection(expandedSection === 'curr' ? null : 'curr')} className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('nav.currency')}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{currency}</span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSection === 'curr' ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                    {expandedSection === 'curr' && (
                        <div className="grid grid-cols-3 gap-2 px-2 animate-fade-in">
                            {(['USD', 'EUR', 'TRY'] as Currency[]).map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => { setCurrency(curr); setExpandedSection(null); }}
                                    className={`py-2 rounded-lg text-sm font-medium border ${currency === curr ? 'bg-teal-50 dark:bg-slate-800/50 border-teal-200 dark:border-slate-700/50 text-teal-700 dark:text-cyan-400 dark:text-slate-200' : 'border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400'}`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Language */}
                <div className="flex flex-col gap-2">
                    <button onClick={() => setExpandedSection(expandedSection === 'lang' ? null : 'lang')} className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('nav.language')}</span>
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">{language}</span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSection === 'lang' ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                    {expandedSection === 'lang' && (
                        <div className="grid grid-cols-2 gap-2 px-2 animate-fade-in">
                            {[
                                { code: 'en', label: 'English' },
                                { code: 'ru', label: 'Русский' },
                                { code: 'tr', label: 'Türkçe' },
                                { code: 'ar', label: 'العربية' }
                            ].map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => { setLanguage(l.code as Language); setExpandedSection(null); }}
                                    className={`py-2 px-3 text-left rounded-lg text-sm font-medium border ${language === l.code ? 'bg-teal-50 dark:bg-slate-800/50 border-teal-200 dark:border-slate-700/50 text-teal-700 dark:text-cyan-400 dark:text-slate-200' : 'border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400'}`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isAuthenticated && (
                <>
                    <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2"></div>
                    <button onClick={() => { logout(); onClose(); }} className="flex items-center justify-center gap-2 w-full py-3 text-rose-500 font-medium bg-rose-50 dark:bg-rose-900/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors">
                        <LogOut size={18} />
                        {t('auth.logout')}
                    </button>
                </>
            )}

        </div>
    );
};
