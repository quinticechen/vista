
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { isHeicImage } from './notion/utils/image-utils';

interface ImageAspectRatioProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'landscape' | 'portrait' | 'square';
  isHeic?: boolean;
}

export const ImageAspectRatio: React.FC<ImageAspectRatioProps> = ({ 
  src, 
  alt, 
  className,
  size = 'landscape',
  isHeic: propIsHeic
}) => {
  const [error, setError] = useState(false);
  
  // Calculate aspect ratio based on size prop
  const aspectRatio = size === 'portrait' ? 3/4 : size === 'square' ? 1 : 16/9;
  
  // Check if this is a HEIC image
  const isHeic = propIsHeic || isHeicImage(src);
  
  if (isHeic) {
    return (
      <div className={cn(
        "bg-muted flex items-center justify-center", 
        className
      )}>
        <div className="p-4 text-center flex items-center justify-center flex-col h-full">
          <p className="text-sm text-muted-foreground mb-2">
            HEIC image format not supported in browser
          </p>
          <a 
            href={src} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline"
          >
            Open original image
          </a>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={cn(
        "bg-muted flex items-center justify-center", 
        className
      )}>
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Failed to load image</p>
          <a 
            href={src} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline mt-2"
          >
            Open image in new tab
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <AspectRatio 
      ratio={aspectRatio} 
      className={cn("bg-muted overflow-hidden", className)}
    >
      <img 
        src={src} 
        alt={alt} 
        className="object-cover w-full h-full"
        onError={() => setError(true)}
        loading="lazy"
      />
    </AspectRatio>
  );
};

export default ImageAspectRatio;
