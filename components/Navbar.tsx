import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, User, Globe, ChevronDown, Check, ShoppingCart, Heart, Sun, Moon, LogOut, Plus, Home, Car, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { Banknote } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { NotificationBell } from './ui/NotificationBell';

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
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 transition-colors supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <img src="/logo.png" alt="Alanya Holidays" className="w-10 h-10 object-contain relative z-10 rounded-full" />
            </div>
            <span className="font-serif text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight font-medium">
              Alanya<span className="text-teal-600 dark:text-teal-400">Holidays</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 relative bg-slate-50/50 dark:bg-slate-800/50 px-2 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <NavIndicator />
            <NavLink to="/stays" label={t('nav.stays')} />
            <NavLink to="/services" label={t('nav.services')} />
            <NavLink to="/shop" label={t('shop')} />
            <NavLink to="/zero-fees" label={t('value.zero_fees.title')} isAccent />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">

            {/* Utilities Group (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200 dark:border-slate-700/50">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-orange-500 dark:hover:text-yellow-400 transition-all shadow-sm hover:shadow"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

              {/* Currency */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                >
                  {currency}
                  <ChevronDown size={12} className={`opacity-50 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* ... Currency Dropdown (Same logic) ... */}
                {isCurrencyOpen && (
                  <div className="absolute top-full mt-2 right-0 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="py-1">
                      {(['USD', 'EUR', 'TRY'] as Currency[]).map((curr) => (
                        <button
                          key={curr}
                          onClick={() => handleCurrencySelect(curr)}
                          className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${currency === curr ? 'text-teal-600 bg-teal-50 dark:bg-teal-900/10' : 'text-slate-600 dark:text-slate-400'}`}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                >
                  <Globe size={14} className="opacity-70" />
                  <span className="uppercase">{language}</span>
                </button>
                {/* ... Lang Dropdown ... */}
                {isLangOpen && (
                  <div className="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
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
                          className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === l.code ? 'text-teal-600 bg-teal-50 dark:bg-teal-900/10' : 'text-slate-600 dark:text-slate-400'}`}
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

            {/* List Property CTA (Desktop) */}
            <div className="relative hidden md:block" ref={listMenuRef}>
              <button
                onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
              >
                <Plus size={16} className="text-teal-400" />
                <span>{t('nav.list_property')}</span>
              </button>
              {/* List Dropdown */}
              {isListMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-2 space-y-1">
                    <Link to="/list-property" onClick={() => setIsListMenuOpen(false)} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group">
                      <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-lg flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                        <Home size={20} />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">List a Property</span>
                        <span className="block text-xs text-slate-500 font-medium">Earn money as a host</span>
                      </div>
                    </Link>
                    <Link to="/add-service" onClick={() => setIsListMenuOpen(false)} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Car size={20} />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">List a Service</span>
                        <span className="block text-xs text-slate-500 font-medium">Cars, tours, and more</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-1 sm:gap-2 pl-2">

              <NotificationBell />

              <Link to="/favorites" className="p-2.5 rounded-full text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:text-slate-400 transition-all relative group hidden sm:block">
                <Heart size={20} />
                {favorites.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </Link>

              <button onClick={() => navigate('/checkout')} className="p-2.5 rounded-full text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 dark:text-slate-400 transition-all relative group">
                <ShoppingBag size={20} />
                {items.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>

              {/* Profile */}
              <div className="relative ml-1" ref={profileRef}>
                <button
                  onClick={() => isAuthenticated ? setIsProfileOpen(!isProfileOpen) : setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all active:scale-95 bg-white dark:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-900">
                    {isAuthenticated && user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <Menu size={14} className="text-slate-400" />
                  </div>
                </button>

                {/* Desktop Profile Dropdown */}
                {isAuthenticated && isProfileOpen && (
                  <div className="absolute top-full mt-3 right-0 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <User size={16} className="text-slate-400" />
                        {t('nav.profile')}
                      </Link>
                      <Link to="/host/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <LayoutDashboard size={16} className="text-teal-500" />
                        Host Dashboard
                      </Link>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                      <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
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
        <div className="absolute top-20 right-0 left-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-2xl p-4 flex flex-col gap-2 z-40 animate-in slide-in-from-top-10 duration-300 md:hidden">
          {/* ... Mobile Menu Content similar to simple one but cleaner ... */}
          {!isAuthenticated && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => { openLogin(); setIsMobileMenuOpen(false); }} className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-center">Login</button>
              <button onClick={() => { openRegister(); setIsMobileMenuOpen(false); }} className="py-2.5 rounded-xl bg-teal-600 text-white font-bold text-center">Register</button>
            </div>
          )}

          <div className="space-y-1">
            <Link to="/stays" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200">{t('nav.stays')}</Link>
            <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200">{t('nav.services')}</Link>
            <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200">{t('shop')}</Link>
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
      )}
    </nav>
  );
};