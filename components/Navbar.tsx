import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, User, Globe, ChevronDown, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage, Language } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { items } = useCart();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

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
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-tr-xl rounded-bl-xl group-hover:bg-primary-dark transition-colors"></div>
            <span className="font-serif text-2xl text-slate-900 tracking-tight">
              Alanya<span className="text-primary group-hover:text-primary-dark transition-colors">Holidays</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 hover:text-primary font-medium transition">{t('nav.stays')}</Link>
            <Link to="/transfers" className="text-slate-600 hover:text-primary font-medium transition">{t('nav.transfers')}</Link>
            <Link to="/experiences" className="text-slate-600 hover:text-primary font-medium transition">{t('nav.experiences')}</Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-1 font-medium text-sm transition-colors p-2 rounded-lg border border-transparent ${isLangOpen ? 'text-primary bg-slate-50 border-slate-200' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`}
              >
                <Globe size={16} />
                <span className="uppercase">{language}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleLanguageSelect('en')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${language === 'en' ? 'text-primary font-semibold bg-slate-50' : 'text-slate-700'}`}
                    >
                      English
                      {language === 'en' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('ru')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${language === 'ru' ? 'text-primary font-semibold bg-slate-50' : 'text-slate-700'}`}
                    >
                      Русский
                      {language === 'ru' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('tr')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${language === 'tr' ? 'text-primary font-semibold bg-slate-50' : 'text-slate-700'}`}
                    >
                      Türkçe
                      {language === 'tr' && <Check size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-800">
              {t('nav.list_property')}
            </button>

            <button
              onClick={() => navigate('/checkout')}
              className="relative p-2 text-slate-600 hover:text-primary transition"
            >
              <ShoppingBag size={24} />
              {items.length > 0 && (
                <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {items.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 border border-slate-200 rounded-full p-1 pl-3 hover:shadow-md transition cursor-pointer">
              <Menu size={18} className="text-slate-600" />
              <div className="bg-slate-800 text-white rounded-full p-1">
                <User size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};