
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageAspectRatio } from "./ImageAspectRatio";
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
}

export const ContentDisplayItem = ({ content, urlPrefix = "" }: ContentDisplayItemProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  
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

  // Fetch the first media for this content item
  useEffect(() => {
    const fetchFirstMedia = async () => {
      try {
        console.log("Fetching media for content:", content.id);
        setMediaUrl(null);
        setMediaType(null);
        
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
      }
    };

    fetchFirstMedia();
  }, [content.id, content.content]);

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
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

      <CardContent className="pb-2 space-y-4 flex-1">
        {/* Media content display section */}
        {mediaUrl && mediaType === 'image' && (
          <div className="h-[180px] overflow-hidden rounded">
            <ImageAspectRatio 
              src={mediaUrl} 
              alt={content.title} 
              className="w-full h-full"
            />
          </div>
        )}

        {mediaUrl && mediaType === 'video' && (
          <div className="h-[180px] overflow-hidden rounded flex items-center justify-center bg-gray-100">
            {/* YouTube thumbnail fallback */}
            {mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? (
              <div className="w-full h-full relative">
                <ImageAspectRatio 
                  src={getYouTubeThumbnail(mediaUrl)}
                  alt={`${content.title} video thumbnail`}
                  className="w-full h-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-white ml-1"></div>
                  </div>
                </div>
              </div>
            ) : (
              <video 
                src={mediaUrl} 
                controls={false}
                muted
                className="max-h-full max-w-full object-cover" 
              />
            )}
          </div>
        )}

        {/* Description display */}
        {content.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {content.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start pt-2 gap-2">
        <div className="flex flex-wrap gap-1 w-full">
          {content.tags && content.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
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
    </Card>
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
