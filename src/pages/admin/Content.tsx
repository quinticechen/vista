
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Copy, RefreshCw, Clock } from "lucide-react";
import WebhookDebugger from "@/components/WebhookDebugger";
import ContentPreview from "@/pages/admin/ContentPreview";
import TranslatedText from "@/components/TranslatedText";
import { getUserSpecificWebhookUrl, getUserVerificationToken } from "@/services/webhookVerificationService";

const Content = () => {
  const [profile, setProfile] = useState<any>(null);
  const [notionApiKey, setNotionApiKey] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verificationTokenTimestamp, setVerificationTokenTimestamp] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadWebhookInfo();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setNotionApiKey(data.notion_api_key || "");
      setNotionDatabaseId(data.notion_database_id || "");
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadWebhookInfo = async () => {
    try {
      const url = await getUserSpecificWebhookUrl();
      setWebhookUrl(url);
      
      const token = await getUserVerificationToken();
      setVerificationToken(token);
      
      if (token) {
        setVerificationTokenTimestamp(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error loading webhook info:', error);
    }
  };

  const saveNotionSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          notion_api_key: notionApiKey,
          notion_database_id: notionDatabaseId,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Notion configuration saved successfully");
      await loadProfile();
    } catch (error: any) {
      toast.error(`Error saving configuration: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const syncNotionContent = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!notionApiKey || !notionDatabaseId) {
        toast.error("Please configure your Notion API key and database ID first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-notion-database', {
        body: {
          userId: user.id,
          notionApiKey,
          notionDatabaseId,
        }
      });

      if (error) throw error;

      toast.success(`Database sync completed. Processed ${data.processedCount || 0} items.`);
    } catch (error: any) {
      toast.error(`Error syncing database: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshVerificationToken = async () => {
    try {
      const token = await getUserVerificationToken();
      setVerificationToken(token);
      setVerificationTokenTimestamp(new Date().toISOString());
      toast.success("Verification token refreshed");
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error("Failed to refresh verification token");
    }
  };

  const copyToClipboard = (text: string | null, successMessage: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(successMessage);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Management</h1>
        <p className="text-muted-foreground">
          Manage your content sources and sync settings
        </p>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Content Preview</TabsTrigger>
          <TabsTrigger value="notion">Notion Integration</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
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
                          value={webhookUrl || ""}
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

        <TabsContent value="webhook" className="space-y-6">
          <WebhookDebugger />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Content;
