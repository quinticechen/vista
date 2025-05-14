
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Tag, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div>Loading content...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(`/${urlParam}/vista`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Content
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{content?.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            {content?.category && (
              <Badge variant="outline">{content.category}</Badge>
            )}
            
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>Created: {formatDate(content?.created_at)}</span>
            </div>
            
            {content?.updated_at && content.updated_at !== content.created_at && (
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>Updated: {formatDate(content?.updated_at)}</span>
              </div>
            )}
            
            {content?.start_date && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>Starts: {formatDate(content?.start_date)}</span>
              </div>
            )}
            
            {content?.end_date && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>Ends: {formatDate(content?.end_date)}</span>
              </div>
            )}
          </div>
          
          {content?.description && (
            <p className="text-lg mb-6">{content.description}</p>
          )}
          
          {content?.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Tag className="h-4 w-4 mr-1" />
              {content.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            {content?.content ? (
              <NotionRenderer blocks={content.content} />
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer userLanguage={ownerProfile?.default_language} 
              supportedLanguages={ownerProfile?.supported_ai_languages} />
    </div>
  );
};

export default ContentDetail;
