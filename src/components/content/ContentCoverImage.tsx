
import React, { useState } from "react";
import { ImageAspectRatio } from "@/components/ImageAspectRatio";
import { ExtendedContentItem } from "@/utils/notionContentProcessor";

interface ContentCoverImageProps {
  content: ExtendedContentItem;
}

export const ContentCoverImage: React.FC<ContentCoverImageProps> = ({ content }) => {
  const [imageError, setImageError] = useState(false);
  
  // Use cover image if available, fallback to preview image if not
  const imageUrl = content?.cover_image || content?.preview_image;
  
  // Return null if no image is available or if image failed to load
  if (!imageUrl || imageError) return null;
  
  // Use the orientation property from the content if available, default to landscape
  const isPortrait = content.orientation === 'portrait';
  
  // Check if this is a HEIC image
  const isHeic = content.is_heic_cover || (content.preview_is_heic && !content.cover_image);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="mb-8">
      <ImageAspectRatio 
        src={imageUrl} 
        alt={content.title} 
        className="w-full"
        size={isPortrait ? 'portrait' : 'landscape'}
        isHeic={isHeic}
        onError={handleImageError}
        fallback={null}
      />
      {isHeic && !imageError && (
        <div className="mt-2 bg-amber-50 border-l-4 border-amber-500 p-3 text-amber-700 text-sm">
          <p className="font-medium">HEIC image format detected</p>
          <p className="text-xs">This image format is not supported by most browsers. Consider converting it to JPEG or PNG.</p>
        </div>
      )}
    </div>
  );
};
