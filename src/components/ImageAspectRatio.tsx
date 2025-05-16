
import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageAspectRatioProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageAspectRatio = ({ src, alt, className = "" }: ImageAspectRatioProps) => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if URL is an Amazon S3 URL with security tokens that might expire
  const isS3Url = src && (src.includes('s3.amazonaws.com') || src.includes('X-Amz-'));

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    const img = new Image();
    
    img.onload = () => {
      console.log(`Image loaded successfully: ${src}, dimensions: ${img.width}x${img.height}`);
      setOrientation(img.height > img.width ? "portrait" : "landscape");
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      setIsLoading(false);
      setHasError(true);
      
      // If it's an S3 URL that failed and we haven't tried too many times, we might retry
      if (isS3Url && retryCount < 1) {
        console.log(`Retrying S3 image load: ${src}`);
        setRetryCount(prev => prev + 1);
        // Force a re-render which will trigger this effect again
        setTimeout(() => {
          setIsLoading(true);
        }, 1000);
      }
    };
    
    img.src = src;
    
    // Clean up function for when component unmounts
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, retryCount, isS3Url]);

  // Determine aspect ratio based on orientation
  const ratio = orientation === "portrait" ? 4/5 : 16/9;
  
  return (
    <div className={`overflow-hidden rounded-md ${className}`}>
      {isLoading ? (
        <div className="w-full h-full animate-pulse bg-muted flex items-center justify-center min-h-[180px]">
          <span className="text-muted-foreground text-sm">Loading image...</span>
        </div>
      ) : hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground text-sm min-h-[180px]">
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
          {isS3Url && (
            <p className="text-xs mt-1 text-muted-foreground/70">S3 link may have expired</p>
          )}
        </div>
      ) : (
        <AspectRatio ratio={ratio}>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="object-cover w-full h-full"
            onError={(e) => {
              // Handle errors that occur after initial load
              console.error(`Image error during render: ${src}`);
              setHasError(true);
              // Prevents infinite error loop
              e.currentTarget.onerror = null;
            }}
          />
        </AspectRatio>
      )}
    </div>
  );
};
