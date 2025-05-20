import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast"

// Define the types for our new simplified Notion blocks format
type NotionAnnotation = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  text?: string;
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
          segments.push(text.substring(currentPosition, start || 0));
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
      const { bold, italic, underline, strikethrough, code, color, text: annotationText, href } = annotation;
      
      // Use annotationText if available, otherwise this is the wrong format
      if (!annotationText) return null;
      
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
          {annotationText}
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

  // Improved function to render nested lists recursively
  const renderNestedContent = (block: NotionBlock, index: number, depth: number = 0): React.ReactNode => {
    const { children } = block;
    
    // First render the current block
    const blockContent = renderBlockContent(block, index, depth);
    
    // If there are no children, just return the block content
    if (!children || children.length === 0) {
      return blockContent;
    }
    
    // Process children based on their types
    const childrenElements: React.ReactNode[] = [];
    let currentChildListType: string | null = null;
    let childListItems: React.ReactNode[] = [];
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      
      // Check if this is a list item
      if (child.is_list_item || child.type === "bulleted_list_item" || child.type === "numbered_list_item") {
        const listType = child.list_type || (child.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        // If starting a new list or changing list type
        if (currentChildListType !== listType) {
          // Render any existing list before starting a new one
          if (childListItems.length > 0) {
            childrenElements.push(renderListGroup(currentChildListType, childListItems, depth + 1));
            childListItems = [];
          }
          
          currentChildListType = listType;
        }
        
        // Add the item to the current list
        childListItems.push(
          <li key={i} className="my-1">
            {child.text && (child.annotations ? renderAnnotatedText(child.text, child.annotations) : child.text)}
            {child.children && child.children.length > 0 && renderNestedContent({ type: "div", children: child.children }, i, depth + 1)}
          </li>
        );
      } else {
        // If we hit a non-list item and have existing list items, render the list first
        if (childListItems.length > 0) {
          childrenElements.push(renderListGroup(currentChildListType, childListItems, depth + 1));
          childListItems = [];
          currentChildListType = null;
        }
        
        // Render the non-list child
        childrenElements.push(renderNestedContent(child, i, depth + 1));
      }
    }
    
    // Render any remaining list items
    if (childListItems.length > 0) {
      childrenElements.push(renderListGroup(currentChildListType, childListItems, depth + 1));
    }
    
    // For list items, we want to include children within the li, otherwise we render as siblings
    if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      return (
        <li key={index} className="my-1">
          {blockContent}
          {childrenElements.length > 0 && <div className="pl-4 mt-1">{childrenElements}</div>}
        </li>
      );
    } else {
      return (
        <React.Fragment key={index}>
          {blockContent}
          {childrenElements.length > 0 && <div className={depth > 0 ? "pl-4 mt-1" : ""}>{childrenElements}</div>}
        </React.Fragment>
      );
    }
  };

  // Helper to render list groups
  const renderListGroup = (listType: string | null, items: React.ReactNode[], depth: number = 0): React.ReactNode => {
    if (!listType || items.length === 0) return null;
    
    const className = `pl-${4 + depth} my-2`;
    
    if (listType === "numbered_list") {
      return <ol key={`numbered-list-${depth}`} className={`list-decimal ${className}`}>{items}</ol>;
    } else if (listType === "bulleted_list") {
      return <ul key={`bulleted-list-${depth}`} className={`list-disc ${className}`}>{items}</ul>;
    }
    
    return null;
  };

  // Render just the content of a single block, without handling children
  const renderBlockContent = (block: NotionBlock, index: number, depth: number = 0): React.ReactNode => {
    const { type, text, annotations, checked, media_url, media_type, caption, language } = block;
    
    // Handle both formats: older format uses media_url, newer format might use url
    const imageUrl = media_url || block.url;
    const videoUrl = media_url || block.url;
    
    // Process list items separately to group them
    if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      // We handle list items at a higher level
      if (text) {
        return annotations ? renderAnnotatedText(text, annotations) : text;
      }
      return null;
    }

    // Handle media blocks (unified media approach)
    if (media_type === "image" || type === "image" || (type === "media" && block.media_type === "image")) {
      try {
        return (
          <figure key={index} className="my-4">
            <img 
              src={media_url || imageUrl} 
              alt={caption || text || "Notion image"} 
              className="max-w-full rounded-md"
              onError={(e) => {
                console.error(`Failed to load image: ${media_url || imageUrl}`);
                e.currentTarget.onerror = null; // Prevent infinite loops
                e.currentTarget.classList.add("opacity-50");
              }}
            />
            {(caption || text) && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2">
                {caption || text}
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

    if (media_type === "video" || type === "video" || (type === "media" && block.media_type === "video")) {
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
          <div key={index} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
            <p className="text-red-500">Failed to load video</p>
            <p className="text-xs text-red-400">{media_url || videoUrl}</p>
          </div>
        );
      }
    }

    if (media_type === "embed" || type === "embed" || (type === "media" && block.media_type === "embed")) {
      try {
        return (
          <figure key={index} className="my-4">
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
          </details>
        );
      case "div":
        // Special container type for nesting
        return null;
      default:
        if (text) {
          return (
            <div key={index} className="my-2">
              {annotations && text ? renderAnnotatedText(text, annotations) : text}
            </div>
          );
        }
        return null;
    }
  };

  // Render all blocks at the top level
  const renderContent = () => {
    // Group list items first
    const renderedContent: React.ReactNode[] = [];
    let currentListType: string | null = null;
    let listItems: React.ReactNode[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Check if this is a list item
      if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
        const listType = block.list_type || (block.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        // If starting a new list or changing list type
        if (currentListType !== listType) {
          // Render any existing list before starting a new one
          if (listItems.length > 0) {
            renderedContent.push(renderListGroup(currentListType, listItems));
            listItems = [];
          }
          
          currentListType = listType;
        }
        
        // Render the list item with its content and children
        listItems.push(renderNestedContent(block, i));
      } else {
        // If we hit a non-list item and have existing list items, render the list first
        if (listItems.length > 0) {
          renderedContent.push(renderListGroup(currentListType, listItems));
          listItems = [];
          currentListType = null;
        }
        
        // Render the non-list block with its content and children
        renderedContent.push(renderNestedContent(block, i));
      }
    }
    
    // Render any remaining list items
    if (listItems.length > 0) {
      renderedContent.push(renderListGroup(currentListType, listItems));
    }
    
    return renderedContent;
  };

  // Error handling wrapper for the entire renderer
  try {
    return (
      <div className={cn("notion-content", className)}>
        {renderContent()}
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
