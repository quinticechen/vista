
import { useState, useEffect } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

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
  return 'en'; // Default to English
};

const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState<string>('en');
  
  // Initialize and update current language
  useEffect(() => {
    const updateLanguageState = () => {
      const lang = getCurrentLanguage();
      setCurrentLang(lang);
    };
    
    // Initial check
    updateLanguageState();
    
    // Set up a mutation observer to detect when Google Translate widget changes the page
    const observer = new MutationObserver(() => {
      setTimeout(updateLanguageState, 100);
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
    
    // Update Google Translate widget
    const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectBox) {
      selectBox.value = langCode;
      selectBox.dispatchEvent(new Event('change'));
      setCurrentLang(langCode);
    } else {
      console.error('Google Translate widget not found');
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
