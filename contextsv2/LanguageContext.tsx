
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { en } from '../localesv2/en';
import { zh } from '../localesv2/zh';

type Language = 'en' | 'cn';
type Translations = typeof en;

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, options?: Record<string, string | number>) => any;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const translations = language === 'en' ? en : zh;

  const t = (path: string, options?: Record<string, string | number>) => {
    const keys = path.split('.');
    let value: any = translations;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key as keyof typeof value];
      } else {
        return path; // Return key if not found
      }
    }
    
    if (typeof value === 'string' && options) {
      Object.keys(options).forEach(k => {
        value = value.replace(`{{${k}}}`, String(options[k]));
      });
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
