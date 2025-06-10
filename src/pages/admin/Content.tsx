import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TranslatedText from "@/components/TranslatedText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { getUserVerificationToken, getUserSpecificWebhookUrl, subscribeToVerificationUpdates } from "@/services/webhookVerificationService";
import ContentPreview from "./ContentPreview";

const Content = () => {
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [notionApiKey, setNotionApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationTokenTimestamp, setVerificationTokenTimestamp] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  
  // Fetch user's profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('notion_database_id, notion_api_key, verification_token')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile data:", error);
          toast({
            title: "Error",
            description: "Failed to load profile data",
            variant: "destructive",
          });
          return;
        }
        
        if (data) {
          setNotionDatabaseId(data.notion_database_id || "");
          setNotionApiKey(data.notion_api_key || "");
          setVerificationToken(data.verification_token || "");
          if (data.verification_token) {
            setVerificationTokenTimestamp(new Date().toISOString());
          }
        }

        // Get user-specific webhook URL
        const userWebhookUrl = await getUserSpecificWebhookUrl();
        if (userWebhookUrl) {
          setWebhookUrl(userWebhookUrl);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      }
    };
    
    fetchProfileData();
  }, []);

  // Set up real-time subscription for verification token updates
  useEffect(() => {
    const unsubscribe = subscribeToVerificationUpdates((token) => {
      setVerificationToken(token);
      setVerificationTokenTimestamp(new Date().toISOString());
      toast({
        title: "New Verification Token",
        description: "New verification token received from Notion!",
      });
    });

    return unsubscribe;
  }, []);
  
  const saveNotionSettings = async () => {
    if (!notionDatabaseId || !notionApiKey) {
      toast({
        title: "Error",
        description: "Please enter both Notion Database ID and API Key",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to save settings",
          variant: "destructive",
        });
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
      
      toast({
        title: "Success",
        description: "Notion settings saved successfully!",
      });
    } catch (error) {
      console.error("Error saving Notion settings:", error);
      toast({
        title: "Error",
        description: "Failed to save Notion settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const syncNotionContent = async () => {
    if (!notionDatabaseId || !notionApiKey) {
      toast({
        title: "Error",
        description: "Please save your Notion settings first",
        variant: "destructive",
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to sync content",
          variant: "destructive",
        });
        return;
      }
      
      // Remove hyphens from the database ID to match Notion API format
      const formattedDatabaseId = notionDatabaseId.replace(/-/g, '');
      
      const { data, error } = await supabase.functions.invoke('sync-notion-database', {
        body: { 
          notionDatabaseId: formattedDatabaseId,
          notionApiKey,
          userId: session.user.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Content synced successfully!",
      });
      
    } catch (error: any) {
      console.error("Error syncing Notion content:", error);
      toast({
        title: "Error",
        description: `Failed to sync Notion content: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
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

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };
  
  const refreshVerificationToken = async () => {
    try {
      const token = await getUserVerificationToken();
      if (token) {
        setVerificationToken(token);
        setVerificationTokenTimestamp(new Date().toISOString());
        toast({
          title: "Success",
          description: "Verification token refreshed!",
        });
      } else {
        toast({
          title: "Info",
          description: "No verification token found for your account",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh verification token",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        <TranslatedText>Content Management</TranslatedText>
      </h1>
      
      <div className="grid gap-6">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList>
            <TabsTrigger value="preview">
              <TranslatedText>Content Preview</TranslatedText>
            </TabsTrigger>
            <TabsTrigger value="notion">
              <TranslatedText>Notion Integration</TranslatedText>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            <ContentPreview />
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
                      <ExternalLink className="h-4 w-4 mr-2" />
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
                        disabled={isSaving}
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
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        <TranslatedText>
                          You can get your API key from <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Notion Integrations</a>
                        </TranslatedText>
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button onClick={saveNotionSettings} disabled={isSaving}>
                        <TranslatedText>{isSaving ? "Saving..." : "Save Settings"}</TranslatedText>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={syncNotionContent} 
                        disabled={isSyncing || !notionDatabaseId || !notionApiKey}
                      >
                        <TranslatedText>{isSyncing ? "Syncing..." : "Sync Now"}</TranslatedText>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Webhook Configuration Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      <TranslatedText>Webhook Configuration</TranslatedText>
                    </h3>
                    
                    <Alert className="mb-4">
                      <AlertTitle>
                        <TranslatedText>User-Specific Webhook</TranslatedText>
                      </AlertTitle>
                      <AlertDescription>
                        <TranslatedText>
                          Your webhook URL is unique to your account. This ensures verification tokens are correctly associated with your profile.
                        </TranslatedText>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>
                          <TranslatedText>Your Webhook URL</TranslatedText>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={webhookUrl}
                            readOnly
                            className="bg-gray-50 font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(webhookUrl, "Webhook URL copied to clipboard!")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <TranslatedText>
                            Use this unique URL when setting up the webhook in your Notion integration settings.
                          </TranslatedText>
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label>
                            <TranslatedText>Verification Token</TranslatedText>
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshVerificationToken}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <TranslatedText>Refresh</TranslatedText>
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {verificationToken ? (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  value={verificationToken}
                                  readOnly
                                  className="bg-green-50 border-green-200 font-mono text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(verificationToken, "Verification token copied to clipboard!")}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Clock className="h-3 w-3" />
                                <span>
                                  <TranslatedText>Updated:</TranslatedText> {formatTimestamp(verificationTokenTimestamp)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                              <TranslatedText>
                                No verification token yet. Set up your webhook in Notion to receive one automatically.
                              </TranslatedText>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <TranslatedText>
                            This token is automatically updated when you verify your webhook in Notion.
                          </TranslatedText>
                        </p>
                      </div>
                      
                      <Alert>
                        <AlertTitle>
                          <TranslatedText>Setup Instructions</TranslatedText>
                        </AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>
                            <TranslatedText>
                              1. Save your Notion settings above first
                            </TranslatedText>
                          </p>
                          <p>
                            <TranslatedText>
                              2. Go to your Notion integration settings
                            </TranslatedText>
                          </p>
                          <p>
                            <TranslatedText>
                              3. Add your unique webhook URL above to your integration
                            </TranslatedText>
                          </p>
                          <p>
                            <TranslatedText>
                              4. Click "Verify subscription" in Notion - your token will appear automatically
                            </TranslatedText>
                          </p>
                          <p>
                            <TranslatedText>
                              5. Select "Page content changed" as the event type
                            </TranslatedText>
                          </p>
                        </AlertDescription>
                      </Alert>
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
