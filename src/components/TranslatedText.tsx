
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';

interface TranslatedTextProps {
  children: string;
  className?: string;
}

const TranslatedText = ({ children, className }: TranslatedTextProps) => {
  const { translate, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const translateText = async () => {
      // Only attempt translation if we're not showing English content
      if (currentLanguage === 'en') {
        setTranslatedText(children);
        return;
      }
      
      try {
        setIsLoading(true);
        const result = await translate(children);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('Translation error:', error);
        // Fall back to original text on error
        if (isMounted) {
          setTranslatedText(children);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    translateText();
    
    return () => {
      isMounted = false;
    };
  }, [children, currentLanguage, translate]);
  
  return (
    <span className={className}>
      {isLoading ? (
        <span className="opacity-70">{children}</span>
      ) : (
        translatedText
      )}
    </span>
  );
};

export default TranslatedText;
