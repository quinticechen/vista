
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
        const checkInterval = setInterval(() => {
          const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (selectBox) {
            clearInterval(checkInterval);
            
            // Set language only if it's different from current
            if (selectBox.value !== savedLang) {
              selectBox.value = savedLang;
              selectBox.dispatchEvent(new Event('change'));
            }
          }
        }, 100);
        
        // Clear interval after 5 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    };

    // Apply language preference when component mounts
    applyLanguagePreference();
    
    // Also reapply when navigating between pages
    const handleRouteChange = () => {
      setTimeout(applyLanguagePreference, 200);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
};

export default useLanguagePreference;
