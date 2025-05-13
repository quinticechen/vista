
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TranslatedText } from "@/components/TranslatedText";

const Content = () => {
  const [urlParam, setUrlParam] = useState("");
  const navigate = useNavigate();
  
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
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  <TranslatedText>
                    This will be used as your website's URL: {window.location.origin}/{urlParam || "your-parameter"}
                  </TranslatedText>
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={viewPreview}>
                  <TranslatedText>Preview</TranslatedText>
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  <TranslatedText>Copy URL</TranslatedText>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              <TranslatedText>Content Management</TranslatedText>
            </CardTitle>
            <CardDescription>
              <TranslatedText>
                This section will allow you to manage website content
              </TranslatedText>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              <TranslatedText>Additional content management features coming soon.</TranslatedText>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Content;
