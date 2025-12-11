import React, { createContext, useState, useContext, useEffect } from 'react';
import vn from '../locales/vn.json';
import en from '../locales/en.json';
import de from '../locales/de.json';

const LanguageContext = createContext();

const resources = { vn, en, de };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'vn');

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const t = (key) => {
    return resources[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
