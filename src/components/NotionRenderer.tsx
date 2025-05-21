import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Toggle } from "@/components/ui/toggle";
import { ChevronDown, ChevronUp } from "lucide-react";
import ImageAspectRatio from "@/components/ui/image-aspect-ratio";

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
  emoji?: string;
  annotations?: NotionAnnotation[];
  children?: NotionBlock[];
  url?: string; // For backward compatibility
  _counter?: number; // Added for numbered list counter support
  table_width?: number;
  has_row_header?: boolean;
  has_column_header?: boolean;
  is_heic?: boolean; // New property to indicate HEIC images
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

  // Helper function to check if an image URL is a HEIC format
  const isHeicImage = (url?: string): boolean => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return urlLower.endsWith('.heic') || 
           urlLower.includes('/heic') || 
           urlLower.includes('heic.') ||
           urlLower.includes('image/heic');
  };

  const renderAnnotatedText = (text: string, annotations?: NotionAnnotation[]) => {
    if (!text) return null;
    
    // Handle line breaks in text
    if (text.includes('\n')) {
      const segments = text.split('\n').map((segment, index, array) => {
        return (
          <React.Fragment key={`segment-${index}`}>
            {segment}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        );
      });
      return segments;
    }
    
    if (!annotations || annotations.length === 0) {
      return text;
    }

    // If we have the text and annotations are in the new format with start/end positions
    if (annotations.some(a => a.start !== undefined && a.end !== undefined)) {
      // Create spans for each annotation with proper styling
      let segments: React.ReactNode[] = [];
      
      // Sort annotations by start position to ensure proper order
      const sortedAnnotations = [...annotations].sort((a, b) => (a.start || 0) - (b.start || 0));
      
      // Create a segment for each part of the text that has annotations
      let lastEnd = 0;
      
      for (const annotation of sortedAnnotations) {
        const start = annotation.start || 0;
        const end = annotation.end || 0;
        
        // Add any text before this annotation
        if (start > lastEnd) {
          segments.push(text.substring(lastEnd, start));
        }
        
        // Skip if invalid positions
        if (end <= start) continue;
        
        // Extract the text for this annotation
        const annotatedText = text.substring(start, end);
        
        // Determine styling classes
        const isBackgroundColor = annotation.color && annotation.color.includes("_background");
        const colorName = annotation.color ? annotation.color.replace('_background', '') : '';
        const textColorClass = !isBackgroundColor && annotation.color ? `text-${colorName}-500` : '';
        const bgColorClass = isBackgroundColor ? `bg-${colorName}-100` : '';
        
        const styles = cn(
          annotation.bold && "font-bold",
          annotation.italic && "italic",
          annotation.underline && "underline",
          annotation.strikethrough && "line-through",
          annotation.code && "font-mono bg-muted rounded px-1 py-0.5",
          textColorClass,
          bgColorClass
        );
        
        // Create the styled span
        const styledSpan = (
          <span key={`annotation-${start}-${end}`} className={styles}>
            {annotatedText}
          </span>
        );
        
        // Add the span directly or wrap in a link if needed
        if (annotation.href) {
          segments.push(
            <a 
              key={`link-${start}-${end}`} 
              href={annotation.href}
              className="text-blue-500 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {styledSpan}
            </a>
          );
        } else {
          segments.push(styledSpan);
        }
        
        lastEnd = end;
      }
      
      // Add any remaining text
      if (lastEnd < text.length) {
        segments.push(text.substring(lastEnd));
      }
      
      return segments.length > 0 ? segments : text;
    }
    
    // For backward compatibility with old annotation format
    return annotations.map((annotation, index) => {
      const { bold, italic, underline, strikethrough, code, color, text: annotationText, href } = annotation;
      
      // Use annotationText if available, otherwise this is the wrong format
      if (!annotationText) return null;
      
      // Handle background colors
      const isBackgroundColor = color && color.includes("_background");
      const colorName = color ? color.replace('_background', '') : '';
      const bgColorClass = isBackgroundColor ? `bg-${colorName}-100` : "";
      
      const styles = cn(
        bold && "font-bold",
        italic && "italic",
        underline && "underline",
        strikethrough && "line-through",
        code && "font-mono bg-muted rounded px-1 py-0.5",
        color && !isBackgroundColor && color !== "default" && `text-${colorName}-500`,
        bgColorClass
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

  // Helper function to track and reset counters for numbered lists
  const createListCounters = () => {
    const counters = new Map<string, number>();
    
    const getNextCount = (listId: string) => {
      const current = counters.get(listId) || 0;
      const next = current + 1;
      counters.set(listId, next);
      return next;
    };
    
    const resetCounter = (listId: string) => {
      counters.set(listId, 0);
    };
    
    return { getNextCount, resetCounter };
  };
  
  const listCounters = createListCounters();

  // Helper function to safely render an icon
  const renderIcon = (icon: any) => {
    if (!icon) return null;
    
    if (typeof icon === 'string') {
      return icon;
    }
    
    if (icon.emoji) {
      return icon.emoji;
    }
    
    if (icon.type === 'emoji' && icon.emoji) {
      return icon.emoji;
    }
    
    // For other icon types, return a generic representation
    return null;
  };

  // Improved function to render nested lists recursively
  const renderNestedContent = (block: NotionBlock, index: number, depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    const { children } = block;
    
    // Special case for paragraphs that are direct children of list items
    // Apply special styling to make them consistent with the list appearance
    if (block.type === "paragraph" && block.text && depth > 0) {
      return (
        <div key={`paragraph-${index}`} className="my-1">
          {renderTextWithLineBreaks(block)}
        </div>
      );
    }
    
    // First render the current block
    const blockContent = renderBlockContent(block, index, depth, listPath);
    
    // If there are no children, just return the block content
    if (!children || children.length === 0) {
      // For list items without children, we need to wrap them in the appropriate list tag
      if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
        const listType = block.list_type || (block.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        return (
          <li key={`${listPath}-item-${index}`} className="my-1">
            {renderTextWithLineBreaks(block)}
          </li>
        );
      }
      
      return blockContent;
    }
    
    // Process children based on their types
    const childrenElements: React.ReactNode[] = [];
    let currentChildListType: string | null = null;
    let childListItems: React.ReactNode[] = [];
    const childListPath = `${listPath}-${index}`;
    
    // Group the children by their list types
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      
      // Check if this is a list item
      if (child.is_list_item || child.type === "bulleted_list_item" || child.type === "numbered_list_item") {
        const listType = child.list_type || (child.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        // If starting a new list or changing list type
        if (currentChildListType !== listType) {
          // Render any existing list before starting a new one
          if (childListItems.length > 0) {
            childrenElements.push(renderListGroup(currentChildListType, childListItems, depth + 1, childListPath));
            childListItems = [];
          }
          
          currentChildListType = listType;
          // Reset counter for new numbered list
          if (listType === "numbered_list") {
            listCounters.resetCounter(childListPath);
          }
        }
        
        // Add the item to the current list
        const counter = listType === "numbered_list" ? listCounters.getNextCount(childListPath) : undefined;
        
        // Set the counter for use in rendering
        if (listType === "numbered_list" && child) {
          (child as NotionBlock & { _counter: number })._counter = counter || 0;
        }
        
        // Recursively render nested content
        childListItems.push(renderNestedContent(child, i, depth + 1, `${childListPath}-${i}`));
      } else {
        // If we hit a non-list item and have existing list items, render the list first
        if (childListItems.length > 0) {
          childrenElements.push(renderListGroup(currentChildListType, childListItems, depth + 1, childListPath));
          childListItems = [];
          currentChildListType = null;
        }
        
        // Render the non-list child
        childrenElements.push(renderNestedContent(child, i, depth + 1, `${childListPath}-${i}`));
      }
    }
    
    // Render any remaining list items
    if (childListItems.length > 0) {
      childrenElements.push(renderListGroup(currentChildListType, childListItems, depth + 1, childListPath));
    }
    
    // For list items, we want to include children within the li, otherwise we render as siblings
    if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      return (
        <li key={`${listPath}-list-${index}`} className="my-1">
          {renderTextWithLineBreaks(block)}
          {childrenElements.length > 0 && (
            <div className="ml-4 mt-1">
              {childrenElements}
            </div>
          )}
        </li>
      );
    } else if (block.type === "toggle") {
      // Special handling for toggle blocks - return the toggle with its children inside the CollapsibleContent
      return (
        <Collapsible key={`toggle-${listPath}-${index}`} className="my-2 border border-muted rounded-md">
          <CollapsibleTrigger className="p-3 w-full flex items-center justify-between text-left font-medium hover:bg-muted/50">
            <div className="flex items-center">
              {block.emoji && <span className="mr-2">{renderIcon({emoji: block.emoji})}</span>}
              {block.text && <span>{renderTextWithLineBreaks(block)}</span>}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ui-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-0 border-t">
            {childrenElements}
          </CollapsibleContent>
        </Collapsible>
      );
    } else if (block.type === "callout") {
      // Special handling for callout blocks - Fix for duplicate callout rendering
      // Only render callout with its content once
      return (
        <div key={`callout-${listPath}-${index}`} className="bg-muted p-4 rounded-md my-4 flex gap-3 items-start">
          {(block.icon || block.emoji) && (
            <div className="text-xl flex-shrink-0 mt-0.5">{renderIcon(block.icon) || block.emoji}</div>
          )}
          <div className="flex-1">
            {childrenElements}
          </div>
        </div>
      );
    } else {
      return (
        <React.Fragment key={`${listPath}-frag-${index}`}>
          {blockContent}
          {childrenElements.length > 0 && (
            <div className={depth > 0 ? "ml-4 mt-1" : ""}>
              {childrenElements}
            </div>
          )}
        </React.Fragment>
      );
    }
  };

  // Helper function to render text with line breaks
  const renderTextWithLineBreaks = (block: NotionBlock) => {
    return block.annotations && block.text ? 
      renderAnnotatedText(block.text, block.annotations) : 
      renderAnnotatedText(block.text || "");
  };

  // Helper to render list groups
  const renderListGroup = (listType: string | null, items: React.ReactNode[], depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    if (!listType || items.length === 0) return null;
    
    // Use consistent indentation with 1rem (16px) per level
    const className = "my-2";
    
    if (listType === "numbered_list") {
      return <ol key={`numbered-list-${listPath}`} className={`list-decimal pl-8 ${className}`}>{items}</ol>;
    } else if (listType === "bulleted_list") {
      return <ul key={`bulleted-list-${listPath}`} className={`list-disc pl-8 ${className}`}>{items}</ul>;
    }
    
    return null;
  };

  // Render just the content of a single block, without handling children
  const renderBlockContent = (block: NotionBlock, index: number, depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    const { type, text, checked, media_url, media_type, caption, language } = block;
    
    // Handle both formats: older format uses media_url, newer format might use url
    const imageUrl = media_url || block.url;
    const videoUrl = media_url || block.url;
    
    // Check if the image is marked as HEIC or if the URL indicates it's HEIC
    const isHeic = block.is_heic || isHeicImage(imageUrl);
    
    // Special handling for list items - we now handle them differently
    if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      // List items are now handled in renderNestedContent and renderListGroup
      return null;
    }
    
    // Special handling for callout blocks - we want to prevent duplication
    // They will be fully rendered in renderNestedContent with children
    if (block.type === "callout" && block.children && block.children.length > 0) {
      // If callout has children, return null here and let renderNestedContent handle it
      return null;
    }

    // Handle media blocks (unified media approach)
    if (media_type === "image" || type === "image" || (type === "media" && block.media_type === "image")) {
      try {
        // If the image is HEIC, use the ImageAspectRatio component for better error handling
        if (isHeic) {
          return (
            <figure key={`image-${listPath}-${index}`} className="my-4">
              <ImageAspectRatio
                src={media_url || imageUrl}
                alt={caption || text || "Notion image"}
                className="max-w-full rounded-md"
              />
              <figcaption className="text-center text-sm text-muted-foreground mt-2 flex flex-col">
                {(caption || text) && <span>{caption || text}</span>}
                <span className="text-xs text-amber-600">HEIC format - not supported by most browsers</span>
              </figcaption>
            </figure>
          );
        }

        // For regular images
        return (
          <figure key={`image-${listPath}-${index}`} className="my-4">
            <img 
              src={media_url || imageUrl} 
              alt={caption || text || "Notion image"} 
              className="max-w-full rounded-md"
              onError={(e) => {
                console.error(`Failed to load image: ${media_url || imageUrl}`);
                e.currentTarget.onerror = null; // Prevent infinite loops
                e.currentTarget.classList.add("opacity-50");
                
                // Check if it might be a HEIC file based on URL
                if (isHeicImage(media_url || imageUrl)) {
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const notice = document.createElement('div');
                    notice.className = 'mt-2 text-sm text-amber-600';
                    notice.textContent = 'HEIC image format not supported by your browser';
                    parent.appendChild(notice);
                  }
                }
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
          <div key={`image-error-${listPath}-${index}`} className="p-4 border border-red-300 bg-red-50 my-4 rounded-md">
            <p className="text-red-500">Failed to load image</p>
            <p className="text-xs text-red-400">{media_url || imageUrl}</p>
            {isHeic && (
              <p className="text-xs mt-2 text-amber-600">HEIC format not supported by most browsers</p>
            )}
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
            <p className="text-xs text-red-400">{media_url || videoUrl}</p>
          </div>
        );
      }
    }

    if (media_type === "embed" || type === "embed" || (type === "media" && block.media_type === "embed")) {
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
    }

    // Handle other block types
    switch (type) {
      case "heading_1":
        return (
          <h1 key={`h1-${listPath}-${index}`} className="text-3xl font-bold mt-8 mb-4">
            {block.emoji && <span className="mr-2">{renderIcon({emoji: block.emoji})}</span>}
            {renderTextWithLineBreaks(block)}
          </h1>
        );
      case "heading_2":
        return (
          <h2 key={`h2-${listPath}-${index}`} className="text-2xl font-bold mt-6 mb-3">
            {block.emoji && <span className="mr-2">{renderIcon({emoji: block.emoji})}</span>}
            {renderTextWithLineBreaks(block)}
          </h2>
        );
      case "heading_3":
        return (
          <h3 key={`h3-${listPath}-${index}`} className="text-xl font-bold mt-5 mb-2">
            {block.emoji && <span className="mr-2">{renderIcon({emoji: block.emoji})}</span>}
            {renderTextWithLineBreaks(block)}
          </h3>
        );
      case "paragraph":
        return (
          <p key={`p-${listPath}-${index}`} className="my-3">
            {renderTextWithLineBreaks(block)}
          </p>
        );
      case "quote":
        return (
          <blockquote key={`quote-${listPath}-${index}`} className="border-l-4 border-muted pl-4 py-1 my-4 italic">
            {renderTextWithLineBreaks(block)}
          </blockquote>
        );
      case "to_do":
        return (
          <div key={`todo-${listPath}-${index}`} className="flex items-start gap-2 my-2">
            <input 
              type="checkbox" 
              checked={checked} 
              readOnly 
              className="mt-1"
            />
            <span className={cn(checked && "line-through text-muted-foreground")}>
              {renderTextWithLineBreaks(block)}
            </span>
          </div>
        );
      case "divider":
        return <hr key={`divider-${listPath}-${index}`} className="my-6 border-t border-gray-400" />;
      case "callout":
        // If this is a simple callout without children, render it here
        return (
          <div key={`callout-${listPath}-${index}`} className="bg-muted p-4 rounded-md my-4 flex gap-3 items-start">
            {(block.icon || block.emoji) && (
              <div className="text-xl flex-shrink-0 mt-0.5">{renderIcon(block.icon) || block.emoji}</div>
            )}
            <div className="flex-1">
              {renderTextWithLineBreaks(block)}
            </div>
          </div>
        );
      case "code":
        return (
          <pre key={`code-${listPath}-${index}`} className="bg-muted p-4 rounded-md my-4 overflow-x-auto">
            <code className={language ? `language-${language}` : ""}>
              {text}
            </code>
          </pre>
        );
      case "toggle":
        // Note: Toggle is now handled in renderNestedContent
        return (
          <Collapsible key={`toggle-${listPath}-${index}`} className="my-2 border border-muted rounded-md">
            <CollapsibleTrigger className="p-3 w-full flex items-center justify-between text-left font-medium hover:bg-muted/50">
              <div className="flex items-center">
                {block.emoji && <span className="mr-2">{renderIcon({emoji: block.emoji})}</span>}
                <span>{renderTextWithLineBreaks(block)}</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-3 pt-0 border-t">
              {block.children && block.children.map((child, idx) => 
                renderNestedContent(child, idx, 0, `${listPath}-toggle-${idx}`)
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      case "table":
        if (!block.children || block.children.length === 0) return null;
        return (
          <div key={`table-${listPath}-${index}`} className="my-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <tbody>
                {block.children.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {row.children && row.children.map((cell, cellIndex) => {
                      const isHeader = (block.has_column_header && rowIndex === 0) || 
                                      (block.has_row_header && cellIndex === 0);
                      const CellTag = isHeader ? 'th' : 'td';
                      return (
                        <CellTag 
                          key={`cell-${cellIndex}`}
                          className={cn(
                            "px-4 py-2 border text-left",
                            isHeader && "font-semibold bg-gray-100"
                          )}
                        >
                          {cell.text && renderTextWithLineBreaks(cell)}
                        </CellTag>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "column_list":
        if (!block.children || block.children.length === 0) return null;
        // Determine the column count and use appropriate grid classes
        const columnCount = block.children.length;
        const columnClass = cn(
          "grid gap-4", 
          columnCount === 2 && "grid-cols-1 md:grid-cols-2",
          columnCount === 3 && "grid-cols-1 md:grid-cols-3",
          columnCount === 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
          columnCount > 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        );
        
        return (
          <div key={`column-list-${listPath}-${index}`} className={`my-4 ${columnClass}`}>
            {block.children.map((column, colIndex) => (
              <div key={`column-${colIndex}`} className="flex flex-col">
                {column.children && column.children.map((child, childIndex) => (
                  renderNestedContent(child, childIndex, 0, `${listPath}-col-${colIndex}-${childIndex}`)
                ))}
              </div>
            ))}
          </div>
        );
      case "column":
        if (!block.children || block.children.length === 0) return null;
        return (
          <div key={`column-${listPath}-${index}`} className="flex flex-col">
            {block.children.map((child, childIndex) => (
              renderNestedContent(child, childIndex, 0, `${listPath}-column-${childIndex}`)
            ))}
          </div>
        );
      case "equation":
        return (
          <div key={`equation-${listPath}-${index}`} className="my-2 px-2 py-1 bg-gray-50 font-mono text-sm overflow-x-auto">
            {text && <code>{text}</code>}
          </div>
        );
      case "div":
        // Special container type for nesting
        return null;
      default:
        if (text) {
          return (
            <div key={`default-${listPath}-${index}`} className="my-2">
              {renderTextWithLineBreaks(block)}
            </div>
          );
        }
        return null;
    }
  };

  // Helper function to fix the numbered list auto-increment issues
  const fixNumberedLists = (content: NotionBlock[]): NotionBlock[] => {
    // Deep clone the content to avoid mutating the original
    const fixedContent = JSON.parse(JSON.stringify(content));
    
    // Track list items at each level to correctly assign numbers
    let listTracking: Record<string, { type: string, count: number }> = {};
    
    // Process blocks recursively to handle nested lists
    const processBlocks = (blocks: NotionBlock[], path: string = 'root') => {
      let currentListType: string | null = null;
      let currentCount = 0;
      
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        
        // Process this block if it's a list item
        if (block.type === "numbered_list_item" || 
            (block.is_list_item && block.list_type === "numbered_list")) {
          
          // Start or continue a numbered list
          if (currentListType !== "numbered_list") {
            currentListType = "numbered_list";
            currentCount = 0;
          }
          
          // Increment the counter and assign it
          currentCount++;
          (block as NotionBlock & { _counter: number })._counter = currentCount;
        } else if (block.type === "bulleted_list_item" || 
                 (block.is_list_item && block.list_type === "bulleted_list")) {
          // Encountered a different list type
          currentListType = "bulleted_list";
        } else {
          // Not a list item, reset tracking
          currentListType = null;
        }
        
        // Process children recursively
        if (block.children && block.children.length > 0) {
          processBlocks(block.children, `${path}-${i}`);
        }
      }
    };
    
    // Start processing from top-level blocks
    processBlocks(fixedContent);
    
    return fixedContent;
  };

  // Group consecutive list items into their own lists
  const groupListItems = (blocks: NotionBlock[]) => {
    const result: React.ReactNode[] = [];
    let currentType: string | null = null;
    let currentItems: React.ReactNode[] = [];
    let listPath = 'root-grouped';
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Check if this block is a list item
      if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
        const listType = block.list_type || (block.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        // If we're starting a new list or changing list type
        if (currentType !== listType) {
          // Render the current list if it exists
          if (currentItems.length > 0) {
            result.push(renderListGroup(currentType, currentItems, 0, `${listPath}-${i}`));
            currentItems = [];
          }
          
          // Start new list
          currentType = listType;
          
          // Reset counter for numbered lists
          if (listType === "numbered_list") {
            listCounters.resetCounter(`${listPath}-${i}`);
          }
        }
        
        // Add counter for numbered list items
        if (listType === "numbered_list") {
          const counter = listCounters.getNextCount(`${listPath}-${i}`);
          (block as NotionBlock & { _counter: number })._counter = counter;
        }
        
        // Render the list item and add it to current items
        currentItems.push(renderNestedContent(block, i, 0, `${listPath}-item-${i}`));
      } else {
        // This is not a list item, so render any pending list
        if (currentItems.length > 0) {
          result.push(renderListGroup(currentType, currentItems, 0, `${listPath}-${i}`));
          currentItems = [];
          currentType = null;
        }
        
        // Render this non-list block
        result.push(renderNestedContent(block, i, 0, `root-block-${i}`));
      }
    }
    
    // Render any remaining list items
    if (currentItems.length > 0) {
      result.push(renderListGroup(currentType, currentItems, 0, `${listPath}-final`));
    }
    
    return result;
  };

  // Error handling wrapper for the entire renderer
  try {
    // Fix numbered lists and group list items
    const fixedBlocks = fixNumberedLists(blocks);
    return <div className={cn("notion-content", className)}>{groupListItems(fixedBlocks)}</div>;
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
