
import React from "react";
import { ImageAspectRatio } from "@/components/ImageAspectRatio";
import { ExtendedContentItem } from "@/utils/notionContentProcessor";

interface ContentCoverImageProps {
  content: ExtendedContentItem;
}

export const ContentCoverImage: React.FC<ContentCoverImageProps> = ({ content }) => {
  if (!content?.cover_image) return null;
  
  // Use the orientation property from the content if available, default to landscape
  const isPortrait = content.orientation === 'portrait';

  return (
    <div className="mb-8">
      <ImageAspectRatio 
        src={content.cover_image} 
        alt={content.title} 
        className="w-full"
        size={isPortrait ? 'portrait' : 'landscape'}
        isHeic={content.is_heic_cover}
      />
      {content.is_heic_cover && (
        <div className="mt-2 bg-amber-50 border-l-4 border-amber-500 p-3 text-amber-700 text-sm">
          <p className="font-medium">HEIC image format detected</p>
          <p className="text-xs">This image format is not supported by most browsers. Consider converting it to JPEG or PNG.</p>
        </div>
      )}
    </div>
  );
};
