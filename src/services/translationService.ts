
/**
 * Translation service using Google Cloud Translation API via REST
 */

import { supabase } from "@/integrations/supabase/client";

// Translation cache to avoid unnecessary API calls
const translationCache: Record<string, Record<string, string>> = {};

// Store API key once fetched
let translationApiKey: string | null = null;

/**
 * Fetch the translation API key from Supabase Edge Function
 */
export async function getTranslationApiKey(): Promise<string | null> {
  // Return cached key if available
  if (translationApiKey) {
    return translationApiKey;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-translation-key');
    
    if (error) {
      console.error('Error fetching translation API key:', error);
      return null;
    }
    
    translationApiKey = data.apiKey;
    return translationApiKey;
  } catch (error) {
    console.error('Exception fetching translation API key:', error);
    return null;
  }
}

/**
 * Translate text using Google Cloud Translation API
 * @param text Text to translate
 * @param targetLang Target language code
 * @returns Translated text or original text if translation fails
 */
export async function translateText(
  text: string, 
  targetLang: string,
): Promise<string> {
  // If target language is English or not provided, return original text
  if (!targetLang || targetLang === 'en') {
    return text;
  }
  
  // Check cache first
  if (translationCache[targetLang]?.[text]) {
    console.log('Using cached translation');
    return translationCache[targetLang][text];
  }
  
  // Get API key from Supabase
  const key = await getTranslationApiKey();
  
  if (!key) {
    console.error('Translation API key not found');
    return text;
  }
  
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    const translation = data.data.translations[0].translatedText;
    
    // Cache the result
    if (!translationCache[targetLang]) {
      translationCache[targetLang] = {};
    }
    translationCache[targetLang][text] = translation;
    
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

/**
 * Get the currently selected language
 */
export function getCurrentLanguage(): string {
  return localStorage.getItem('preferredLanguage') || 'en';
}

/**
 * Set the current language
 */
export function setCurrentLanguage(lang: string): void {
  localStorage.setItem('preferredLanguage', lang);
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

// Language options
export const languages = [
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
