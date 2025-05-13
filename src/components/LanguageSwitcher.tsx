
import { useState, useEffect } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, languages, isInitialized } = useTranslation();
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(["en"]);
  
  useEffect(() => {
    // Load supported languages from local storage
    const saved = localStorage.getItem("supportedLanguages");
    if (saved) {
      setSupportedLanguages(JSON.parse(saved));
    }
  }, []);
  
  // If only one language is supported and it's the current language, don't show the switcher
  if (supportedLanguages.length <= 1) {
    return null;
  }
  
  if (!isInitialized) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-beige-300 hover:text-white">
        <Globe className="h-4 w-4 animate-spin" />
        <span className="sr-only">Loading language options</span>
      </Button>
    );
  }
  
  // Filter languages to only show supported ones
  const filteredLanguages = languages.filter(lang => 
    supportedLanguages.includes(lang.code)
  );
  
  // Get current language object
  const currentLanguageObj = filteredLanguages.find(lang => 
    lang.code === currentLanguage
  ) || filteredLanguages[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-beige-300 hover:text-white">
          <Globe className="h-4 w-4" />
          <span>
            {currentLanguageObj.flag} {currentLanguageObj.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {filteredLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`flex items-center gap-2 ${currentLanguage === lang.code ? 'bg-accent' : ''}`}
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
