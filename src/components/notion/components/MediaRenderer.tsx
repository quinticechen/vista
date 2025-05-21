
import React from "react";
import { toast } from "@/components/ui/sonner";
import { ImageAspectRatio } from "@/components/ImageAspectRatio";
import { isHeicImage } from "../utils/image-utils";

interface MediaProps {
  type: string;
  url?: string;
  media_url?: string;
  caption?: string;
  text?: string;
  is_heic?: boolean;
  index: number;
  listPath: string;
}

export const ImageRenderer: React.FC<MediaProps> = ({
  url,
  media_url,
  caption,
  text,
  is_heic,
  index,
  listPath
}) => {
  // Use either media_url or url, whichever is available
  const imageUrl = media_url || url;
  
  // Check if the image is HEIC or marked as such
  const isHeic = is_heic || isHeicImage(imageUrl);
  
  try {
    // Always use the ImageAspectRatio component for consistent rendering and better error handling
    return (
      <figure key={`image-${listPath}-${index}`} className="my-4">
        <ImageAspectRatio
          src={imageUrl}
          alt={caption || text || "Notion image"}
          className="max-w-full rounded-md"
          isHeic={isHeic}
        />
        {(caption || text || isHeic) && (
          <figcaption className="text-center text-sm text-muted-foreground mt-2 flex flex-col">
            {(caption || text) && <span>{caption || text}</span>}
            {isHeic && <span className="text-xs text-amber-600">HEIC format - not supported by most browsers</span>}
          </figcaption>
        )}
      </figure>
    );
  } catch (error) {
    console.error("Error rendering image:", error);
    return (
      <div key={`image-error-${listPath}-${index}`} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
        <p className="text-red-500">Failed to load image</p>
        <p className="text-xs text-red-400">{imageUrl}</p>
        {isHeic && (
          <p className="text-xs mt-2 text-amber-600">HEIC format not supported by most browsers</p>
        )}
      </div>
    );
  }
};

export const VideoRenderer: React.FC<MediaProps> = ({
  url,
  media_url,
  caption,
  text,
  index,
  listPath
}) => {
  try {
    // Convert YouTube urls to embeds if needed
    let embedUrl = media_url || url || "";
    
    if (embedUrl && embedUrl.includes('youtube.com/watch') && !embedUrl.includes('embed')) {
      try {
        const videoId = new URL(embedUrl).searchParams.get('v');
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } catch (error) {
        console.error("Error parsing YouTube URL:", error);
      }
    } else if (embedUrl && embedUrl.includes('youtu.be/')) {
      try {
        const urlObj = new URL(embedUrl);
        const videoId = urlObj.pathname.split('/').pop()?.split('?')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } catch (error) {
        console.error("Error parsing YouTube short URL:", error);
      }
    }
    
    return (
      <figure key={`video-${listPath}-${index}`} className="my-4">
        <div className="relative pb-[56.25%] h-0">
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full rounded-md"
            allowFullScreen
            aria-label={caption || text || "Embedded video"}
          />
        </div>
        {(caption || text) && (
          <figcaption className="text-center text-sm text-muted-foreground mt-2">
            {caption || text}
          </figcaption>
        )}
      </figure>
    );
  } catch (error) {
    console.error("Error rendering video:", error);
    return (
      <div key={`video-error-${listPath}-${index}`} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
        <p className="text-red-500">Failed to load video</p>
        <p className="text-xs text-red-400">{media_url || url}</p>
      </div>
    );
  }
};

export const EmbedRenderer: React.FC<MediaProps> = ({
  media_url,
  caption,
  text,
  index,
  listPath
}) => {
  try {
    return (
      <figure key={`embed-${listPath}-${index}`} className="my-4">
        <div className="relative pb-[56.25%] h-0">
          <iframe
            src={media_url}
            className="absolute top-0 left-0 w-full h-full rounded-md border-0"
            allowFullScreen
            aria-label={caption || text || "Embedded content"}
          />
        </div>
        {(caption || text) && (
          <figcaption className="text-center text-sm text-muted-foreground mt-2">
            {caption || text}
          </figcaption>
        )}
      </figure>
    );
  } catch (error) {
    console.error("Error rendering embed:", error);
    return (
      <div key={`embed-error-${listPath}-${index}`} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
        <p className="text-red-500">Failed to load embedded content</p>
        <p className="text-xs text-red-400">{media_url}</p>
      </div>
    );
  }
};
