import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TranslatedText from "@/components/TranslatedText";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, ExternalLink, Clock } from "lucide-react";

const Content = () => {
  const [urlParam, setUrlParam] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [notionApiKey, setNotionApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [latestVerificationToken, setLatestVerificationToken] = useState("");
  const [verificationTokenTimestamp, setVerificationTokenTimestamp] = useState("");
  const navigate = useNavigate();
  
  // Fetch user's profile data and latest verification token
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
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);

  // Fetch latest verification token for current user
  useEffect(() => {
    const fetchLatestVerificationToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase
          .from('notion_webhook_verifications')
          .select('verification_token, received_at')
          .eq('user_id', session.user.id)
          .order('received_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error fetching verification token:", error);
          return;
        }
        
        if (data) {
          setLatestVerificationToken(data.verification_token);
          setVerificationTokenTimestamp(data.received_at);
        }
      } catch (error) {
        console.error("Error fetching verification token:", error);
      }
    };

    fetchLatestVerificationToken();

    // Set up real-time subscription for user-specific verification tokens
    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const channel = supabase
        .channel('notion-webhook-verifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notion_webhook_verifications'
          },
          (payload) => {
            console.log('New verification token received:', payload.new);
            // Only update if this token belongs to the current user or has no user (unclaimed)
            if (payload.new.user_id === session.user.id || !payload.new.user_id) {
              setLatestVerificationToken(payload.new.verification_token);
              setVerificationTokenTimestamp(payload.new.received_at);
              toast({
                title: "New Verification Token",
                description: "New verification token received from Notion!",
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);
  
  const saveUrlParam = async () => {
    if (!urlParam) {
      toast({
        title: "Error",
        description: "Please enter a URL parameter first",
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
        .update({ url_param: urlParam.trim().toLowerCase() })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
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
      
    } catch (error) {
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
  
  const copyToClipboard = (text, successMessage) => {
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
    
    navigate(`/${urlParam}`);
  };
  
  // Get the webhook URL - using the correct Supabase edge function URL
  const getWebhookUrl = () => {
    return `https://oyvbdbajqsqzafpuahvz.supabase.co/functions/v1/notion-webhook`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };
  
  const claimLatestToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to claim tokens",
          variant: "destructive",
        });
        return;
      }

      // Get the latest unclaimed token
      const { data: unclaimedToken, error: fetchError } = await supabase
        .from('notion_webhook_verifications')
        .select('id, verification_token, received_at')
        .is('user_id', null)
        .order('received_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        toast({
          title: "Error",
          description: "No unclaimed tokens found",
          variant: "destructive",
        });
        return;
      }

      // Claim the token
      const { error: updateError } = await supabase
        .from('notion_webhook_verifications')
        .update({ user_id: session.user.id })
        .eq('id', unclaimedToken.id);

      if (updateError) throw updateError;

      setLatestVerificationToken(unclaimedToken.verification_token);
      setVerificationTokenTimestamp(unclaimedToken.received_at);

      toast({
        title: "Success",
        description: "Verification token claimed successfully!",
      });
    } catch (error) {
      console.error("Error claiming token:", error);
      toast({
        title: "Error",
        description: "Failed to claim verification token",
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
                    <Button variant="outline" onClick={() => copyToClipboard(`${window.location.origin}/${urlParam}`, "URL copied to clipboard!")} disabled={isLoading || !urlParam}>
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
                  
                  {/* Webhook Configuration Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      <TranslatedText>Webhook Configuration</TranslatedText>
                    </h3>
                    
                    <Alert className="mb-4">
                      <AlertTitle>
                        <TranslatedText>Automatic Updates</TranslatedText>
                      </AlertTitle>
                      <AlertDescription>
                        <TranslatedText>
                          Set up a webhook in Notion to automatically sync changes. When you create or update pages in your Notion database, they will be automatically updated here.
                        </TranslatedText>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>
                          <TranslatedText>Webhook URL</TranslatedText>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={getWebhookUrl()}
                            readOnly
                            className="bg-gray-50"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(getWebhookUrl(), "Webhook URL copied to clipboard!")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <TranslatedText>
                            Use this URL when setting up the webhook in your Notion integration settings.
                          </TranslatedText>
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>
                          <TranslatedText>Verification Token</TranslatedText>
                        </Label>
                        <div className="space-y-2">
                          {latestVerificationToken ? (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  value={latestVerificationToken}
                                  readOnly
                                  className="bg-green-50 border-green-200 font-mono text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(latestVerificationToken, "Verification token copied to clipboard!")}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Clock className="h-3 w-3" />
                                <span>
                                  <TranslatedText>Received:</TranslatedText> {formatTimestamp(verificationTokenTimestamp)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                                <TranslatedText>
                                  No verification token found for your account. If you just set up the webhook, click "Claim Latest Token" below.
                                </TranslatedText>
                              </div>
                              <Button
                                variant="outline"
                                onClick={claimLatestToken}
                                className="w-full"
                              >
                                <TranslatedText>Claim Latest Token</TranslatedText>
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <TranslatedText>
                            This token is automatically received from Notion during webhook setup. Use it for webhook verification.
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
                              3. Add the webhook URL above to your integration
                            </TranslatedText>
                          </p>
                          <p>
                            <TranslatedText>
                              4. When prompted for verification, click "Claim Latest Token" to get your verification token
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
