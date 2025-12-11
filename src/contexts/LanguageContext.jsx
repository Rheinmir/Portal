import React, { createContext, useState, useContext, useEffect } from 'react';
import vn from '../locales/vn.json';
import en from '../locales/en.json';
import de from '../locales/de.json';
import kz from '../locales/kz.json';
import ka from '../locales/ka.json';
import ru from '../locales/ru.json';

const LanguageContext = createContext();

const resources = { vn, en, de, kz, ka, ru };

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
