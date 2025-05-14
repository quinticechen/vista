
import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from '@/hooks/use-translation';

interface TranslatedTextProps {
  children: string | ReactNode;
  keyword?: string; // Add keyword prop as optional
  className?: string;
}

const TranslatedText = ({ children, keyword, className }: TranslatedTextProps) => {
  const { translate, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | ReactNode>(children);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const translateText = async () => {
      // Only attempt translation if we're not showing English content
      if (currentLanguage === 'en') {
        setTranslatedText(children);
        return;
      }
      
      // Only translate string content, not React elements
      if (typeof children !== 'string') {
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
        <span className="opacity-70">{typeof children === 'string' ? children : children}</span>
      ) : (
        translatedText
      )}
    </span>
  );
};

export default TranslatedText;
