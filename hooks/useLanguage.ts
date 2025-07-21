
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { translations, Language, TranslationKey } from '../lib/i18n';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
  dir: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('app-lang') as Language;
        if (storedLang && (storedLang === 'en' || storedLang === 'fa')) {
            return storedLang;
        }
        const browserLang = navigator.language.split('-')[0];
        return browserLang === 'fa' ? 'fa' : 'en';
    }
    return 'en';
};


export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };
  
  const dir: 'ltr' | 'rtl' = lang === 'fa' ? 'rtl' : 'ltr';
  
  const t = useCallback((key: TranslationKey, replacements?: Record<string, string>): string => {
    let translation = translations[lang][key] || translations['en'][key];
    if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation.replace(`{{${placeholder}}}`, value);
        });
    }
    return translation;
  }, [lang]);

  const value = { lang, setLang, t, dir };

  return React.createElement(LanguageContext.Provider, { value }, children);
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
