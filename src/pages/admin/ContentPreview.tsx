
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, ExternalLink } from "lucide-react";
import TranslatedText from "@/components/TranslatedText";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  notion_page_id?: string;
  notion_page_status?: string;
  updated_at?: string;
}

const ContentPreview = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasNotionConfig, setHasNotionConfig] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    notion_page_status: ""
  });

  useEffect(() => {
    checkNotionConfig();
    loadContentItems();
  }, []);

  const checkNotionConfig = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('notion_database_id, notion_api_key')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setHasNotionConfig(!!(data.notion_database_id && data.notion_api_key));
    } catch (error) {
      console.error("Error checking Notion config:", error);
    }
  };

  const loadContentItems = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('content_items')
        .select('id, title, description, category, notion_page_id, notion_page_status, updated_at')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setContentItems(data || []);
    } catch (error) {
      console.error("Error loading content items:", error);
      toast({
        title: "Error",
        description: "Failed to load content items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (item: ContentItem) => {
    setSelectedItem(item);
    setEditForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "",
      notion_page_status: item.notion_page_status || "active"
    });
    setIsEditDialogOpen(true);
  };

  const saveChanges = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('content_items')
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          notion_page_status: editForm.notion_page_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content item updated successfully!",
      });

      setIsEditDialogOpen(false);
      loadContentItems();
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!hasNotionConfig) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">
          <TranslatedText>Content Preview</TranslatedText>
        </h2>
        
        <Alert>
          <AlertTitle>
            <TranslatedText>Notion Integration Required</TranslatedText>
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              <TranslatedText>
                To preview and manage your content, you need to configure Notion Integration first.
              </TranslatedText>
            </p>
            <p>
              <TranslatedText>
                Please go to the "Notion Integration" tab to set up your Notion Database ID and API Key.
              </TranslatedText>
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        <TranslatedText>Content Preview</TranslatedText>
      </h2>
      
      <Card>
        <CardHeader>
          <CardTitle>
            <TranslatedText>Your Content Items</TranslatedText>
          </CardTitle>
          <CardDescription>
            <TranslatedText>
              Preview and edit your content items. Changes will be reflected immediately.
            </TranslatedText>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <TranslatedText>Loading content items...</TranslatedText>
            </div>
          ) : contentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TranslatedText>No content items found. Sync your Notion database to get started.</TranslatedText>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><TranslatedText>ID</TranslatedText></TableHead>
                  <TableHead><TranslatedText>Title</TranslatedText></TableHead>
                  <TableHead><TranslatedText>Description</TranslatedText></TableHead>
                  <TableHead><TranslatedText>Category</TranslatedText></TableHead>
                  <TableHead><TranslatedText>Notion Page ID</TranslatedText></TableHead>
                  <TableHead><TranslatedText>Status</TranslatedText></TableHead>
                  <TableHead><TranslatedText>Actions</TranslatedText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description || "—"}</TableCell>
                    <TableCell>{item.category || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{item.notion_page_id?.slice(0, 8) || "—"}...</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.notion_page_status === 'active' ? 'bg-green-100 text-green-800' :
                        item.notion_page_status === 'removed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.notion_page_status || 'active'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              <TranslatedText>Edit Content Item</TranslatedText>
            </DialogTitle>
            <DialogDescription>
              <TranslatedText>
                Make changes to your content item here. Click save when you're done.
              </TranslatedText>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">
                <TranslatedText>Title</TranslatedText>
              </Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">
                <TranslatedText>Description</TranslatedText>
              </Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-category">
                <TranslatedText>Category</TranslatedText>
              </Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-status">
                <TranslatedText>Notion Page Status</TranslatedText>
              </Label>
              <Select
                value={editForm.notion_page_status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, notion_page_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <TranslatedText>Cancel</TranslatedText>
            </Button>
            <Button onClick={saveChanges} disabled={isSaving}>
              <TranslatedText>{isSaving ? "Saving..." : "Save Changes"}</TranslatedText>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentPreview;
