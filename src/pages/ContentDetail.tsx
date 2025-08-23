
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import SEOContent from "@/components/SEOContent";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Tag, Clock, Eye } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import NotionRenderer from "@/components/NotionRenderer";
import vistaLogo from "@/public/og-image.png";

const ContentDetail = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Generate SEO data for content
  const generateContentSEO = () => {
    if (!content) return {};
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = `${baseUrl}/vista/${contentId}`;
    
    const title = content.title || 'Vista Content Platform';
    const description = content.description || `Discover insights on Vista Content Platform. Explore curated content and articles.`;
    const keywords = content.tags || ['article', 'content', 'insights'];
    
    // Use cover_image first, then preview_image, then Vista logo as fallback
    let ogImage = vistaLogo;
    if (content.cover_image) {
      ogImage = content.cover_image;
    } else if (content.preview_image) {
      ogImage = content.preview_image;
    } else if (content.content && Array.isArray(content.content)) {
      // Look for the first image in content blocks
      const firstImageBlock = content.content.find((block: any) => 
        (block.type === 'image' || block.media_type === 'image') && 
        (block.url || block.media_url)
      );
      if (firstImageBlock) {
        ogImage = firstImageBlock.url || firstImageBlock.media_url;
      }
    }
    
    return {
      title,
      description,
      keywords,
      canonicalUrl,
      ogImage,
      ogType: 'article',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": content.title,
        "description": description,
        "image": ogImage,
        "url": canonicalUrl,
        "datePublished": content.created_at,
        "dateModified": content.updated_at || content.created_at,
        "author": {
          "@type": "Organization",
          "name": "Vista Content Platform"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Vista Content Platform"
        }
      }
    };
  };

  // Function to increment visitor count
  const incrementVisitorCount = async (contentId: string) => {
    try {
      const { error } = await supabase.rpc('increment_visitor_count', {
        content_id: contentId
      });
      
      if (error) {
        console.error('Error incrementing visitor count:', error);
      }
    } catch (error) {
      console.error('Error calling increment_visitor_count:', error);
    }
  };

  // Function to format visitor count for display
  const formatVisitorCount = (count: number | null | undefined) => {
    if (!count) return 0;
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

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
        
        // Increment visitor count after successfully loading content
        if (data?.id) {
          await incrementVisitorCount(data.id);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching content detail:", error);
        }
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
        <SEOHead
          title="Loading Content - Vista Content Platform"
          description="Loading content details from Vista Content Platform"
          noIndex={true}
        />
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
        <SEOHead
          title="Content Not Found - Vista Content Platform"
          description="The requested content could not be found. Browse our content library for more articles and insights."
          noIndex={true}
        />
        <Header />
        <main className="flex-1 container py-8 max-w-4xl">
          <SEOContent
            h1="Content Not Found"
            h2="The requested article could not be found"
          >
            <Button onClick={() => navigate("/vista")} className="mt-4">
              Back to Content List
            </Button>
          </SEOContent>
        </main>
        <Footer />
      </div>
    );
  }

  const seoData = generateContentSEO();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead {...seoData} />

      {/* <Header /> */}
      
      <main className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/vista")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Content
        </Button>
        
        <SEOContent
          h1={content.title}
          h2={content.description}
        >
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
            
            {/* Display visitor count */}
            <div className="flex items-center text-sm text-muted-foreground">
              <Eye className="mr-1 h-4 w-4" />
              <span>Views: {formatVisitorCount(content?.visitor_count)}</span>
            </div>
          </div>
          
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
                  alt={`Cover image for ${content.title}`}
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
        </SEOContent>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContentDetail;
