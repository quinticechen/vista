
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PersonalHeader from "@/components/PersonalHeader";
import PersonalFooter from "@/components/PersonalFooter";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { getProfileByUrlParam, getContentItemById } from "@/services/urlParamService";
import { processNotionContent, ContentItemFromDB, ExtendedContentItem } from "@/utils/notionContentProcessor";
import { ContentMetadata } from "@/components/content/ContentMetadata";
import { ContentBody } from "@/components/content/ContentBody";
import { truncateDescription } from "@/lib/utils";
const vistaLogo = "/public/og-image.png";

// Type to represent a block in the content array
interface ContentBlock {
  type?: string;
  media_type?: string;
  url?: string;
  media_url?: string;
  [key: string]: any;
}

const UrlParamContentDetail = () => {
  const { urlParam, contentId } = useParams<{ urlParam: string, contentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<ExtendedContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  // Generate SEO data for content
  const generateContentSEO = () => {
    if (!content || !urlParam) return {};
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    // Matches the actual route (/:urlParam/vista/:contentId) -- this used to point at
    // a non-existent /:urlParam/content/:contentId path.
    const canonicalUrl = `${baseUrl}/${urlParam}/vista/${contentId}`;

    // "{article title} - {author} | Brand" -- used for both the document title and
    // og:title/twitter:title, so a share card reads e.g. "How I Ship - quintice |
    // Vista Content Platform" rather than generic platform branding.
    const articleTitle = content.title || 'Untitled';
    const title = `${articleTitle} - ${urlParam} | Vista Content Platform`;
    const description = truncateDescription(
      content.description ||
        `An article about "${articleTitle}", shared by ${urlParam} on Vista Content Platform.`
    );
    const keywords = content.tags || ['article', 'content', 'insights'];
    
    // Use cover_image first, then preview_image, then Vista logo as fallback
    let ogImage = '/og-image.png';
    if (content.cover_image) {
      ogImage = content.cover_image;
    } else if (content.preview_image) {
      ogImage = content.preview_image;
    } else if (content.content && Array.isArray(content.content)) {
      // Look for the first image in content blocks
      const firstImageBlock = content.content.find((block: any) => {
        const typedBlock = block as ContentBlock;
        return (typedBlock.type === 'image' || typedBlock.media_type === 'image') && 
               (typedBlock.url || typedBlock.media_url);
      }) as ContentBlock | undefined;
      if (firstImageBlock) {
        ogImage = firstImageBlock.url || firstImageBlock.media_url || '/og-image.png';
      }
    }
    
    return {
      title,
      description,
      keywords,
      canonicalUrl,
      ogImage,
      ogType: 'article',
      // This article belongs to a specific creator's page (/:urlParam), not the
      // platform itself -- attribute it (and og:site_name) to them, not "Vista
      // Content Platform". "publisher" is left as the platform, which is accurate:
      // Vista is what's hosting/publishing the piece, the urlParam owner wrote it.
      siteName: urlParam,
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
          "@type": "Person",
          "name": urlParam
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

  useEffect(() => {
    const loadData = async () => {
      if (!urlParam || !contentId) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Missing URL parameters:", { urlParam, contentId });
        }
        navigate('/');
        return;
      }
      
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Loading content detail for urlParam: ${urlParam}, contentId: ${contentId}`);
        }
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
        
        // Note: We removed ownership validation as Vista is a public blog platform
        // Content can be accessed by anyone via the /:urlParam/vista/:contentId route
        
        if (process.env.NODE_ENV === 'development') {
          console.log("Content loaded successfully:", contentItem);
        }
        
        // Process content for rendering
        const processedContent = processNotionContent(contentItem);
        
        // Remove the first image from content if it matches the cover image
        // to prevent duplicate display
        if (processedContent.cover_image && processedContent.content && Array.isArray(processedContent.content)) {
          const filteredContent = processedContent.content.filter((block, index) => {
            // Cast the block to ContentBlock to access the properties safely
            const typedBlock = block as ContentBlock;
            
            // Skip the first image block if it matches the cover image
            if (index === 0 && 
                (typedBlock.type === 'image' || typedBlock.media_type === 'image') && 
                (typedBlock.url === processedContent.cover_image || typedBlock.media_url === processedContent.cover_image)) {
              return false;
            }
            return true;
          });
          processedContent.content = filteredContent;
        }
        
        setContent(processedContent);
        
        // Increment visitor count after successfully loading content
        if (contentItem?.id) {
          await incrementVisitorCount(contentItem.id);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error loading content:", error);
        }
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
        <SEOHead
          title="Loading Content - Vista Content Platform"
          description="Loading content details from Vista Content Platform"
          noIndex={true}
        />
        <PersonalHeader />
        <main className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </main>
        <PersonalFooter userLanguage={ownerProfile?.default_language} 
                supportedLanguages={ownerProfile?.supported_ai_languages} />
      </div>
    );
  }

  const seoData = generateContentSEO();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead {...seoData} />
      <PersonalHeader
        backLabel="Back to All Content"
        backFallbackTo={`/${urlParam}/vista`}
      />

      <main className="mx-auto max-w-4xl p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-3 md:mb-6">{content?.title}</h1>

        {content && <ContentMetadata content={content} />}

        {content && <ContentBody content={content} />}
      </main>
      
      <PersonalFooter userLanguage={ownerProfile?.default_language} 
              supportedLanguages={ownerProfile?.supported_ai_languages} />
    </div>
  );
};

export default UrlParamContentDetail;
