
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

  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.onload = () => {
      console.log(`Image loaded: ${src}, dimensions: ${img.width}x${img.height}`);
      setOrientation(img.height > img.width ? "portrait" : "landscape");
      setIsLoading(false);
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  const ratio = orientation === "portrait" ? 8/9 : 16/9;
  
  return (
    <div className={`overflow-hidden rounded-md bg-muted ${className}`}>
      {isLoading ? (
        <div className="w-full h-full animate-pulse bg-muted/50" />
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
