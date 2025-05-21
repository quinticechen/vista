
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Tag, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { getProfileByUrlParam, getContentItemById } from "@/services/urlParamService";
import NotionRenderer from "@/components/NotionRenderer";
import { ImageAspectRatio } from "@/components/ImageAspectRatio";
import { cn, formatDate } from "@/lib/utils";

const UrlParamContentDetail = () => {
  const { urlParam, contentId } = useParams<{ urlParam: string, contentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!urlParam || !contentId) {
        console.error("Missing URL parameters:", { urlParam, contentId });
        navigate('/');
        return;
      }
      
      try {
        console.log(`Loading content detail for urlParam: ${urlParam}, contentId: ${contentId}`);
        // Load owner profile
        const profile = await getProfileByUrlParam(urlParam);
        if (!profile) {
          toast.error(`The page for /${urlParam} does not exist.`);
          navigate('/');
          return;
        }
        setOwnerProfile(profile);
        
        // Load content item
        const contentItem = await getContentItemById(contentId);
        if (!contentItem) {
          toast.error("Content not found");
          navigate(`/${urlParam}/vista`);
          return;
        }
        
        // Verify that this content belongs to this user
        if (contentItem.user_id !== profile.id) {
          toast.error("This content does not belong to this user");
          navigate(`/${urlParam}/vista`);
          return;
        }
        
        console.log("Content loaded successfully:", contentItem);
        
        // Preprocessing for Notion blocks
        if (contentItem.content && Array.isArray(contentItem.content)) {
          console.log("Content has array structure, ready for rendering");
          
          // Process the content to properly handle all elements
          const processedContent = contentItem.content.map((block: any) => {
            // Deep clone to avoid modifying the original
            const processedBlock = JSON.parse(JSON.stringify(block));
            
            // Process line breaks in text
            if (processedBlock.text && typeof processedBlock.text === 'string') {
              // Keep line breaks intact for proper rendering
              processedBlock.text = processedBlock.text;
            }
            
            // Process any icon objects to ensure they're safely renderable
            if (processedBlock.icon && typeof processedBlock.icon === 'object') {
              // Extract emoji from icon if present
              if (processedBlock.icon.emoji) {
                processedBlock.emoji = processedBlock.icon.emoji;
              }
            }
            
            // Process list types to ensure proper hierarchy and rendering
            if (processedBlock.type === "bulleted_list_item" && !processedBlock.list_type) {
              processedBlock.list_type = "bulleted_list";
              processedBlock.is_list_item = true;
            }
            
            if (processedBlock.type === "numbered_list_item" && !processedBlock.list_type) {
              processedBlock.list_type = "numbered_list";
              processedBlock.is_list_item = true;
            }
            
            // Process for tables - ensure they have proper structure
            if (processedBlock.type === 'table' && processedBlock.children) {
              // Make sure each row has cells with proper structure
              processedBlock.children = processedBlock.children.map((row: any) => {
                if (!row.children || !Array.isArray(row.children)) {
                  row.children = []; // Ensure children is an array
                }
                return row;
              });
            }
            
            // Process for columns - ensure proper structure
            if ((processedBlock.type === 'column_list' || processedBlock.type === 'column') && processedBlock.children) {
              // Make sure each column has proper structure
              processedBlock.children = processedBlock.children.map((column: any) => {
                if (!column.children) {
                  column.children = [];
                }
                return column;
              });
            }
            
            // Fix toggle blocks
            if (processedBlock.type === 'toggle' && !processedBlock.children) {
              processedBlock.children = [];
            }
            
            // Process text with annotations to ensure styles are applied correctly
            if (processedBlock.annotations && processedBlock.annotations.length > 0) {
              processedBlock.annotations = processedBlock.annotations.map((ann: any) => {
                // Fix background colors by ensuring proper format
                if (ann.color && ann.color.includes("background")) {
                  ann.color = ann.color.replace("background", "_background");
                }
                return ann;
              });
            }
            
            // Recursively process children
            if (processedBlock.children && Array.isArray(processedBlock.children)) {
              processedBlock.children = processedBlock.children.map((child: any) => {
                // Process each child block using the same logic
                const processedChild = JSON.parse(JSON.stringify(child));
                
                // Fix list types for nested items
                if (processedChild.type === "bulleted_list_item" && !processedChild.list_type) {
                  processedChild.list_type = "bulleted_list";
                  processedChild.is_list_item = true;
                }
                
                if (processedChild.type === "numbered_list_item" && !processedChild.list_type) {
                  processedChild.list_type = "numbered_list";
                  processedChild.is_list_item = true;
                }
                
                // Handle nested annotations
                if (processedChild.annotations && processedChild.annotations.length > 0) {
                  processedChild.annotations = processedChild.annotations.map((ann: any) => {
                    if (ann.color && ann.color.includes("background")) {
                      ann.color = ann.color.replace("background", "_background");
                    }
                    return ann;
                  });
                }
                
                return processedChild;
              });
            }
            
            return processedBlock;
          });
          
          contentItem.content = processedContent;
        }
        
        setContent(contentItem);
      } catch (error) {
        console.error("Error loading content:", error);
        toast.error("Error loading content");
        navigate(`/${urlParam}/vista`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [urlParam, contentId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </main>
        <Footer userLanguage={ownerProfile?.default_language} 
                supportedLanguages={ownerProfile?.supported_ai_languages} />
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
          onClick={() => navigate(`/${urlParam}/vista`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Content
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">{content?.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {content?.category && (
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
          
          {content?.start_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Starts: {formatDate(content?.start_date)}</span>
            </div>
          )}
          
          {content?.end_date && (
            <div className="flex items-center text-sm text-muted-foreground">
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
            <span className="flex items-center mr-1">
              <Tag className="h-4 w-4 mr-1" />
            </span>
            {content.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        
        {/* Display cover image if available */}
        {content?.cover_image && (
          <div className="mb-8">
            <ImageAspectRatio 
              src={content.cover_image} 
              alt={content.title} 
              className="w-full"
            />
          </div>
        )}
        
        <Card className="mb-8 border rounded-md shadow-sm">
          <CardContent className="p-6">
            {content?.content ? (
              <div className="prose prose-sm sm:prose max-w-none">
                <NotionRenderer blocks={content.content} />
              </div>
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

export default UrlParamContentDetail;
