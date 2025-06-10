
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

const Content = () => {
  const [profile, setProfile] = useState<any>(null);
  const [notionApiKey, setNotionApiKey] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
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
              <CardTitle>Notion Database Configuration</CardTitle>
              <CardDescription>
                Connect your Notion database to automatically sync content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notion-api-key">Notion API Key</Label>
                <Input
                  id="notion-api-key"
                  type="password"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder="Enter your Notion API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notion-database-id">Database ID</Label>
                <Input
                  id="notion-database-id"
                  value={notionDatabaseId}
                  onChange={(e) => setNotionDatabaseId(e.target.value)}
                  placeholder="Enter your Notion database ID"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={saveNotionConfig} disabled={loading}>
                  {loading ? "Saving..." : "Save Configuration"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={syncDatabase} 
                  disabled={loading || !notionApiKey || !notionDatabaseId}
                >
                  {loading ? "Syncing..." : "Sync Database"}
                </Button>
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
