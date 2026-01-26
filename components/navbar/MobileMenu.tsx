import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const { openLogin, openRegister } = useModal();

    if (!isOpen) return null;

    return (
        <div className="absolute top-20 right-0 left-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-2xl p-4 flex flex-col gap-2 z-40 animate-in slide-in-from-top-10 duration-300 md:hidden">
            {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button onClick={() => { openLogin(); onClose(); }} className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-center">Login</button>
                    <button onClick={() => { openRegister(); onClose(); }} className="py-2.5 rounded-xl bg-teal-600 text-white font-bold text-center">Register</button>
                </div>
            )}

            <div className="space-y-1">
                <Link to="/stays" onClick={onClose} className="block px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200">{t('nav.stays')}</Link>
                <Link to="/services" onClick={onClose} className="block px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200">{t('nav.services')}</Link>
                <Link to="/shop" onClick={onClose} className="block px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200">{t('shop')}</Link>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

            <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Theme</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => theme === 'dark' && toggleTheme()} className={`p-1.5 rounded ${theme === 'light' ? 'bg-white shadow text-orange-500' : 'text-slate-400'}`}><Sun size={16} /></button>
                    <button onClick={() => theme === 'light' && toggleTheme()} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-slate-700 shadow text-white' : 'text-slate-400'}`}><Moon size={16} /></button>
                </div>
            </div>
        </div>
    );
};
