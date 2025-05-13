
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TranslatedText from "@/components/TranslatedText";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Content = () => {
  const [urlParam, setUrlParam] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [notionApiKey, setNotionApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  
  // Fetch user's profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('url_param, notion_database_id, notion_api_key')
          .eq('id', session.user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setUrlParam(data.url_param || "");
          setNotionDatabaseId(data.notion_database_id || "");
          setNotionApiKey(data.notion_api_key || "");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  const saveUrlParam = async () => {
    if (!urlParam) {
      toast.error("Please enter a URL parameter first");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to save settings");
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ url_param: urlParam.trim().toLowerCase() })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
      toast.success("URL parameter saved successfully!");
    } catch (error) {
      console.error("Error saving URL parameter:", error);
      toast.error("Failed to save URL parameter");
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveNotionSettings = async () => {
    if (!notionDatabaseId || !notionApiKey) {
      toast.error("Please enter both Notion Database ID and API Key");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to save settings");
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          notion_database_id: notionDatabaseId,
          notion_api_key: notionApiKey
        })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
      toast.success("Notion settings saved successfully!");
    } catch (error) {
      console.error("Error saving Notion settings:", error);
      toast.error("Failed to save Notion settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  const syncNotionContent = async () => {
    if (!notionDatabaseId || !notionApiKey) {
      toast.error("Please save your Notion settings first");
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to sync content");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('sync-notion-database', {
        body: { 
          notionDatabaseId,
          notionApiKey,
          userId: session.user.id
        }
      });
      
      if (error) throw error;
      
      toast.success("Content synced successfully!");
    } catch (error) {
      console.error("Error syncing Notion content:", error);
      toast.error("Failed to sync Notion content");
    } finally {
      setIsSyncing(false);
    }
  };
  
  const copyToClipboard = () => {
    if (!urlParam) {
      toast.error("Please enter a URL parameter first");
      return;
    }
    
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/${urlParam}`;
    
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        toast.success("URL copied to clipboard!");
      })
      .catch((err) => {
        toast.error("Failed to copy URL: " + err);
      });
  };
  
  const viewPreview = () => {
    if (!urlParam) {
      toast.error("Please enter a URL parameter first");
      return;
    }
    
    navigate(`/${urlParam}`);
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        <TranslatedText>Content Management</TranslatedText>
      </h1>
      
      <div className="grid gap-6">
        <Tabs defaultValue="url" className="w-full">
          <TabsList>
            <TabsTrigger value="url">
              <TranslatedText>URL Settings</TranslatedText>
            </TabsTrigger>
            <TabsTrigger value="notion">
              <TranslatedText>Notion Integration</TranslatedText>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url">
            <Card>
              <CardHeader>
                <CardTitle>
                  <TranslatedText>Website URL Settings</TranslatedText>
                </CardTitle>
                <CardDescription>
                  <TranslatedText>
                    Configure your website's URL parameter to make it accessible at your-domain.com/your-parameter
                  </TranslatedText>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="urlParam">
                      <TranslatedText>URL Parameter</TranslatedText>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="urlParam"
                        placeholder="e.g. yourbrand"
                        value={urlParam}
                        onChange={(e) => setUrlParam(e.target.value.trim().toLowerCase())}
                        disabled={isLoading || isSaving}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <TranslatedText>
                        This will be used as your website's URL: {window.location.origin}/{urlParam || "your-parameter"}
                      </TranslatedText>
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={saveUrlParam} disabled={isLoading || isSaving}>
                      <TranslatedText>{isSaving ? "Saving..." : "Save"}</TranslatedText>
                    </Button>
                    <Button variant="outline" onClick={viewPreview} disabled={isLoading || !urlParam}>
                      <TranslatedText>Preview</TranslatedText>
                    </Button>
                    <Button variant="outline" onClick={copyToClipboard} disabled={isLoading || !urlParam}>
                      <TranslatedText>Copy URL</TranslatedText>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notion">
            <Card>
              <CardHeader>
                <CardTitle>
                  <TranslatedText>Notion Integration</TranslatedText>
                </CardTitle>
                <CardDescription>
                  <TranslatedText>
                    Connect your Notion database to import content automatically
                  </TranslatedText>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      <TranslatedText>
                        Use our Notion template to structure your content. You can duplicate it and customize as needed.
                      </TranslatedText>
                    </p>
                    <Button variant="outline" onClick={() => window.open("https://quintice.notion.site/1f0b07b9915c807095caf75eb3f47ed1?v=1f0b07b9915c80f88ec1000c5ccba839&pvs=4", "_blank")}>
                      <TranslatedText>Open Notion Template</TranslatedText>
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="notionDatabaseId">
                        <TranslatedText>Notion Database ID</TranslatedText>
                      </Label>
                      <Input
                        id="notionDatabaseId"
                        placeholder="e.g. 1f0b07b9915c807095caf75eb3f47ed1"
                        value={notionDatabaseId}
                        onChange={(e) => setNotionDatabaseId(e.target.value.trim())}
                        disabled={isLoading || isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        <TranslatedText>
                          The ID can be found in your Notion database URL after the page title and before any query parameters.
                        </TranslatedText>
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="notionApiKey">
                        <TranslatedText>Notion API Key</TranslatedText>
                      </Label>
                      <Input
                        id="notionApiKey"
                        type="password"
                        placeholder="secret_..."
                        value={notionApiKey}
                        onChange={(e) => setNotionApiKey(e.target.value.trim())}
                        disabled={isLoading || isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        <TranslatedText>
                          You can get your API key from <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Notion Integrations</a>
                        </TranslatedText>
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button onClick={saveNotionSettings} disabled={isLoading || isSaving}>
                        <TranslatedText>{isSaving ? "Saving..." : "Save Settings"}</TranslatedText>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={syncNotionContent} 
                        disabled={isLoading || isSyncing || !notionDatabaseId || !notionApiKey}
                      >
                        <TranslatedText>{isSyncing ? "Syncing..." : "Sync Now"}</TranslatedText>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Content;
