import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import messages from './local/index';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'tr'],
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'alanya-language',
      caches: ['localStorage'],
    },
    debug: false,
    resources: messages,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
