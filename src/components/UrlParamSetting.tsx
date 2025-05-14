
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { setUrlParam } from "@/services/urlParamService";

const UrlParamSetting = () => {
  const [urlParam, setUrlParamState] = useState("");
  const [currentUrlParam, setCurrentUrlParam] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('url_param')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setCurrentUrlParam(data.url_param);
      if (data.url_param) {
        setUrlParamState(data.url_param);
      }
    } catch (error) {
      console.error("Error loading URL parameter:", error);
    }
  };
  
  const handleSaveUrlParam = async () => {
    if (!user) {
      toast.error("You need to be logged in to set a URL parameter");
      return;
    }
    
    if (!urlParam.trim()) {
      toast.error("URL parameter cannot be empty");
      return;
    }
    
    // Simple validation to ensure the URL param is valid
    if (!/^[a-z0-9_-]+$/i.test(urlParam)) {
      toast.error("URL parameter can only contain letters, numbers, hyphens and underscores");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await setUrlParam(user.id, urlParam);
      setCurrentUrlParam(urlParam);
      toast.success("URL parameter saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save URL parameter");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom URL Parameter</CardTitle>
        <CardDescription>
          Set a custom URL parameter to create your personalized page that visitors can access.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="urlParam" className="text-sm font-medium">URL Parameter</label>
          <Input
            id="urlParam"
            placeholder="your-brand-name"
            value={urlParam}
            onChange={(e) => setUrlParamState(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This will be your custom URL: {window.location.origin}/{urlParam}
          </p>
        </div>
        
        {currentUrlParam && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-300">
              Your current URL parameter: <strong>{currentUrlParam}</strong>
            </p>
            <p className="text-xs mt-1">
              Your personal page is accessible at:{" "}
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
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSaveUrlParam} 
          disabled={isLoading || !urlParam.trim() || urlParam === currentUrlParam}
        >
          {isLoading ? "Saving..." : "Save URL Parameter"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UrlParamSetting;
