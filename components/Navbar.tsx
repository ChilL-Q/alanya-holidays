import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, User, Globe, ChevronDown, Check, ShoppingCart, Heart, Sun, Moon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useTheme } from '../context/ThemeContext';

const NavLink: React.FC<{ to: string; label: string; isAccent?: boolean }> = ({ to, label, isAccent }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative px-1 py-2 font-medium transition-colors duration-300 ${isActive
          ? (isAccent ? 'text-accent' : 'text-slate-900 dark:text-white')
          : (isAccent ? 'text-accent hover:text-accent-hover' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary')
        }`}
      data-nav-link={to}
    >
      {label}
    </Link>
  );
};

const NavIndicator = () => {
  const location = useLocation();
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });

  useEffect(() => {
    const activeLink = document.querySelector(`[data-nav-link="${location.pathname}"]`) as HTMLElement;
    if (activeLink) {
      setStyle({
        left: activeLink.offsetLeft,
        width: activeLink.offsetWidth,
        opacity: 1,
      });
    } else {
      setStyle({ opacity: 0 });
    }
  }, [location.pathname]);

  return (
    <div
      className="absolute bottom-0 h-0.5 bg-primary dark:bg-primary rounded-full transition-all duration-300 ease-out z-10"
      style={style}
    />
  );
};

export const Navbar: React.FC = () => {
  const { items } = useCart();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openLogin, openRegister } = useModal();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setIsLangOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          <Link to="/" className="flex items-center gap-0 group">
            <img src="/logo.png" alt="Alanya Holidays" className="w-12 h-12 object-contain rounded-full" />
            <span className="font-serif text-2xl text-slate-900 dark:text-white tracking-tight">
              Alanya<span className="text-primary group-hover:text-primary-dark transition-colors">Holidays</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8 relative">
            <NavIndicator />
            <NavLink to="/stays" label={t('nav.stays')} />
            <NavLink to="/services" label={t('nav.services')} />
            <NavLink to="/zero-fees" label={t('value.zero_fees.title')} isAccent />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative hidden sm:block" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-1 font-medium text-sm transition-colors p-2 rounded-lg border border-transparent ${isLangOpen ? 'text-primary bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Globe size={16} />
                <span className="uppercase">{language}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleLanguageSelect('en')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'en' ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      English
                      {language === 'en' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('ru')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'ru' ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      Русский
                      {language === 'ru' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('tr')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'tr' ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      Türkçe
                      {language === 'tr' && <Check size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="hidden sm:block text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              {t('nav.list_property')}
            </button>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4 pl-0 md:pl-8 border-l border-slate-100 dark:border-slate-800">
              <Link to="/favorites" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors hidden md:block relative group">
                <Heart size={20} />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Favorites
                </span>
              </Link>

              <button
                onClick={() => navigate('/checkout')}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:text-primary transition-colors relative"
              >
                <ShoppingCart size={20} />
                {items.length > 0 && (
                  <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {items.length}
                  </span>
                )}
              </button>
            </div>

            <div
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-full p-1 pl-3 hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative"
            >
              <Menu size={18} className="text-slate-600 dark:text-slate-300" />
              <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-full p-1">
                <User size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 right-4 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 p-2 flex flex-col gap-1 z-50">
          <Link
            to="/favorites"
            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-left flex items-center justify-between"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="flex items-center gap-2">
              <Heart size={18} />
              Favorites
            </span>
          </Link>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
          <button
            onClick={() => {
              openLogin();
              setIsMobileMenuOpen(false);
            }}
            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium text-left"
          >
            {t('nav.login')}
          </button>
          <button
            onClick={() => {
              openRegister();
              setIsMobileMenuOpen(false);
            }}
            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium text-left"
          >
            {t('nav.signup')}
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

          <Link
            to="/stays"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            {t('nav.stays')}
          </Link>
          <Link
            to="/services"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            {t('nav.services')}
          </Link>
          <Link
            to="/zero-fees"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-accent font-medium"
          >
            {t('value.zero_fees.title')}
          </Link>

          <div className="md:hidden h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

          <button className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-left text-sm font-medium">
            {t('nav.list_property')}
          </button>

          {/* Mobile Language Switcher */}
          <div className="px-4 py-3 sm:hidden">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-semibold tracking-wider">LANGUAGE</p>
            <div className="flex gap-2">
              <button onClick={() => setLanguage('en')} className={`text-sm font-medium ${language === 'en' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>EN</button>
              <button onClick={() => setLanguage('ru')} className={`text-sm font-medium ${language === 'ru' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>RU</button>
              <button onClick={() => setLanguage('tr')} className={`text-sm font-medium ${language === 'tr' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>TR</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};