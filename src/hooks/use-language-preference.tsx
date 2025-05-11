
import { useEffect } from 'react';
import { useToast } from './use-toast';

/**
 * Custom hook to handle language preference persistence
 * - Loads saved preference on initial page load
 * - Handles restoring language preference after navigation
 */
export const useLanguagePreference = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    // Function to apply the saved language preference
    const applyLanguagePreference = () => {
      const savedLang = localStorage.getItem('preferredLanguage');
      
      // If user has previously selected a language
      if (savedLang && savedLang !== 'en') {
        console.log('Applying saved language preference:', savedLang);
        
        // Check if Google Translate is initialized via global flag
        if (window.googleTranslateInitialized) {
          applyTranslation(savedLang);
          return;
        }
        
        // Wait for Google Translate to initialize
        const maxAttempts = 30; // Try for 15 seconds (30 * 500ms)
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
          attempts++;
          
          if (window.googleTranslateInitialized) {
            clearInterval(checkInterval);
            applyTranslation(savedLang);
            return;
          }
          
          const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          
          if (selectBox) {
            clearInterval(checkInterval);
            applyTranslation(savedLang);
            return;
          }
          
          // Give up after max attempts
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Could not find Google Translate widget after multiple attempts');
            
            // Only show toast on first page load
            if (attempts === maxAttempts) {
              toast({
                title: "Translation Widget Not Found",
                description: "Please refresh the page to enable language switching",
                variant: "destructive",
                duration: 5000
              });
            }
          }
        }, 500);
      }
    };
    
    // Helper function to apply translation once widget is found
    const applyTranslation = (lang: string) => {
      const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      
      if (selectBox) {
        // Set language only if it's different from current
        if (selectBox.value !== lang) {
          console.log('Applying language:', lang);
          selectBox.value = lang;
          selectBox.dispatchEvent(new Event('change'));
          console.log('Language preference applied:', lang);
        }
      } else {
        console.warn('Google Translate combo box not found');
      }
    };

    // Listen for Google Translate ready event
    const handleTranslateReady = () => {
      console.log('Google Translate ready event received in hook');
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang && savedLang !== 'en') {
        setTimeout(() => applyTranslation(savedLang), 500);
      }
    };
    
    window.addEventListener('googleTranslateReady', handleTranslateReady);
    
    // Apply language preference when component mounts
    // Small delay to ensure Google Translate has initialized
    setTimeout(applyLanguagePreference, 1000);
    
    // Also reapply when navigating between pages
    const handleRouteChange = () => {
      setTimeout(applyLanguagePreference, 1000);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('googleTranslateReady', handleTranslateReady);
    };
  }, [toast]);
};

// Add or extend the Window interface for TypeScript
declare global {
  interface Window {
    googleTranslateInitialized?: boolean;
  }
}

export default useLanguagePreference;
