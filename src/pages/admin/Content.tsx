
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import WebhookDebugger from "@/components/WebhookDebugger";
import ContentPreview from "@/pages/admin/ContentPreview";
import { getUserSpecificWebhookUrl, getUserVerificationToken } from "@/services/webhookVerificationService";

const Content = () => {
  const [profile, setProfile] = useState<any>(null);
  const [notionApiKey, setNotionApiKey] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error loading webhook info:', error);
    }
  };

  const saveNotionConfig = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const syncDatabase = async () => {
    setLoading(true);
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

      toast.success(`Database sync completed. Processed ${data.processedCount} items.`);
    } catch (error: any) {
      toast.error(`Error syncing database: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshVerificationToken = async () => {
    try {
      const token = await getUserVerificationToken();
      setVerificationToken(token);
      toast.success("Verification token refreshed");
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error("Failed to refresh verification token");
    }
  };

  const copyWebhookUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied to clipboard");
    }
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

        <TabsContent value="notion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notion Integration</CardTitle>
              <CardDescription>
                Connect your Notion database to import content automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 mb-2">
                  Use our Notion template to structure your content. You can duplicate it and customize as needed.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.notion.so/templates/content-database', '_blank')}
                >
                  Open Notion Template
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notion-database-id">Notion Database ID</Label>
                  <Input
                    id="notion-database-id"
                    value={notionDatabaseId}
                    onChange={(e) => setNotionDatabaseId(e.target.value)}
                    placeholder="1f0b07b9915c807095caf75eb3f47ed1"
                  />
                  <p className="text-xs text-muted-foreground">
                    The ID can be found in your Notion database URL after the page title and before any query parameters.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notion-api-key">Notion API Key</Label>
                  <Input
                    id="notion-api-key"
                    type="password"
                    value={notionApiKey}
                    onChange={(e) => setNotionApiKey(e.target.value)}
                    placeholder="Enter your Notion API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can get your API key from{" "}
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Notion Integrations
                    </a>
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={saveNotionConfig} disabled={loading}>
                    {loading ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={syncDatabase} 
                    disabled={loading || !notionApiKey || !notionDatabaseId}
                  >
                    {loading ? "Syncing..." : "Sync Now"}
                  </Button>
                </div>
              </div>

              {notionApiKey && notionDatabaseId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Webhook Configuration</CardTitle>
                    <CardDescription>
                      User-Specific Webhook
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your webhook URL is unique to your account. This ensures verification tokens are correctly associated with your profile.
                    </p>
                    
                    <div className="space-y-2">
                      <Label>Your Webhook URL</Label>
                      <div className="flex space-x-2">
                        <Input
                          value={webhookUrl || ""}
                          readOnly
                          className="bg-muted"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyWebhookUrl}
                          disabled={!webhookUrl}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use this unique URL when setting up the webhook in your Notion integration settings.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Verification Token</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshVerificationToken}
                        >
                          Refresh
                        </Button>
                      </div>
                      <Input
                        value={verificationToken || "No token generated yet"}
                        readOnly
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date().toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This token is automatically updated when you verify your webhook in Notion.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">Setup Instructions</Label>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pl-4">
                        <li>Save your Notion settings above first</li>
                        <li>
                          Go to your{" "}
                          <a
                            href="https://www.notion.so/my-integrations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Notion integration settings
                          </a>
                        </li>
                        <li>Add your unique webhook URL above to your integration</li>
                        <li>Click "Verify subscription" in Notion - your token will appear automatically</li>
                        <li>Select "Page content changed" as the event type</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}
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
