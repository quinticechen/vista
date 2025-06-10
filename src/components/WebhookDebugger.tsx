
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { getUserSpecificWebhookUrl, hasNotionDatabaseConfigured } from "@/services/webhookVerificationService";

const WebhookDebugger = () => {
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [hasNotionConfig, setHasNotionConfig] = useState(false);
  const [recentWebhooks, setRecentWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWebhookInfo();
    loadRecentWebhooks();
  }, []);

  const loadWebhookInfo = async () => {
    try {
      const url = await getUserSpecificWebhookUrl();
      setWebhookUrl(url);
      
      const hasConfig = await hasNotionDatabaseConfigured();
      setHasNotionConfig(hasConfig);
    } catch (error) {
      console.error('Error loading webhook info:', error);
    }
  };

  const loadRecentWebhooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notion_webhook_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentWebhooks(data || []);
    } catch (error) {
      console.error('Error loading recent webhooks:', error);
    }
  };

  const testWebhookEndpoint = async () => {
    if (!webhookUrl) return;
    
    setLoading(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast.success("Webhook endpoint is accessible");
      } else {
        toast.error(`Webhook endpoint returned ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      toast.error("Failed to reach webhook endpoint");
    } finally {
      setLoading(false);
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
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration Status</CardTitle>
          <CardDescription>
            Check your Notion webhook setup and troubleshoot connection issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notion Configuration</label>
              <Badge variant={hasNotionConfig ? "default" : "destructive"}>
                {hasNotionConfig ? "Configured" : "Not Configured"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook URL</label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyWebhookUrl}
                  disabled={!webhookUrl}
                >
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testWebhookEndpoint}
                  disabled={!webhookUrl || loading}
                >
                  {loading ? "Testing..." : "Test Endpoint"}
                </Button>
              </div>
            </div>
          </div>

          {webhookUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook URL for Notion</label>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {webhookUrl}
              </code>
            </div>
          )}

          {!hasNotionConfig && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Please configure your Notion API credentials first in the Notion Integration section.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            View recent webhook events received from Notion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentWebhooks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No webhook events received yet. If you've set up the webhook in Notion, 
              try making a change to a page in your database.
            </p>
          ) : (
            <div className="space-y-2">
              {recentWebhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <Badge variant="outline">{webhook.challenge_type}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(webhook.received_at).toLocaleString()}
                    </p>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {webhook.verification_token?.substring(0, 8)}...
                  </code>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Ensure your Notion API key and database ID are correctly configured</li>
            <li>Verify the webhook URL is correctly set in your Notion integration settings</li>
            <li>Check that the webhook URL includes your user_id parameter</li>
            <li>Make sure your Notion database ID matches the one in your profile</li>
            <li>Try creating or updating a page in your Notion database to trigger a webhook</li>
            <li>Check the browser console for any error messages</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookDebugger;
