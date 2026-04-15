import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { zhTW } from './locales/zh-TW';

const STORAGE_KEY = 'i18nextLng';
const SUPPORTED_LANGUAGES = ['en', 'zh-TW'] as const;

function getInitialLanguage(): 'en' | 'zh-TW' {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'zh-TW') {
    return stored;
  }

  const browserLang = navigator.language;
  return browserLang.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-TW': { translation: zhTW },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
