
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
      console.log(`Image loaded: ${src}, dimensions: ${img.width}x${img.height}`);
      setOrientation(img.height > img.width ? "portrait" : "landscape");
      setIsLoading(false);
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      setIsLoading(false);
      setHasError(true);
    };
    img.src = src;
  }, [src]);

  const ratio = orientation === "portrait" ? 4/5 : 16/9;
  
  return (
    <div className={`overflow-hidden rounded-md ${className}`}>
      {isLoading ? (
        <div className="w-full h-full animate-pulse bg-muted" />
      ) : hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
          Image not available
        </div>
      ) : (
        <AspectRatio ratio={ratio}>
          <img
            src={src}
            alt={alt}
            className="object-cover w-full h-full"
          />
        </AspectRatio>
      )}
    </div>
  );
};
