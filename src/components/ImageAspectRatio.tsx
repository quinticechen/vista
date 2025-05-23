
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { isHeicImage } from '@/utils/notionContentProcessor';

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
  const [loaded, setLoaded] = useState(false);
  
  // Calculate aspect ratio based on size prop
  const aspectRatio = size === 'portrait' ? 3/4 : size === 'square' ? 1 : 16/9;
  
  // Check if this is a HEIC image
  const isHeic = propIsHeic || isHeicImage(src);
  
  // Reset error state when src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);
  
  if (isHeic) {
    return (
      <AspectRatio 
        ratio={aspectRatio} 
        className={cn("bg-muted overflow-hidden rounded-md", className)}
      >
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
      </AspectRatio>
    );
  }
  
  if (error) {
    return (
      <AspectRatio 
        ratio={aspectRatio} 
        className={cn("bg-muted overflow-hidden rounded-md", className)}
      >
        <div className="p-4 text-center flex items-center justify-center flex-col h-full">
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
      </AspectRatio>
    );
  }
  
  return (
    <AspectRatio 
      ratio={aspectRatio} 
      className={cn("bg-muted overflow-hidden rounded-md", className)}
    >
      <img 
        src={src} 
        alt={alt} 
        className={cn(
          "object-cover w-full h-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </AspectRatio>
  );
};

export default ImageAspectRatio;
