
import { useEffect } from 'react';

/**
 * Custom hook to handle language preference persistence
 * - Loads saved preference on initial page load
 * - Handles restoring language preference after navigation
 */
export const useLanguagePreference = () => {
  useEffect(() => {
    // Function to apply the saved language preference
    const applyLanguagePreference = () => {
      const savedLang = localStorage.getItem('preferredLanguage');
      
      // If user has previously selected a language
      if (savedLang && savedLang !== 'en') {
        // Wait for Google Translate to initialize
        const maxAttempts = 20; // Try for 10 seconds (20 * 500ms)
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
          attempts++;
          const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          
          if (selectBox) {
            clearInterval(checkInterval);
            
            // Set language only if it's different from current
            if (selectBox.value !== savedLang) {
              selectBox.value = savedLang;
              selectBox.dispatchEvent(new Event('change'));
              console.log('Language preference applied:', savedLang);
            }
          }
          
          // Give up after max attempts
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Could not find Google Translate widget after multiple attempts');
          }
        }, 500);
      }
    };

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
    };
  }, []);
};

export default useLanguagePreference;
