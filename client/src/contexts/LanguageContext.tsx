import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  getLanguageLabel: (language: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
  };

  const getLanguageLabel = (language: string) => {
    switch (language) {
      case 'en':
        return 'English';
      case 'ja':
        return '日本語';
      case 'jaSimple':
        return 'かんたんな、にほんご';
      default:
        return '日本語';
    }
  };

  // 初期化時にローカルストレージから言語設定を読み込み
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['en', 'ja', 'jaSimple'].includes(savedLanguage)) {
      changeLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      getLanguageLabel,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}; 