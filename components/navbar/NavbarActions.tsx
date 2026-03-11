import React, { useRef, useState } from 'react';
import { Sun, Moon, ChevronDown, Check, Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency, Currency } from '../../context/CurrencyContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useClickOutside } from '../../hooks/useClickOutside';

export const NavbarActions: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { currency, setCurrency } = useCurrency();
    const { language, setLanguage } = useLanguage();

    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);

    const currencyRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    useClickOutside(currencyRef, () => setIsCurrencyOpen(false));
    useClickOutside(langRef, () => setIsLangOpen(false));

    const handleCurrencySelect = (curr: Currency) => {
        setCurrency(curr);
        setIsCurrencyOpen(false);
    };

    const handleLanguageSelect = (lang: Language) => {
        setLanguage(lang);
        setIsLangOpen(false);
    };

    return (
        <div className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-800/50">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700/80 hover:text-orange-500 dark:hover:text-yellow-400 transition-all shadow-sm hover:shadow"
            >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800/50 mx-1"></div>

            {/* Currency */}
            <div className="relative" ref={currencyRef}>
                <button
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/80 transition-all shadow-sm hover:shadow border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                >
                    {currency}
                    <ChevronDown size={12} className={`opacity-50 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCurrencyOpen && (
                    <div className="absolute top-full mt-2 right-0 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="py-1">
                            {(['USD', 'EUR', 'TRY'] as Currency[]).map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => handleCurrencySelect(curr)}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-colors flex items-center justify-between ${currency === curr ? 'text-teal-600 dark:text-cyan-400 bg-teal-50 dark:bg-slate-800/50' : 'text-slate-600 dark:text-slate-400'}`}
                                >
                                    {curr}
                                    {currency === curr && <Check size={12} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Language */}
            <div className="relative" ref={langRef}>
                <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/80 transition-all shadow-sm hover:shadow border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                >
                    <Globe size={14} className="opacity-70" />
                    <span className="uppercase">{language}</span>
                </button>
                {isLangOpen && (
                    <div className="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="py-1">
                            {[
                                { code: 'en', label: 'English' },
                                { code: 'ru', label: 'Русский' },
                                { code: 'tr', label: 'Türkçe' },
                                { code: 'ar', label: 'العربية' }
                            ].map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => handleLanguageSelect(l.code as Language)}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-colors flex items-center justify-between ${language === l.code ? 'text-teal-600 dark:text-cyan-400 bg-teal-50 dark:bg-slate-800/50' : 'text-slate-600 dark:text-slate-400'}`}
                                >
                                    {l.label}
                                    {language === l.code && <Check size={12} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
