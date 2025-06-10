
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink } from "lucide-react";
import TranslatedText from "@/components/TranslatedText";

const UrlSettings = () => {
  const [urlParam, setUrlParam] = useState("");
  const [currentUrlParam, setCurrentUrlParam] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadCurrentUrlParam(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCurrentUrlParam(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const loadCurrentUrlParam = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('url_param')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setCurrentUrlParam(data.url_param);
      if (data.url_param) {
        setUrlParam(data.url_param);
      }
    } catch (error) {
      console.error("Error loading URL parameter:", error);
      toast({
        title: "Error",
        description: "Failed to load URL parameter",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveUrlParam = async () => {
    if (!urlParam) {
      toast({
        title: "Error",
        description: "Please enter a URL parameter first",
        variant: "destructive",
      });
      return;
    }
    
    // Simple validation
    if (!/^[a-z0-9_-]+$/i.test(urlParam)) {
      toast({
        title: "Error",
        description: "URL parameter can only contain letters, numbers, hyphens and underscores",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ url_param: urlParam.trim().toLowerCase() })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setCurrentUrlParam(urlParam);
      toast({
        title: "Success",
        description: "URL parameter saved successfully!",
      });
    } catch (error) {
      console.error("Error saving URL parameter:", error);
      toast({
        title: "Error",
        description: "Failed to save URL parameter",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Success",
          description: successMessage,
        });
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: "Failed to copy: " + err,
          variant: "destructive",
        });
      });
  };
  
  const viewPreview = () => {
    if (!urlParam) {
      toast({
        title: "Error",
        description: "Please enter a URL parameter first",
        variant: "destructive",
      });
      return;
    }
    
    window.open(`/${urlParam}`, '_blank');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        <TranslatedText>URL Settings</TranslatedText>
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>
            <TranslatedText>Custom URL Parameter</TranslatedText>
          </CardTitle>
          <CardDescription>
            <TranslatedText>
              Set a custom URL parameter to create your personalized page that visitors can access.
            </TranslatedText>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="urlParam">
              <TranslatedText>URL Parameter</TranslatedText>
            </Label>
            <Input
              id="urlParam"
              placeholder="your-brand-name"
              value={urlParam}
              onChange={(e) => setUrlParam(e.target.value.trim().toLowerCase())}
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-muted-foreground">
              <TranslatedText>
                This will be your custom URL: {window.location.origin}/{urlParam || "your-parameter"}
              </TranslatedText>
            </p>
          </div>
          
          {currentUrlParam && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-300">
                <TranslatedText>Your current URL parameter:</TranslatedText> <strong>{currentUrlParam}</strong>
              </p>
              <p className="text-xs mt-1">
                <TranslatedText>Your personal page is accessible at:</TranslatedText>{" "}
                <a
                  href={`/${currentUrlParam}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-700 dark:text-green-400 underline"
                >
                  {window.location.origin}/{currentUrlParam}
                </a>
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={saveUrlParam} 
              disabled={isLoading || isSaving || !urlParam.trim() || urlParam === currentUrlParam}
            >
              <TranslatedText>{isSaving ? "Saving..." : "Save URL Parameter"}</TranslatedText>
            </Button>
            <Button variant="outline" onClick={viewPreview} disabled={isLoading || !urlParam}>
              <ExternalLink className="h-4 w-4 mr-2" />
              <TranslatedText>Preview</TranslatedText>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(`${window.location.origin}/${urlParam}`, "URL copied to clipboard!")} 
              disabled={isLoading || !urlParam}
            >
              <Copy className="h-4 w-4 mr-2" />
              <TranslatedText>Copy URL</TranslatedText>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UrlSettings;
