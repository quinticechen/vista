
import { useState, useEffect } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Language = {
  code: string;
  name: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

// Helper function to get current Google Translate language
const getCurrentLanguage = (): string => {
  // Check for Google Translate cookie
  const match = document.cookie.match(/(^|;)\s*googtrans=([^;]*)/);
  if (match) {
    try {
      // Cookie format is like "/en/fr"
      const langPair = decodeURIComponent(match[2]).split('/');
      return langPair[2]; // Target language
    } catch (e) {
      console.error('Error parsing Google Translate cookie:', e);
    }
  }
  
  // Check localStorage as fallback
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang) return savedLang;
  
  return 'en'; // Default to English
};

const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const { toast } = useToast();
  
  // Initialize and update current language
  useEffect(() => {
    let intervalId: number;
    let timeoutId: number;
    
    // Function to check if Google Translate widget is ready
    const checkForTranslateWidget = () => {
      console.log('Looking for Google Translate widget...');
      // Check for the global flag first
      if (window.googleTranslateInitialized) {
        console.log('Google Translate initialized via global flag');
        setIsWidgetReady(true);
        const lang = getCurrentLanguage();
        setCurrentLang(lang);
        return true;
      }
      
      // Then look for the element
      const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectBox) {
        console.log('Google Translate widget found via DOM element');
        setIsWidgetReady(true);
        const lang = getCurrentLanguage();
        setCurrentLang(lang);
        return true;
      }
      
      return false;
    };

    // Listen for the custom event from index.html
    const handleTranslateReady = () => {
      console.log('Google Translate ready event received');
      if (checkForTranslateWidget()) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      }
    };
    
    window.addEventListener('googleTranslateReady', handleTranslateReady);

    // Try immediately
    if (!checkForTranslateWidget()) {
      // If not ready, set up an interval to check
      console.log('Setting up polling for Google Translate widget');
      intervalId = window.setInterval(() => {
        if (checkForTranslateWidget()) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      }, 500);
      
      // Clear interval after 15 seconds to prevent infinite checking
      timeoutId = window.setTimeout(() => {
        clearInterval(intervalId);
        console.warn('Google Translate widget not found after 15 seconds');
        toast({
          title: "Translation Widget Not Found",
          description: "Please refresh the page to try again",
          variant: "destructive",
          duration: 5000
        });
      }, 15000);
    }
    
    // Set up a mutation observer to detect when Google Translate widget changes the page
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        setCurrentLang(getCurrentLanguage());
      }, 100);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      observer.disconnect();
      window.removeEventListener('googleTranslateReady', handleTranslateReady);
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [toast]);
  
  // Manual initialization function for the Google Translate widget
  const initializeTranslateWidget = () => {
    // Check if the Google Translate script is already loaded
    if (typeof window.google === 'undefined' || typeof window.google.translate === 'undefined') {
      console.log('Google Translate not loaded, injecting script');
      
      // Create and inject Google Translate script
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
      
      // Define callback function
      window.googleTranslateElementInit = function() {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,zh-TW,ja,ko,es,de,fr,it,th,vi',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          }, 
          'google_translate_element'
        );
        setIsWidgetReady(true);
        console.log('Google Translate manually initialized');
        
        // Signal that translation is initialized
        window.googleTranslateInitialized = true;
        
        // Dispatch event
        window.dispatchEvent(new Event('googleTranslateReady'));
      };
    } else if (!document.querySelector('.goog-te-combo')) {
      console.log('Google Translate loaded but widget not initialized, initializing now');
      
      // If script is loaded but widget isn't initialized
      window.googleTranslateElementInit();
    }
  };
  
  // Change language function
  const changeLanguage = (langCode: string) => {
    if (typeof window === 'undefined') return;
    
    // Save user preference
    localStorage.setItem('preferredLanguage', langCode);
    
    // Try to find the Google Translate select element
    const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    
    if (selectBox) {
      console.log('Changing language to:', langCode);
      selectBox.value = langCode;
      selectBox.dispatchEvent(new Event('change'));
      setCurrentLang(langCode);
      
      // Show success toast
      toast({
        title: "Language Changed",
        description: `Switched to ${languages.find(l => l.code === langCode)?.name || langCode}`,
        duration: 2000
      });
    } else {
      console.error('Google Translate widget not found');
      
      // Try to initialize the widget
      initializeTranslateWidget();
      
      // Show error toast
      toast({
        title: "Language Change Failed",
        description: "Initializing translation widget. Please try again in a moment.",
        variant: "destructive",
        duration: 3000
      });
      
      // Retry after a delay to allow initialization
      setTimeout(() => {
        const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectBox) {
          selectBox.value = langCode;
          selectBox.dispatchEvent(new Event('change'));
          setCurrentLang(langCode);
          toast({
            title: "Language Changed",
            description: `Switched to ${languages.find(l => l.code === langCode)?.name || langCode}`,
            duration: 2000
          });
        }
      }, 2000);
    }
  };
  
  // Initialize widget if not ready
  if (!isWidgetReady) {
    // Add a button to manually initialize
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 gap-1" 
        onClick={initializeTranslateWidget}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline-block">Initialize Translate</span>
      </Button>
    );
  }
  
  // Get current language object
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {currentLanguage.flag} {currentLanguage.name}
          </span>
          <span className="inline-block sm:hidden">
            {currentLanguage.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`flex items-center gap-2 ${currentLang === lang.code ? 'bg-accent' : ''}`}
            onClick={() => changeLanguage(lang.code)}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Add global type declaration for the window object
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    googleTranslateInitialized?: boolean;
    google: {
      translate: {
        TranslateElement: {
          InlineLayout: {
            SIMPLE: number;
            HORIZONTAL: number;
            VERTICAL: number;
          };
          new (options: any, element: string): any;
        };
      };
    };
  }
}

export default LanguageSwitcher;
