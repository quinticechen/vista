
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';

interface TranslatedTextProps {
  children: string;
  className?: string;
}

const TranslatedText = ({ children, className }: TranslatedTextProps) => {
  const { translate, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);
  
  useEffect(() => {
    let isMounted = true;
    
    const translateText = async () => {
      try {
        const result = await translate(children);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('Translation error:', error);
      }
    };
    
    translateText();
    
    return () => {
      isMounted = false;
    };
  }, [children, currentLanguage, translate]);
  
  return <span className={className}>{translatedText}</span>;
};

export default TranslatedText;
