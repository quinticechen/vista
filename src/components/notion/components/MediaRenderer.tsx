
import React, { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { isHeicImage } from "../utils/image-utils";

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
  
  // Handle both legacy formats and new format
  const imageUrl = media_url || url;
  const imageCaption = caption || text;
  
  // If there's no URL, don't render anything
  if (!imageUrl) return null;
  
  // If image is marked as HEIC or detected as HEIC, show placeholder with message
  const isHeic = is_heic || isHeicImage(imageUrl);
  
  return (
    <figure key={`image-${listPath}-${index}`} className="my-4">
      <div className="bg-muted rounded-md overflow-hidden">
        {isHeic ? (
          <div className="p-4 text-center bg-muted flex items-center justify-center flex-col h-[200px]">
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
          <div className="p-4 text-center bg-muted flex items-center justify-center flex-col h-[200px]">
            <p className="text-sm text-muted-foreground">Failed to load image</p>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              Open image in new tab
            </a>
          </div>
        ) : (
          <AspectRatio ratio={16/9} className="bg-muted">
            <img 
              src={imageUrl} 
              alt={imageCaption || "Image"} 
              className="object-contain w-full h-full"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </AspectRatio>
        )}
      </div>
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
  const [videoError, setVideoError] = useState(false);
  
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
  
  const handleVideoError = () => {
    setVideoError(true);
  };
  
  if (videoError) {
    return (
      <figure key={`video-${listPath}-${index}`} className="my-4">
        <div className="bg-muted rounded-md overflow-hidden">
          <div className="p-4 text-center bg-muted flex items-center justify-center flex-col h-[200px]">
            <p className="text-sm text-muted-foreground">Failed to load video</p>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              Open video in new tab
            </a>
          </div>
        </div>
        {videoCaption && (
          <figcaption className="text-sm text-center text-muted-foreground mt-2">
            {videoCaption}
          </figcaption>
        )}
      </figure>
    );
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
              onError={handleVideoError}
            />
          </AspectRatio>
        ) : (
          <AspectRatio ratio={16/9}>
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full" 
              preload="metadata"
              onError={handleVideoError}
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
  const [embedError, setEmbedError] = useState(false);
  
  // If there's no URL, don't render anything
  if (!media_url) return null;
  
  const handleEmbedError = () => {
    setEmbedError(true);
  };
  
  if (embedError) {
    return (
      <figure key={`embed-${listPath}-${index}`} className="my-4">
        <div className="bg-muted rounded-md overflow-hidden">
          <div className="p-4 text-center bg-muted flex items-center justify-center flex-col h-[200px]">
            <p className="text-sm text-muted-foreground">Failed to load embedded content</p>
            <a 
              href={media_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              Open content in new tab
            </a>
          </div>
        </div>
        {caption && (
          <figcaption className="text-sm text-center text-muted-foreground mt-2">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }
  
  return (
    <figure key={`embed-${listPath}-${index}`} className="my-4">
      <div className="bg-muted rounded-md overflow-hidden">
        <AspectRatio ratio={16/9}>
          <iframe
            src={media_url}
            title={caption || "Embedded content"}
            className="w-full h-full"
            allowFullScreen
            onError={handleEmbedError}
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
