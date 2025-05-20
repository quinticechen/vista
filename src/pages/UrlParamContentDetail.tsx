
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

// Helper function to render bulleted list items
const renderBulletedList = (items: any[]) => {
  if (!items || items.length === 0) return null;
  
  return (
    <ul className="list-disc pl-6 my-4 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="text-base">
          {item.text}
          {item.children && (
            <>
              {item.children.map((child: any, childIndex: number) => {
                if (child.type === 'paragraph') {
                  return <p key={childIndex} className="mt-1 text-sm text-muted-foreground">{child.text}</p>;
                } else if (child.type === 'bulleted_list_item') {
                  return renderBulletedList([child]);
                } else if (child.type === 'numbered_list_item') {
                  return renderNumberedList([child]);
                }
                return null;
              })}
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

// Helper function to render numbered list items
const renderNumberedList = (items: any[]) => {
  if (!items || items.length === 0) return null;
  
  return (
    <ol className="list-decimal pl-6 my-4 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="text-base">
          {item.text}
          {item.children && (
            <>
              {item.children.map((child: any, childIndex: number) => {
                if (child.type === 'paragraph') {
                  return <p key={childIndex} className="mt-1 text-sm text-muted-foreground">{child.text}</p>;
                } else if (child.type === 'bulleted_list_item') {
                  return renderBulletedList([child]);
                } else if (child.type === 'numbered_list_item') {
                  return renderNumberedList([child]);
                }
                return null;
              })}
            </>
          )}
        </li>
      ))}
    </ol>
  );
};

// Helper function to process structured content
const renderStructuredContent = (content: any[] | null) => {
  if (!content || !Array.isArray(content) || content.length === 0) {
    return <p className="text-gray-500 italic">No content available</p>;
  }
  
  let bulletedListItems: any[] = [];
  let numberedListItems: any[] = [];
  
  return (
    <div className="prose max-w-none">
      {content.map((block, index) => {
        // Handle lists specially to group them
        if (block.type === 'bulleted_list_item') {
          bulletedListItems.push(block);
          
          // If this is the last item or the next item is not a bulleted list, render the list
          if (index === content.length - 1 || content[index + 1].type !== 'bulleted_list_item') {
            const listToRender = [...bulletedListItems];
            bulletedListItems = [];
            return renderBulletedList(listToRender);
          }
          return null;
        }
        
        if (block.type === 'numbered_list_item') {
          numberedListItems.push(block);
          
          // If this is the last item or the next item is not a numbered list, render the list
          if (index === content.length - 1 || content[index + 1].type !== 'numbered_list_item') {
            const listToRender = [...numberedListItems];
            numberedListItems = [];
            return renderNumberedList(listToRender);
          }
          return null;
        }
        
        // For other blocks, let NotionRenderer handle them
        return <NotionRenderer key={index} blocks={[block]} />;
      })}
    </div>
  );
};

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
              Array.isArray(content.content) ? 
                renderStructuredContent(content.content) : 
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

export default UrlParamContentDetail;
