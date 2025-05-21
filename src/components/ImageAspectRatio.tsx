
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState, useEffect } from "react";
import { isHeicImage as checkIsHeicImage } from "@/components/notion/utils/image-utils";

interface ImageAspectRatioProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: number;
  size?: "portrait" | "landscape" | "square";
  isHeic?: boolean;
}

export const ImageAspectRatio: React.FC<ImageAspectRatioProps> = ({
  aspectRatio,
  className,
  src,
  alt,
  size = "landscape",
  isHeic: initialIsHeic = false,
  ...props
}) => {
  const [error, setError] = useState(false);
  const [isHeic, setIsHeic] = useState(initialIsHeic);

  // Check if the image is a HEIC file on mount or when src changes
  useEffect(() => {
    if (initialIsHeic || (src && checkIsHeicImage(src.toString()))) {
      setIsHeic(true);
      setError(true);
    }
  }, [src, initialIsHeic]);

  // Default aspect ratios
  const getAspectRatio = () => {
    if (aspectRatio) return aspectRatio;
    
    switch (size) {
      case "portrait":
        return 3/4; // Portrait ratio for media display
      case "square":
        return 1;
      case "landscape":
      default:
        return 16/9; // Landscape ratio for media display
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setError(true);
    
    // Check if the image is a HEIC file
    const imgSrc = src?.toString().toLowerCase() || '';
    if (imgSrc.endsWith('.heic') || imgSrc.includes('heic')) {
      setIsHeic(true);
      console.warn("HEIC image format detected:", imgSrc);
    }
    
    // Call the original onError handler if provided
    if (props.onError) {
      props.onError(e);
    }
  };

  return (
    <AspectRatio 
      ratio={getAspectRatio()} 
      className={cn(
        "overflow-hidden rounded-md border", 
        error ? "bg-muted" : "",
        className
      )}
    >
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 mb-2 text-muted"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span className="text-sm font-medium">
            {isHeic ? "HEIC format not supported by browser" : "Failed to load image"}
          </span>
          {isHeic && (
            <>
              <span className="text-xs mt-1 text-center">This image format requires conversion to be displayed</span>
              <span className="text-xs mt-1 text-center text-amber-500">Try using PNG or JPEG formats instead</span>
            </>
          )}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || "Image"}
          className={cn("object-cover w-full h-full", error ? "opacity-0" : "opacity-100")}
          onError={handleError}
          {...props}
        />
      )}
    </AspectRatio>
  );
};
