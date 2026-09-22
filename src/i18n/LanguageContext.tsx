import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language, type TranslationKey } from './translations';
import { speechService } from '../services/speechService';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Arabic is primary default
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('midmar_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('midmar_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';

    // Configure Web Speech API language
    speechService.setLang(language === 'ar' ? 'ar-SA' : 'en-US');
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.ar;
    return dict[key] || translations.ar[key] || (key as string);
  };

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, isRTL, dir, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
