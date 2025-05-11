
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
  
  if (!isInitialized) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <Globe className="h-4 w-4 animate-spin" />
        <span className="sr-only">Loading language options</span>
      </Button>
    );
  }
  
  // Get current language object
  const currentLanguageObj = languages.find(lang => lang.code === currentLanguage) || languages[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {currentLanguageObj.flag} {currentLanguageObj.name}
          </span>
          <span className="inline-block sm:hidden">
            {currentLanguageObj.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
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
