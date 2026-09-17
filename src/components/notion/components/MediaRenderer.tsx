
import React, { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { isHeicImage } from "../utils/image-utils";
import { ImageLightbox } from "@/components/ImageLightbox";

interface MediaProps {
  type: "image" | "video" | "embed";
  media_url?: string;
  url?: string;
  caption?: string;
  text?: string;
  is_heic?: boolean;
  index: number;
  listPath: string;
}

// Component for rendering images
export const ImageRenderer: React.FC<MediaProps> = ({
  media_url,
  url,
  caption,
  text,
  is_heic,
  index,
  listPath
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Handle both legacy formats and new format
  const imageUrl = media_url || url;
  const imageCaption = caption || text;

  // If there's no URL, don't render anything
  if (!imageUrl) return null;

  // If image is marked as HEIC or detected as HEIC, show placeholder with message
  const isHeic = is_heic || isHeicImage(imageUrl);

  return (
    <figure key={`image-${listPath}-${index}`} className="my-4">
      {isHeic ? (
        <div className="bg-muted rounded-md overflow-hidden p-4 text-center flex items-center justify-center flex-col h-[200px]">
          <p className="text-sm text-muted-foreground mb-2">
            HEIC image format not supported in browser
          </p>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline"
          >
            Open original image
          </a>
        </div>
      ) : imageError ? (
        <div className="bg-muted rounded-md overflow-hidden p-4 text-center flex items-center justify-center flex-col h-[200px]">
          <p className="text-sm text-muted-foreground">Failed to load image</p>
        </div>
      ) : (
        <>
          {/* Width always fills the content column; height always follows the image's
              own ratio, uncropped -- on both mobile and desktop. A forced 400px desktop
              height (tried previously) crops wide images and shrinks tall/portrait ones
              down to a sliver of the column width, losing content either way. No
              separate aspect-ratio wrapper either, so the box always matches the image. */}
          <img
            src={imageUrl}
            alt={imageCaption || "Image"}
            className="block w-full h-auto object-contain rounded-md bg-muted cursor-zoom-in"
            onError={() => setImageError(true)}
            onClick={() => setIsLightboxOpen(true)}
            loading="lazy"
          />
          {isLightboxOpen && (
            <ImageLightbox
              src={imageUrl}
              alt={imageCaption || "Image"}
              onClose={() => setIsLightboxOpen(false)}
            />
          )}
        </>
      )}
      {imageCaption && (
        <figcaption className="text-sm text-center text-muted-foreground mt-2">
          {imageCaption}
        </figcaption>
      )}
    </figure>
  );
};

// Component for rendering videos
export const VideoRenderer: React.FC<MediaProps> = ({ 
  media_url, 
  url, 
  caption, 
  text,
  index, 
  listPath 
}) => {
  // Handle both legacy formats and new format
  const videoUrl = media_url || url;
  const videoCaption = caption || text;
  
  // If there's no URL, don't render anything
  if (!videoUrl) return null;
  
  // Support for YouTube embeds
  const isYoutube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  
  // Extract YouTube video ID for embedding
  let youtubeEmbedUrl = videoUrl;
  if (isYoutube) {
    const videoId = videoUrl.includes("youtube.com/watch?v=") 
      ? new URL(videoUrl).searchParams.get("v")
      : videoUrl.includes("youtu.be/") 
        ? videoUrl.split("youtu.be/")[1]?.split("&")[0] 
        : null;
        
    if (videoId) {
      youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  return (
    <figure key={`video-${listPath}-${index}`} className="my-4">
      <div className="bg-muted rounded-md overflow-hidden">
        {isYoutube ? (
          <AspectRatio ratio={16/9}>
            <iframe
              src={youtubeEmbedUrl}
              title={videoCaption || "Embedded video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </AspectRatio>
        ) : (
          <AspectRatio ratio={16/9}>
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full" 
              preload="metadata"
            />
          </AspectRatio>
        )}
      </div>
      {videoCaption && (
        <figcaption className="text-sm text-center text-muted-foreground mt-2">
          {videoCaption}
        </figcaption>
      )}
    </figure>
  );
};

// Component for rendering embeds
export const EmbedRenderer: React.FC<MediaProps> = ({ 
  media_url, 
  caption, 
  index, 
  listPath 
}) => {
  // If there's no URL, don't render anything
  if (!media_url) return null;
  
  return (
    <figure key={`embed-${listPath}-${index}`} className="my-4">
      <div className="bg-muted rounded-md overflow-hidden">
        <AspectRatio ratio={16/9}>
          <iframe
            src={media_url}
            title={caption || "Embedded content"}
            className="w-full h-full"
            allowFullScreen
          />
        </AspectRatio>
      </div>
      {caption && (
        <figcaption className="text-sm text-center text-muted-foreground mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// Remove the duplicate export line that was causing the errors
// export { ImageRenderer, VideoRenderer, EmbedRenderer };
