import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LANG_STORAGE_KEY = 'nesh_worker_lang';
const SUPPORTED = ['en', 'gu', 'hi'];
const LANG_LABELS = { en: 'EN', gu: 'ગુ', hi: 'हि' };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    // Immediate sync load from localStorage
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return (saved && SUPPORTED.includes(saved)) ? saved : 'en';
  });

  const setLang = useCallback((l) => {
    if (SUPPORTED.includes(l)) {
      localStorage.setItem(LANG_STORAGE_KEY, l);
      setLangState(l);
    }
  }, []);

  const cycleLang = useCallback(() => {
    setLang(SUPPORTED[(SUPPORTED.indexOf(lang) + 1) % SUPPORTED.length]);
  }, [lang, setLang]);

  const t = useCallback(
    (key, vars = {}) => {
      let str = translations[lang]?.[key] ?? translations.en[key] ?? key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
      return str;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, cycleLang, t, LANG_LABELS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be inside LanguageProvider');
  return ctx;
}
