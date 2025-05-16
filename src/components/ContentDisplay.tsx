
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  similarity?: number;
  content?: any[];
}

interface ContentDisplayItemProps {
  content: ContentItem;
  urlPrefix?: string;
  index?: number;
}

export const ContentDisplayItem = ({ content, urlPrefix = "", index = 0 }: ContentDisplayItemProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  
  // Format date using local date format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get route to content detail
  const getDetailRoute = () => {
    if (urlPrefix) {
      return `${urlPrefix}/${content.id}`;
    }
    return `/vista/${content.id}`;
  };

  // Determine if media should be on left or right (alternating)
  const isMediaRight = index % 2 === 0;
  
  // Fetch the first media for this content item
  useEffect(() => {
    const fetchFirstMedia = async () => {
      try {
        console.log("Fetching media for content:", content.id);
        setMediaUrl(null);
        setMediaType(null);
        setIsMediaLoading(true);
        setMediaError(false);
        
        // First try to extract media from content blocks
        if (content.content && content.content.length > 0) {
          console.log("Content blocks:", content.content.length);
          
          for (const block of content.content) {
            // Check for image in content blocks
            if (block.type === 'image' && block.media_url) {
              console.log("Found image in content:", block.media_url);
              setMediaUrl(block.media_url);
              setMediaType('image');
              return;
            } 
            // Check for video in content blocks
            else if (block.type === 'video' && block.media_url) {
              console.log("Found video in content:", block.media_url);
              setMediaUrl(block.media_url);
              setMediaType('video');
              return;
            }
            // Check for media type image
            else if (block.type === 'media' && block.media_type === 'image' && block.media_url) {
              console.log("Found media image in content:", block.media_url);
              setMediaUrl(block.media_url);
              setMediaType('image');
              return;
            }
            // Check for media type video
            else if (block.type === 'media' && block.media_type === 'video' && block.media_url) {
              console.log("Found media video in content:", block.media_url);
              setMediaUrl(block.media_url);
              setMediaType('video');
              return;
            }
            // Check for url property (backward compatibility)
            else if ((block.type === 'image' || block.type === 'video') && block.url) {
              console.log(`Found ${block.type} with url in content:`, block.url);
              setMediaUrl(block.url);
              setMediaType(block.type === 'image' ? 'image' : 'video');
              return;
            }
          }
          console.log("No media found in content blocks");
        } else {
          console.log("No content blocks available");
        }

        // Fallback: Try to fetch from image_contents table
        try {
          console.log("Trying to fetch from image_contents table");
          const { data: imageData, error: imageError } = await supabase
            .from('image_contents')
            .select('image_url')
            .eq('content_id', content.id)
            .limit(1);

          if (imageError) {
            console.log("Error fetching image:", imageError);
          }

          if (imageData && imageData.length > 0 && imageData[0].image_url) {
            console.log("Found image in image_contents:", imageData[0].image_url);
            setMediaUrl(imageData[0].image_url);
            setMediaType('image');
            return;
          }
        } catch (imageError) {
          console.error("Error in image fetch:", imageError);
        }

        // Fallback: Try to fetch from video_contents table
        try {
          console.log("Trying to fetch from video_contents table");
          const { data: videoData, error: videoError } = await supabase
            .from('video_contents')
            .select('thumbnail_url, video_url')
            .eq('content_id', content.id)
            .limit(1);

          if (videoError) {
            console.log("Error fetching video:", videoError);
          }

          if (videoData && videoData.length > 0) {
            if (videoData[0].thumbnail_url) {
              console.log("Found thumbnail in video_contents:", videoData[0].thumbnail_url);
              setMediaUrl(videoData[0].thumbnail_url);
              setMediaType('image');
              return;
            } else if (videoData[0].video_url) {
              console.log("Found video in video_contents:", videoData[0].video_url);
              setMediaUrl(videoData[0].video_url);
              setMediaType('video');
              return;
            }
          }
        } catch (videoError) {
          console.error("Error in video fetch:", videoError);
        }
      } catch (error) {
        console.error("Error fetching media:", error);
        setMediaError(true);
      } finally {
        setIsMediaLoading(false);
      }
    };

    fetchFirstMedia();
  }, [content.id, content.content]);

  const handleMediaLoadError = () => {
    console.error(`Media failed to load: ${mediaUrl}`);
    setMediaError(true);
  };

  return (
    <Card
      className={`group h-[400px] overflow-hidden flex ${mediaUrl ? 'w-full' : 'w-full'} flex-row hover:shadow-md transition-shadow duration-200`}
    > 
      {/* Text Content Section - Always present */}
      <div className={`${mediaUrl ? 'w-1/2' : 'w-full'} flex flex-col ${isMediaRight ? 'order-first' : 'order-last'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {content.category || "Type"}
            </Badge>

            {(content.start_date || content.end_date) && (
              <div className="flex items-center text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>
                  {formatDate(content.start_date)}
                  {content.end_date && content.start_date !== content.end_date && ` - ${formatDate(content.end_date)}`}
                </span>
              </div>
            )}
          </div>

          <h3 className="text-lg font-medium leading-tight group-hover:text-primary transition-colors duration-200">
            {content.title}
          </h3>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          {/* Description display */}
          {content.description && (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {content.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start pt-2 gap-2 mt-auto">
          <div className="flex flex-wrap gap-1 w-full">
            {content.tags && content.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}

            {content.tags && content.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{content.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between w-full mt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <ClockIcon className="h-3 w-3 mr-1" />
              <span>{formatDate(content.created_at)}</span>
            </div>

            {content.similarity !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {Math.round(content.similarity * 100)}% match
              </span>
            )}
          </div>

          <Button
            size="sm"
            className="w-full mt-2"
            asChild
          >
            <Link to={getDetailRoute()}>
              Learn More
            </Link>
          </Button>
        </CardFooter>
      </div>

      {/* Media Section - Only show if we have media */}
      {mediaUrl && (
        <div 
          className={`w-1/2 h-[400px] overflow-hidden ${isMediaRight ? 'order-last' : 'order-first'}`}
        >
          {isMediaLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">
              <span className="text-muted-foreground">Loading media...</span>
            </div>
          ) : mediaError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 mb-2 text-muted-foreground/70" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p>Media not available</p>
            </div>
          ) : mediaType === 'image' ? (
            <RenderImage url={mediaUrl} title={content.title} />
          ) : mediaType === 'video' ? (
            <RenderVideo url={mediaUrl} title={content.title} />
          ) : null}
        </div>
      )}
    </Card>
  );
};

// Helper component to render images with appropriate aspect ratio
const RenderImage = ({ url, title }: { url: string; title: string }) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setIsPortrait(img.height > img.width);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">
        <span className="text-muted-foreground">Loading image...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8 mb-2 text-muted-foreground/70" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        <p>Image not available</p>
      </div>
    );
  }

  // Use 8:9 ratio for portrait and 16:9 for landscape
  const ratio = isPortrait ? 8/9 : 16/9;

  return (
    <AspectRatio ratio={ratio} className="h-full w-full">
      <img
        src={url}
        alt={title}
        className="object-cover w-full h-full"
        loading="lazy"
        onError={(e) => {
          console.error(`Image failed to load: ${url}`);
          setError(true);
          // Prevent infinite error loop
          e.currentTarget.onerror = null;
        }}
      />
    </AspectRatio>
  );
};

// Helper component to render videos/YouTube with appropriate handling
const RenderVideo = ({ url, title }: { url: string; title: string }) => {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  
  if (isYouTube) {
    const thumbnailUrl = getYouTubeThumbnail(url);
    return (
      <div className="relative w-full h-full">
        <img
          src={thumbnailUrl}
          alt={`${title} video thumbnail`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-white ml-1"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <video
        src={url}
        poster={url + "?poster=true"} // Many video APIs support this pattern
        controls={false}
        muted
        className="max-h-full max-w-full object-contain"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-white ml-1"></div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get YouTube thumbnail from URL
function getYouTubeThumbnail(url: string): string {
  try {
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      videoId = new URL(url).searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = new URL(url).pathname.split('/').pop()?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    }
    
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  } catch (e) {
    console.error("Error parsing YouTube URL:", e);
  }
  
  return url;
}
