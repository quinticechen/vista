
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import { languages, getCurrentLanguage, setCurrentLanguage } from "@/services/translationService";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LanguageSettings = () => {
  const [defaultLanguage, setDefaultLanguage] = useState(getCurrentLanguage());
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(["en"]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('default_language, supported_ai_languages')
            .eq('id', session.user.id)
            .single();
            
          if (error) throw error;
          
          if (profile) {
            setDefaultLanguage(profile.default_language);
            setCurrentLanguage(profile.default_language);
            setSupportedLanguages(profile.supported_ai_languages || ["en"]);
            
            // Also update localStorage for the language switcher
            localStorage.setItem("supportedLanguages", JSON.stringify(profile.supported_ai_languages));
          }
        }
      } catch (error) {
        console.error('Error fetching language settings:', error);
        toast.error('Failed to load language settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserSettings();
  }, []);
  
  const handleLanguageToggle = (langCode: string, checked: boolean) => {
    if (checked) {
      setSupportedLanguages(prev => [...prev, langCode]);
    } else {
      // Don't allow removing the default language
      if (langCode === defaultLanguage) {
        toast.error("Cannot remove default language");
        return;
      }
      setSupportedLanguages(prev => prev.filter(code => code !== langCode));
    }
  };
  
  const handleDefaultLanguageChange = (langCode: string) => {
    setDefaultLanguage(langCode);
    setCurrentLanguage(langCode);
    
    // Ensure default language is in supported languages
    if (!supportedLanguages.includes(langCode)) {
      setSupportedLanguages(prev => [...prev, langCode]);
    }
    
    toast.success(`Default language set to ${languages.find(l => l.code === langCode)?.name}`);
  };
  
  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to save settings");
        return;
      }
      
      // Save to Supabase profile
      const { error } = await supabase
        .from('profiles')
        .update({
          default_language: defaultLanguage,
          supported_ai_languages: supportedLanguages
        })
        .eq('id', session.user.id);
        
      if (error) throw error;
      
      // Also update localStorage for the language switcher
      localStorage.setItem("supportedLanguages", JSON.stringify(supportedLanguages));
      
      toast.success("Language settings saved successfully");
    } catch (error) {
      console.error('Error saving language settings:', error);
      toast.error('Failed to save language settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const initiateTranslation = () => {
    toast.info("Translation process started");
    // This would connect to your translation service
    // Implementation would depend on your API and requirements
  };
  
  useEffect(() => {
    // Make sure default language is always in the supported languages
    if (!supportedLanguages.includes(defaultLanguage)) {
      setSupportedLanguages(prev => [...prev, defaultLanguage]);
    }
  }, [defaultLanguage, supportedLanguages]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Language Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Default Language</CardTitle>
          <CardDescription>
            Select the default language for your website content
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {languages.map((lang) => (
              <div 
                key={lang.code}
                className={`flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-accent ${
                  defaultLanguage === lang.code ? "bg-accent border-primary" : ""
                }`}
                onClick={() => handleDefaultLanguageChange(lang.code)}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {defaultLanguage === lang.code && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Supported Languages</CardTitle>
          <CardDescription>
            Select which languages your website will support for translation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {languages.map((lang) => (
              <div key={lang.code} className="flex items-center space-x-2">
                <Checkbox 
                  id={`lang-${lang.code}`}
                  checked={supportedLanguages.includes(lang.code)}
                  onCheckedChange={(checked) => 
                    handleLanguageToggle(lang.code, checked === true)
                  }
                  disabled={lang.code === defaultLanguage}
                />
                <Label
                  htmlFor={`lang-${lang.code}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={saveSettings}>Save Settings</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Translation Actions</CardTitle>
          <CardDescription>
            Manually initiate translation processes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={initiateTranslation}>
              <Globe className="mr-2 h-4 w-4" />
              Translate All Content
            </Button>
            <p className="text-sm text-muted-foreground">
              This will translate all content to the supported languages
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSettings;
