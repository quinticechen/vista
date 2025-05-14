
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Tag, Clock } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import NotionRenderer from "@/components/NotionRenderer";

const ContentDetail = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContentDetail = async () => {
      if (!contentId) return;

      try {
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .eq("id", contentId)
          .single();

        if (error) {
          throw error;
        }

        setContent(data);
      } catch (error) {
        console.error("Error fetching content detail:", error);
        toast.error("Failed to load content details");
        navigate("/vista");
      } finally {
        setLoading(false);
      }
    };

    fetchContentDetail();
  }, [contentId, navigate]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="flex-1 container py-8 max-w-4xl">
          <div>Content not found</div>
          <Button onClick={() => navigate("/vista")} className="mt-4">
            Back to Content List
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <Header />
      
      <main className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/vista")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Content
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {content.category && (
            <Badge variant="outline">{content.category}</Badge>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>Created: {formatDate(content?.created_at)}</span>
          </div>
          
          {content?.updated_at && content.updated_at !== content.created_at && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              <span>Updated: {formatDate(content?.updated_at)}</span>
            </div>
          )}
          
          {content.start_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Starts: {formatDate(content.start_date)}</span>
            </div>
          )}
          
          {content.end_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Ends: {formatDate(content.end_date)}</span>
            </div>
          )}
        </div>
        
        {content.description && (
          <p className="text-lg mb-6">{content.description}</p>
        )}
        
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="flex items-center mr-1">
              <Tag className="h-4 w-4 mr-1" />
            </span>
            {content.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        
        {/* Display cover image if available */}
        {content.cover_image && (
          <div className="mb-8">
            <AspectRatio ratio={16/9} className="overflow-hidden rounded-md border border-gray-200">
              <img 
                src={content.cover_image} 
                alt={content.title} 
                className={cn(
                  "object-cover w-full h-full",
                  "transition-all hover:scale-105 duration-500"
                )}
              />
            </AspectRatio>
          </div>
        )}
        
        <Card className="mb-8 border rounded-md shadow-sm">
          <CardContent className="p-6">
            {content.content ? (
              <NotionRenderer blocks={content.content} />
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContentDetail;
