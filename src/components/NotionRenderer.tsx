
import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// Define the types for our new simplified Notion blocks format
type NotionAnnotation = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  text: string;
  start?: number;
  end?: number;
  href?: string;
};

type NotionBlock = {
  id?: string;
  type: string;
  text?: string;
  list_type?: "numbered_list" | "bulleted_list";
  is_list_item?: boolean;
  checked?: boolean;
  media_url?: string;
  media_type?: "image" | "video" | "embed";
  caption?: string;
  language?: string;
  icon?: any;
  annotations?: NotionAnnotation[];
  children?: NotionBlock[];
  url?: string; // For backward compatibility
};

interface NotionRendererProps {
  blocks: NotionBlock[];
  className?: string;
}

const NotionRenderer: React.FC<NotionRendererProps> = ({ blocks, className }) => {
  if (!blocks || !Array.isArray(blocks)) {
    return <div className="text-muted-foreground">No content available</div>;
  }

  // Keep track of lists to group them
  let currentListType: string | null = null;
  let listItems: React.ReactNode[] = [];

  const renderAnnotatedText = (text: string, annotations?: NotionAnnotation[]) => {
    if (!annotations || annotations.length === 0) {
      return text;
    }

    // If we have the text and annotations are in the new format with start/end positions
    if (annotations[0]?.start !== undefined && annotations[0]?.end !== undefined) {
      // Create an array to hold all the text segments
      let segments: React.ReactNode[] = [];
      let currentPosition = 0;
      
      // Sort annotations by start position
      const sortedAnnotations = [...annotations].sort((a, b) => (a.start || 0) - (b.start || 0));
      
      // Process each annotation
      for (const annotation of sortedAnnotations) {
        const { start, end } = annotation;
        
        // Add plain text before this annotation if needed
        if ((start || 0) > currentPosition) {
          segments.push(text.substring(currentPosition, start));
        }
        
        // Add the annotated text
        const styles = cn(
          annotation.bold && "font-bold",
          annotation.italic && "italic",
          annotation.underline && "underline",
          annotation.strikethrough && "line-through",
          annotation.code && "font-mono bg-muted rounded px-1 py-0.5",
          annotation.color && `text-${annotation.color}-500`
        );
        
        const content = (
          <span key={start} className={styles}>
            {text.substring(start || 0, end || text.length)}
          </span>
        );
        
        // If it's a link, wrap it
        if (annotation.href) {
          segments.push(
            <a key={start} href={annotation.href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          );
        } else {
          segments.push(content);
        }
        
        // Update current position
        currentPosition = end || 0;
      }
      
      // Add any remaining text
      if (currentPosition < text.length) {
        segments.push(text.substring(currentPosition));
      }
      
      return segments;
    }
    
    // For backward compatibility with old annotation format
    return annotations.map((annotation, index) => {
      const { bold, italic, underline, strikethrough, code, color, text, href } = annotation;
      
      const styles = cn(
        bold && "font-bold",
        italic && "italic",
        underline && "underline",
        strikethrough && "line-through",
        code && "font-mono bg-muted rounded px-1 py-0.5",
        color && color !== "default" && `text-${color}-500`
      );

      const content = (
        <span key={index} className={styles}>
          {text}
        </span>
      );

      return href ? (
        <a key={index} href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      );
    });
  };

  const renderBlock = (block: NotionBlock, index: number) => {
    const { type, text, list_type, is_list_item, checked, media_url, media_type, caption, language, annotations, children } = block;

    // Handle both formats: older format uses media_url, newer format might use url
    const imageUrl = media_url || block.url;
    const videoUrl = media_url || block.url;
    
    // Process list items separately to group them
    if (is_list_item && list_type) {
      if (currentListType !== list_type) {
        // Render the previous list if we're starting a new one
        const prevList = renderList();
        currentListType = list_type;
        listItems = [];
        
        // Add the current item to the new list
        listItems.push(
          <li key={index} className="my-1">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
            {children && children.length > 0 && (
              <div className="pl-6 mt-2">
                {children.map((child, childIndex) => renderBlock(child, childIndex))}
              </div>
            )}
          </li>
        );
        return prevList;
      } else {
        // Add to the current list
        listItems.push(
          <li key={index} className="my-1">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
            {children && children.length > 0 && (
              <div className="pl-6 mt-2">
                {children.map((child, childIndex) => renderBlock(child, childIndex))}
              </div>
            )}
          </li>
        );
        return null;
      }
    } else if (currentListType) {
      // We're no longer in a list, render the previous list
      const prevList = renderList();
      currentListType = null;
      listItems = [];
      
      // And continue with regular block rendering
    }

    // Handle media blocks (image, video, embed) in a consistent way
    if (media_type === "image" || type === "image") {
      try {
        return (
          <figure key={index} className="my-4">
            <img 
              src={media_url || imageUrl} 
              alt={text || caption || "Notion image"} 
              className="max-w-full rounded-md"
            />
            {(text || caption) && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2">
                {text || caption}
              </figcaption>
            )}
          </figure>
        );
      } catch (error) {
        console.error("Error rendering image:", error);
        return (
          <div key={index} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
            <p className="text-red-500">Failed to load image</p>
            <p className="text-xs text-red-400">{media_url || imageUrl}</p>
          </div>
        );
      }
    }

    if (media_type === "video" || type === "video") {
      try {
        // Convert YouTube urls to embeds if needed
        let embedUrl = media_url || videoUrl || "";
        
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
            const url = new URL(embedUrl);
            const videoId = url.pathname.split('/').pop()?.split('?')[0];
            if (videoId) {
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
          } catch (error) {
            console.error("Error parsing YouTube short URL:", error);
          }
        }
        
        return (
          <figure key={index} className="my-4">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full rounded-md"
                allowFullScreen
                title={text || caption || "Embedded video"}
              />
            </div>
            {(text || caption) && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2">
                {text || caption}
              </figcaption>
            )}
          </figure>
        );
      } catch (error) {
        console.error("Error rendering video:", error);
        return (
          <div key={index} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
            <p className="text-red-500">Failed to load video</p>
            <p className="text-xs text-red-400">{media_url || videoUrl}</p>
          </div>
        );
      }
    }

    if (media_type === "embed") {
      try {
        return (
          <figure key={index} className="my-4">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={media_url}
                className="absolute top-0 left-0 w-full h-full rounded-md border-0"
                allowFullScreen
                title={text || caption || "Embedded content"}
              />
            </div>
            {(text || caption) && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2">
                {text || caption}
              </figcaption>
            )}
          </figure>
        );
      } catch (error) {
        console.error("Error rendering embed:", error);
        return (
          <div key={index} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
            <p className="text-red-500">Failed to load embedded content</p>
            <p className="text-xs text-red-400">{media_url}</p>
          </div>
        );
      }
    }

    // Handle other block types
    switch (type) {
      case "heading_1":
        return (
          <h1 key={index} className="text-3xl font-bold mt-8 mb-4">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
          </h1>
        );
      case "heading_2":
        return (
          <h2 key={index} className="text-2xl font-bold mt-6 mb-3">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
          </h2>
        );
      case "heading_3":
        return (
          <h3 key={index} className="text-xl font-bold mt-5 mb-2">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
          </h3>
        );
      case "paragraph":
        return (
          <p key={index} className="my-3">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
          </p>
        );
      case "quote":
        return (
          <blockquote key={index} className="border-l-4 border-muted pl-4 py-1 my-4 italic">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
          </blockquote>
        );
      case "to_do":
        return (
          <div key={index} className="flex items-start gap-2 my-2">
            <input 
              type="checkbox" 
              checked={checked} 
              readOnly 
              className="mt-1"
            />
            <span className={cn(checked && "line-through text-muted-foreground")}>
              {annotations && text ? renderAnnotatedText(text, annotations) : text}
            </span>
          </div>
        );
      case "divider":
        return <hr key={index} className="my-6 border-t border-muted" />;
      case "callout":
        return (
          <div key={index} className="bg-muted p-4 rounded-md my-4 flex gap-3 items-start">
            {block.icon && <div>{block.icon}</div>}
            <div>{annotations && text ? renderAnnotatedText(text, annotations) : text}</div>
          </div>
        );
      case "code":
        return (
          <pre key={index} className="bg-muted p-4 rounded-md my-4 overflow-x-auto">
            <code className={language ? `language-${language}` : ""}>
              {text}
            </code>
          </pre>
        );
      case "toggle":
        return (
          <details key={index} className="my-2 border border-muted rounded-md">
            <summary className="p-3 cursor-pointer font-medium hover:bg-muted/50">
              {annotations && text ? renderAnnotatedText(text, annotations) : text}
            </summary>
            {children && children.length > 0 && (
              <div className="p-3 pt-0">
                {children.map((child, childIndex) => renderBlock(child, childIndex))}
              </div>
            )}
          </details>
        );
      case "bulleted_list_item":
      case "numbered_list_item":
        // Handle legacy format directly
        return (
          <div key={index} className="ml-6 my-2">
            {type === "bulleted_list_item" ? "• " : `${index + 1}. `}
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
            {children && children.length > 0 && (
              <div className="pl-6 mt-2">
                {children.map((child, childIndex) => renderBlock(child, childIndex))}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div key={index} className="my-2">
            {annotations && text ? renderAnnotatedText(text, annotations) : text}
            {children && children.length > 0 && (
              <div className="pl-6 mt-2">
                {children.map((child, childIndex) => renderBlock(child, childIndex))}
              </div>
            )}
          </div>
        );
    }
  };

  // Render the current list
  const renderList = () => {
    if (!currentListType || listItems.length === 0) return null;
    
    if (currentListType === "numbered_list") {
      return <ol className="list-decimal pl-6 my-4">{listItems}</ol>;
    } else if (currentListType === "bulleted_list") {
      return <ul className="list-disc pl-6 my-4">{listItems}</ul>;
    }
    return null;
  };

  // Error handling wrapper for the entire renderer
  try {
    // Render all blocks
    const content = blocks.map((block, index) => renderBlock(block, index));
    
    // Make sure to include any remaining list
    if (currentListType) {
      content.push(renderList());
    }

    return (
      <div className={cn("notion-content", className)}>
        {content}
      </div>
    );
  } catch (error) {
    console.error("Error rendering Notion content:", error);
    toast({
      title: "Error displaying content",
      description: "There was a problem rendering the content. Please try again later.",
      variant: "destructive"
    });
    return (
      <div className="p-6 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error displaying content</h3>
        <p>There was a problem rendering the Notion content.</p>
      </div>
    );
  }
};

export default NotionRenderer;
