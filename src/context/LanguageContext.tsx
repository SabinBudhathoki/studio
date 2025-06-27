
'use client';

import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import en from '@/locales/en.json';
import ne from '@/locales/ne.json';

// Define the structure of your translations based on the English JSON file.
// This provides type safety and autocompletion.
type Translations = typeof en;

// A dictionary to hold the loaded translation files.
const translations: { [key: string]: Translations } = { en, ne };

// Define the shape of the context value.
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  // The `t` function takes a key of the translation file and an optional options object for interpolation.
  t: (key: keyof Translations, options?: { [key: string]: string | number }) => string;
}

// Create the context with an undefined initial value.
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// The provider component that will wrap the application.
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // State to hold the current language, defaulting to 'en'.
  const [language, setLanguageState] = useState('en');

  // On component mount, check for a language preference in localStorage.
  useEffect(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang && (storedLang === 'en' || storedLang === 'ne')) {
      setLanguageState(storedLang);
    }
  }, []);

  // Function to change the language and persist it to localStorage.
  const setLanguage = (lang: string) => {
    if (lang === 'en' || lang === 'ne') {
      localStorage.setItem('language', lang);
      setLanguageState(lang);
    }
  };

  // The translation function `t`.
  const t = (key: keyof Translations, options?: { [key: string]: string | number }): string => {
    // Get the string from the current language's translations, or fall back to English.
    let text = translations[language]?.[key] || translations['en'][key] || key;
    
    // Replace placeholders like `{{name}}` with values from the options object.
    if (options) {
      Object.keys(options).forEach(optKey => {
        text = text.replace(new RegExp(`{{${optKey}}}`, 'g'), String(options[optKey]));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to easily access the translation context.
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
