import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { en as enLocale } from '../locales/en';

export type Language = 'en' | 'ru' | 'tr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const localeLoaders: Record<Language, () => Promise<Record<string, string>>> = {
  en: () => Promise.resolve(enLocale),
  ru: () => import('../locales/ru').then(m => m.ru),
  tr: () => import('../locales/tr').then(m => m.tr),
  ar: () => import('../locales/ar').then(m => m.ar),
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (['en', 'ru', 'tr', 'ar'].includes(saved as string)) return saved as Language;
    return 'en';
  });
  const [translations, setTranslations] = useState<Record<string, string>>(() => enLocale);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  useEffect(() => {
    let cancelled = false;
    localeLoaders[language]()
      .then((loaded) => {
        if (!cancelled) setTranslations(loaded);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load locale:', language, error);
          // Keep previous translations as fallback; if first load fails, use empty
          // object so the app renders (raw keys instead of infinite spinner)
          setTranslations(prev => prev ?? {});
        }
      });
    return () => { cancelled = true; };
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (language === 'ar') {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replaceAll(`{${paramKey}}`, String(paramValue));
      });
    }
    return text;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};