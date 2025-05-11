
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translateText, getCurrentLanguage, setCurrentLanguage, languages } from '@/services/translationService';
import { useToast } from './use-toast';

type TranslationContextType = {
  translate: (text: string) => Promise<string>;
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  languages: { code: string; name: string; flag: string }[];
  isInitialized: boolean;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLang] = useState(getCurrentLanguage());
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize with saved preference
    const savedLang = getCurrentLanguage();
    setCurrentLang(savedLang);
    setIsInitialized(true);
    
    // Listen for language changes
    const handleLanguageChanged = (event: CustomEvent) => {
      setCurrentLang(event.detail);
    };
    
    window.addEventListener('languageChanged', handleLanguageChanged as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged as EventListener);
    };
  }, []);
  
  const changeLanguage = (lang: string) => {
    if (lang === currentLanguage) return;
    
    setCurrentLang(lang);
    setCurrentLanguage(lang);
    
    toast({
      title: "Language Changed",
      description: `Switched to ${languages.find(l => l.code === lang)?.name || lang}`,
      duration: 2000
    });
  };
  
  const translate = async (text: string): Promise<string> => {
    if (currentLanguage === 'en' || !text) return text;
    return translateText(text, currentLanguage);
  };
  
  const value = {
    translate,
    currentLanguage,
    changeLanguage,
    languages,
    isInitialized
  };
  
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
