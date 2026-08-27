import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Cookies from 'js-cookie';

import enTranslations from './locales/en/translation.json';
import thTranslations from './locales/th/translation.json';

const resources = {
  en: {
    translation: enTranslations
  },
  th: {
    translation: thTranslations
  }
};

const savedLanguage = Cookies.get('language') || 'th';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
