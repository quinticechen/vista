
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from '@/hooks/use-translation'; // Using the existing translation hook

type I18nContextType = {
  t: (key: string, options?: any) => string;
  i18n: {
    language: string;
    changeLanguage: (lang: string) => void;
  };
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const translation = useTranslation();
  
  const t = (key: string, options?: any): string => {
    // Simple translation function that uses the existing translation hook
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];
    
    // For now, just return the key's last part as a fallback
    return lastPart;
  };
  
  const value = {
    t,
    i18n: {
      language: translation.currentLanguage,
      changeLanguage: translation.changeLanguage
    }
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    // Fallback if no provider is found
    return {
      t: (key: string) => {
        const parts = key.split('.');
        return parts[parts.length - 1];
      },
      i18n: {
        language: 'en',
        changeLanguage: () => {}
      }
    };
  }
  return context;
};
