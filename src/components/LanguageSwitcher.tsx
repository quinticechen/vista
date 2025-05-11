
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
    // Function to check if Google Translate widget is ready
    const checkForTranslateWidget = () => {
      const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectBox) {
        setIsWidgetReady(true);
        const lang = getCurrentLanguage();
        setCurrentLang(lang);
        return true;
      }
      return false;
    };

    // Try immediately
    if (!checkForTranslateWidget()) {
      // If not ready, set up an interval to check
      const intervalId = setInterval(() => {
        if (checkForTranslateWidget()) {
          clearInterval(intervalId);
        }
      }, 500);
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(intervalId), 10000);
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
    
    return () => observer.disconnect();
  }, []);
  
  // Change language function
  const changeLanguage = (langCode: string) => {
    if (typeof window === 'undefined') return;
    
    // Save user preference
    localStorage.setItem('preferredLanguage', langCode);
    
    // Try to find the Google Translate select element
    const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    
    if (selectBox) {
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
      
      // Show error toast
      toast({
        title: "Language Change Failed",
        description: "Could not find the translation widget. Please try again later.",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
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

export default LanguageSwitcher;
