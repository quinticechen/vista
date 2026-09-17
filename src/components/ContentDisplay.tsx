
import React, { useState } from "react";

import { useI18n } from "@/hooks/use-i18n";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
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
  
  // Reserve layout space as soon as we know there's a usable media URL, instead of
  // waiting for the image/video to finish loading. Gating the width/height classes on
  // `mediaLoaded` caused a text-only layout to render first, then jump to a split
  // layout once the media loaded (or stay broken if it failed) -- this is what caused
  // the overflow/broken layout on both mobile and desktop when an image was present.
  const hasMediaUrl = !!mediaUrl && !imageError;
  const hasDescription = !!normalizedContent.description;
  const isMediaRight = index % 2 === 0;

  // "Time" shows the start/end range when the item has one (matching the design),
  // falling back to the created date otherwise.
  const timeLabel = normalizedContent.start_date
    ? `${formatDate(normalizedContent.start_date)}${
        normalizedContent.end_date && normalizedContent.end_date !== normalizedContent.start_date
          ? ` ~ ${formatDate(normalizedContent.end_date)}`
          : ''
      }`
    : formatDate(normalizedContent.created_at);
  
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

  // Type + Time always sit on the same row, on both mobile and desktop.
  const typeTimeRow = (normalizedContent.category || timeLabel) && (
    <div className="flex items-center gap-3">
      {normalizedContent.category && (
        <Badge variant="outline" className="text-xs w-fit shrink-0">
          {normalizedContent.category}
        </Badge>
      )}
      <div className="flex items-center text-xs text-muted-foreground shrink-0">
        <Clock className="h-3 w-3 mr-1" />
        <span>{timeLabel}</span>
      </div>
    </div>
  );

  const title = (
    <h3 className="text-lg font-medium leading-tight group-hover:text-primary transition-colors duration-200">
      {normalizedContent.title}
    </h3>
  );

  const description = hasDescription && (
    <p className="text-sm text-muted-foreground line-clamp-3">
      {normalizedContent.description}
    </p>
  );

  // Media is rendered directly (no separate sizing wrapper) so its box always matches
  // the actual displayed image/video -- a wrapper with its own height caused empty
  // background to show above/below whenever the image had to shrink to fit.
  const renderMedia = (mediaClassName: string) =>
    hasMediaUrl &&
    ((hasCoverImage || mediaBlock?.media_type === 'image') ? (
      <img
        src={mediaUrl}
        alt={hasCoverImage ? normalizedContent.title : (mediaBlock?.caption || normalizedContent.title)}
        className={`${mediaClassName} bg-gray-100 transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    ) : mediaBlock?.media_type === 'video' ? (
      <video
        src={mediaUrl}
        controls
        className={`${mediaClassName} bg-gray-100 transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        preload="metadata"
        onError={handleVideoError}
        onLoadedData={handleImageLoad}
        onClick={(e) => e.stopPropagation()}
      >
        Your browser does not support the video tag.
      </video>
    ) : null);

  return (
    <Card
      onClick={handleContentClick}
      className="group overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      {/* Mobile layout: title full-width on top, then a row pairing the description
          with a small thumbnail (or a full-width image when there's no description),
          then the Type/Time row. Kept as its own DOM tree (rather than reusing the
          desktop tree with responsive classes) because the image moves from being a
          small inline thumbnail to a full card-height column -- two different parents,
          not just a resize. */}
      <div className="md:hidden flex flex-col gap-3 p-6">
        {title}

        {(hasDescription || hasMediaUrl) && (
          <div className={`flex gap-3 items-start ${!isMediaRight ? 'flex-row-reverse' : ''}`}>
            {description}
            {renderMedia(
              hasDescription
                ? 'w-20 h-auto shrink-0 object-contain'
                : 'w-full h-auto object-contain'
            )}
          </div>
        )}

        {typeTimeRow}
      </div>

      {/* Desktop layout: media fills the full 400px-tall side (cropped only if its
          natural width would exceed 2/3 of the card), text column stacked next to it. */}
      <div className={`hidden md:flex ${hasMediaUrl ? 'h-[400px]' : 'h-auto'}`}>
        {renderMedia(
          `h-full w-auto max-w-[66.6667%] shrink-0 object-cover ${isMediaRight ? 'order-last' : 'order-first'}`
        )}

        <div
          className={`${hasMediaUrl ? 'flex-1 min-w-0' : 'w-full'} flex flex-col gap-3 p-6 justify-center ${isMediaRight ? 'order-first' : 'order-last'}`}
        >
          {title}
          {description}
          {typeTimeRow}
        </div>
      </div>
    </Card>
  );
};
