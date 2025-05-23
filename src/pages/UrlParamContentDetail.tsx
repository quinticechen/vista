
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { getProfileByUrlParam, getContentItemById } from "@/services/urlParamService";
import { processNotionContent, ContentItemFromDB, ExtendedContentItem } from "@/utils/notionContentProcessor";
import { ContentMetadata } from "@/components/content/ContentMetadata";
import { ContentCoverImage } from "@/components/content/ContentCoverImage";
import { ContentBody } from "@/components/content/ContentBody";

const UrlParamContentDetail = () => {
  const { urlParam, contentId } = useParams<{ urlParam: string, contentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<ExtendedContentItem | null>(null);
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
        const contentItem = await getContentItemById(contentId) as ContentItemFromDB;
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
        
        // Process content for rendering
        const processedContent = processNotionContent(contentItem);
        
        // Remove the first image from content if it matches the cover image
        // to prevent duplicate display
        if (processedContent.cover_image && processedContent.content && Array.isArray(processedContent.content)) {
          const filteredContent = processedContent.content.filter((block, index) => {
            // Skip the first image block if it matches the cover image
            if (index === 0 && 
                (block.type === 'image' || block.media_type === 'image') && 
                (block.url === processedContent.cover_image || block.media_url === processedContent.cover_image)) {
              return false;
            }
            return true;
          });
          processedContent.content = filteredContent;
        }
        
        setContent(processedContent);
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
        
        {content && <ContentMetadata content={content} />}
        
        {content && <ContentCoverImage content={content} />}
        
        {content && <ContentBody content={content} />}
      </main>
      
      <Footer userLanguage={ownerProfile?.default_language} 
              supportedLanguages={ownerProfile?.supported_ai_languages} />
    </div>
  );
};

export default UrlParamContentDetail;
