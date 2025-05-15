
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
      setOrientation(img.height > img.width ? "portrait" : "landscape");
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  return (
    <div className={`overflow-hidden rounded-md bg-muted ${className}`}>
      {isLoading ? (
        <div className="w-full h-full animate-pulse bg-muted/50" />
      ) : (
        <AspectRatio ratio={orientation === "portrait" ? 8/9 : 16/9}>
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
