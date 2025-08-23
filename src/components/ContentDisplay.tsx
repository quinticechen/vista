
import React, { useState } from "react";

import { useI18n } from "@/hooks/use-i18n";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ContentItem } from "@/services/adminService";
import { Badge } from "@/components/ui/badge";
import { Json } from "@/integrations/supabase/types";
import { getContentOwnerUrlParam } from "@/services/urlParamService";
import { useNavigate } from "react-router-dom";

export interface ContentDisplayItemProps {
  content: ContentItem;
  urlPrefix?: string;
  index?: number;
  showStatus?: boolean;
}

// Helper function to check if content has media
const hasMediaInContent = (content: Json | any[] | undefined): boolean => {
  if (!content) return false;
  
  // Handle array content
  if (Array.isArray(content)) {
    return content.some((block: any) => 
      (block?.media_type === 'image' && block?.media_url) || 
      (block?.type === 'image' && block?.url) ||
      (block?.media_type === 'video' && block?.media_url));
  }
  
  // Handle Json case - try to parse if it's a string
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.some((block: any) => 
          (block?.media_type === 'image' && block?.media_url) || 
          (block?.type === 'image' && block?.url) ||
          (block?.media_type === 'video' && block?.media_url));
      }
    } catch (e) {
      console.error("Error parsing content string:", e);
      return false;
    }
  }
  return false;
}

// Helper function to find media block
const findMediaBlock = (content: Json | any[] | undefined): any => {
  if (!content) return null;
  
  // Ensure we're working with an array
  let contentArray: any[] = [];
  
  if (Array.isArray(content)) {
    contentArray = content;
  } else if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        contentArray = parsed;
      }
    } catch (e) {
      console.error("Error parsing content in findMediaBlock:", e);
      return null;
    }
  } else if (content && typeof content === 'object') {
    return null;
  }

  // First, search for images in the top level blocks
  let mediaBlock = contentArray.find((block: any) => 
    (block?.media_type === 'image' && block?.media_url) || 
    (block?.type === 'image' && block?.url) ||
    (block?.media_type === 'video' && block?.media_url));
  
  // If no media found at top level, recursively search in children
  if (!mediaBlock) {
    for (const block of contentArray) {
      if (block.children && Array.isArray(block.children)) {
        mediaBlock = block.children.find((child: any) => 
          (child?.media_type === 'image' && child?.media_url) || 
          (child?.type === 'image' && child?.url) ||
          (child?.media_type === 'video' && child?.media_url));
        
        if (mediaBlock) break;
        
        if (block.type === 'column_list') {
          for (const column of block.children) {
            if (column.children && Array.isArray(column.children)) {
              mediaBlock = column.children.find((child: any) => 
                (child?.media_type === 'image' && child?.media_url) || 
                (child?.type === 'image' && child?.url) ||
                (child?.media_type === 'video' && child?.media_url));
              
              if (mediaBlock) break;
            }
          }
        }
      }
    }
  }
  
  // Normalize the media URL
  if (mediaBlock) {
    if (!mediaBlock.media_url && mediaBlock.url) {
      mediaBlock.media_url = mediaBlock.url;
    }
  }
  
  return mediaBlock;
}

export const ContentDisplayItem = ({ 
  content, 
  urlPrefix = '', 
  index = 0,
  showStatus = false 
}: ContentDisplayItemProps) => {
  const { t, i18n } = useI18n();
  const isRTL = i18n.language === 'ar';
  const [imageError, setImageError] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const navigate = useNavigate();
  
  // Deep check content's structure to find images
  const normalizedContent = { ...content };
  
  // If content.content is a string, try to parse it
  if (normalizedContent.content && typeof normalizedContent.content === 'string') {
    try {
      normalizedContent.content = JSON.parse(normalizedContent.content);
    } catch (e) {
      console.error(`Error parsing content for item ${content.id}:`, e);
    }
  }
  
  // Check for cover image first, then look for media in content
  const hasCoverImage = !!normalizedContent.cover_image;
  const mediaBlock = !hasCoverImage ? findMediaBlock(normalizedContent.content) : null;
  const mediaUrl = hasCoverImage ? normalizedContent.cover_image : (mediaBlock?.media_url || null);
  
  console.log(`ContentDisplay - Content ID: ${normalizedContent.id}, Title: ${normalizedContent.title}`);
  console.log(`ContentDisplay - Has cover image: ${hasCoverImage}, Cover image URL: ${normalizedContent.cover_image}`);
  console.log(`ContentDisplay - Media block found:`, mediaBlock);
  console.log(`ContentDisplay - Final mediaUrl: ${mediaUrl}`);
  
  const hasMedia = !!mediaUrl && !imageError && mediaLoaded;
  const isMediaRight = index % 2 === 0;
  
  // Function to handle navigation to content detail
  const handleContentClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (urlPrefix) {
      // Direct navigation when we have a urlPrefix
      navigate(`${urlPrefix}/vista/${normalizedContent.id}`);
    } else {
      // For global vista page, get the content owner's urlParam first
      try {
        const ownerUrlParam = await getContentOwnerUrlParam(normalizedContent.id);
        if (ownerUrlParam) {
          navigate(`/${ownerUrlParam}/vista/${normalizedContent.id}`);
        } else {
          // Fallback: stay on vista page if we can't find owner
          console.error('Could not find owner URL parameter for content:', normalizedContent.id);
        }
      } catch (error) {
        console.error('Error getting content owner URL param:', error);
      }
    }
  };

  const handleImageError = () => {
    console.log('Image failed to load, switching to text-only layout');
    setImageError(true);
    setMediaLoaded(false);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setMediaLoaded(true);
  };

  const handleVideoError = () => {
    console.log('Video failed to load, switching to text-only layout');
    setImageError(true);
    setMediaLoaded(false);
  };

  return (
    <Card
      className={`group ${hasMedia ? 'h-[400px]' : 'h-auto'} overflow-hidden flex flex-row hover:shadow-md transition-shadow duration-200`}
    > 
      {/* Text Content Section - Always present */}
      <div className={`${hasMedia ? 'flex-1' : 'w-full'} flex flex-col ${isMediaRight ? 'order-first' : 'order-last'} justify-center`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            {normalizedContent.category && (
              <Badge variant="outline" className="text-xs">
                {normalizedContent.category}
              </Badge>
            )}

            {(normalizedContent.start_date || normalizedContent.end_date) && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {formatDate(normalizedContent.start_date)}
                  {normalizedContent.end_date && normalizedContent.start_date !== normalizedContent.end_date && 
                    ` - ${formatDate(normalizedContent.end_date)}`}
                </span>
              </div>
            )}
          </div>

          <h3 className="text-lg font-medium leading-tight group-hover:text-primary transition-colors duration-200">
            {normalizedContent.title}
          </h3>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          {normalizedContent.description && (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {normalizedContent.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start pt-2 gap-2">
          <div className="flex flex-wrap gap-1 w-full">
            {normalizedContent.tags && normalizedContent.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}

            {normalizedContent.tags && normalizedContent.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{normalizedContent.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between w-full mt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(normalizedContent.created_at)}</span>
            </div>

            {normalizedContent.similarity !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {Math.round(normalizedContent.similarity * 100)}% match
              </span>
            )}
          </div>

          <Button
            size="sm"
            className="w-full mt-2"
            onClick={handleContentClick}
          >
            Learn More
          </Button>
        </CardFooter>
      </div>

      {/* Media Section - Only show if we have media URL and it loaded successfully */}
      {mediaUrl && (
        <div 
          className={`relative ${isMediaRight ? 'order-last' : 'order-first'} bg-gray-100 h-[400px]`}
          style={{ flexShrink: 0 }}
        >
          {hasCoverImage || (mediaBlock?.media_type === 'image') ? (
            <img 
              src={mediaUrl} 
              alt={hasCoverImage ? normalizedContent.title : (mediaBlock?.caption || normalizedContent.title)}
              className="object-cover w-full h-full"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          ) : mediaBlock?.media_type === 'video' ? (
            <video 
              src={mediaUrl} 
              controls 
              className="object-cover w-full h-full"
              playsInline
              preload="metadata"
              onError={handleVideoError}
              onLoadedData={handleImageLoad}
            >
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>
      )}
    </Card>
  );
};
