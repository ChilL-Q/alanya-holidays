import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, User, Globe, ChevronDown, Check, ShoppingCart, Heart, Sun, Moon, LogOut, Plus, Home, Car } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { Banknote } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

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
      className="absolute bottom-0 h-0.5 bg-primary dark:bg-accent rounded-full transition-all duration-300 ease-out z-10"
      style={style}
    />
  );
};

export const Navbar: React.FC = () => {
  const { items } = useCart();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { openLogin, openRegister } = useModal();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (listMenuRef.current && !listMenuRef.current.contains(event.target as Node)) {
        setIsListMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setIsLangOpen(false);
  };

  const handleCurrencySelect = (curr: Currency) => {
    setCurrency(curr);
    setIsCurrencyOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          <Link to="/" className="flex items-center gap-0 group">
            <img src="/logo.png" alt="Alanya Holidays" className="w-12 h-12 object-contain rounded-full" />
            <span className="font-serif text-2xl text-slate-900 dark:text-white tracking-tight">
              Alanya<span className="text-primary dark:text-accent group-hover:text-primary-dark transition-colors">Holidays</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8 relative">
            <NavIndicator />
            <NavLink to="/stays" label={t('nav.stays')} />
            <NavLink to="/services" label={t('nav.services')} />
            <NavLink to="/shop" label={t('shop')} />
            <NavLink to="/zero-fees" label={t('value.zero_fees.title')} isAccent />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative hidden sm:block" ref={currencyRef}>
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className={`flex items-center gap-1 font-medium text-sm transition-colors p-2 rounded-lg border border-transparent ${isCurrencyOpen ? 'text-primary bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <Banknote size={16} />
                <span className="uppercase">{currency}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="py-1">
                    {(['USD', 'EUR', 'TRY'] as Currency[]).map((curr) => (
                      <button
                        key={curr}
                        onClick={() => handleCurrencySelect(curr)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${currency === curr ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        {curr}
                        {currency === curr && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative hidden sm:block" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-1 font-medium text-sm transition-colors p-2 rounded-lg border border-transparent ${isLangOpen ? 'text-primary bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
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
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'en' ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      English
                      {language === 'en' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('ru')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'ru' ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      Русский
                      {language === 'ru' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('tr')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'tr' ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      Türkçe
                      {language === 'tr' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('ar')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'ar' ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      العربية
                      {language === 'ar' && <Check size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative hidden sm:block" ref={listMenuRef}>
              <button
                onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2"
              >
                {t('nav.list_property')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isListMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isListMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-2">
                    <Link
                      to="/list-property"
                      onClick={() => setIsListMenuOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-lg">
                        <Home size={18} />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t('nav.list_property')}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{t('nav.list_desc')}</span>
                      </div>
                    </Link>
                    <Link
                      to="/add-service"
                      onClick={() => setIsListMenuOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                        <Car size={18} />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t('nav.list_service')}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{t('nav.service_desc')}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4 pl-0 md:pl-8 border-l border-slate-100 dark:border-slate-800">
              <Link to="/favorites" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors hidden md:block relative group">
                <Heart size={20} />
                {favorites.length > 0 && (
                  <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {favorites.length}
                  </span>
                )}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {t('nav.favorites')}
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

              <div className="relative" ref={profileRef}>
                <div
                  onClick={() => isAuthenticated ? setIsProfileOpen(!isProfileOpen) : setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-full p-1 pl-3 hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative"
                >
                  <Menu size={18} className="text-slate-600 dark:text-slate-300" />
                  <div className="text-white rounded-full p-1 w-8 h-8 flex items-center justify-center overflow-hidden">
                    {isAuthenticated && user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                </div>

                {isAuthenticated && isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                      >
                        <User size={16} />
                        {t('nav.profile')}
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 right-4 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 p-2 flex flex-col gap-1 z-50">
          {!isAuthenticated && (
            <>
              <button
                onClick={() => {
                  openLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium text-left"
              >
                {t('auth.submit.login')}
              </button>
              <button
                onClick={() => {
                  openRegister();
                  setIsMobileMenuOpen(false);
                }}
                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium text-left"
              >
                {t('auth.submit.register')}
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
            </>
          )}

          <Link
            to="/favorites"
            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-left flex items-center justify-between"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="flex items-center gap-2">
              <Heart size={18} />
              {t('nav.favorites')}
            </span>
          </Link>

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
            to="/shop"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            {t('shop')}
          </Link>
          <Link
            to="/zero-fees"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-accent font-medium"
          >
            {t('value.zero_fees.title')}
          </Link>

          <div className="md:hidden h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

          <Link
            to="/list-property"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-sm font-medium"
          >
            {t('nav.list_property')}
          </Link>

          {/* Mobile Language Switcher */}
          <div className="px-4 py-3 sm:hidden">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-semibold tracking-wider">{t('nav.language')}</p>
            <div className="flex gap-2">
              <button onClick={() => setLanguage('en')} className={`text-sm font-medium ${language === 'en' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>EN</button>
              <button onClick={() => setLanguage('ru')} className={`text-sm font-medium ${language === 'ru' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>RU</button>
              <button onClick={() => setLanguage('tr')} className={`text-sm font-medium ${language === 'tr' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>TR</button>
              <button onClick={() => setLanguage('ar')} className={`text-sm font-medium ${language === 'ar' ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>AR</button>
            </div>
          </div>

          {/* Mobile Currency Switcher */}
          <div className="px-4 py-3 sm:hidden pt-0">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-semibold tracking-wider">{t('nav.currency')}</p>
            <div className="flex gap-2">
              {(['USD', 'EUR', 'TRY'] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`text-sm font-medium ${currency === curr ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};