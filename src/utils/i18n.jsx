import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from './translations';
import { supabase } from './supabase';
import { fetchSettings, updateSetting } from './db';

const LANG_KEY = 'language_pref';
const SUPPORTED = ['en', 'gu', 'hi'];
const LANG_LABELS = { en: 'EN', gu: 'ગુ', hi: 'हि' };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  // Load initial settings
  useEffect(() => {
    const load = async () => {
      const settings = await fetchSettings();
      if (settings[LANG_KEY] && SUPPORTED.includes(settings[LANG_KEY])) {
        setLangState(settings[LANG_KEY]);
      }
    };
    load();

    // Listen for real-time changes to settings
    const channel = supabase
      .channel('settings-rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: `key=eq.${LANG_KEY}` }, (payload) => {
        if (payload.new && SUPPORTED.includes(payload.new.value)) {
          setLangState(payload.new.value);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const setLang = useCallback(async (l) => {
    try {
      await updateSetting(LANG_KEY, l);
      setLangState(l);
    } catch (err) {
      console.error('Failed to update language setting:', err);
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
