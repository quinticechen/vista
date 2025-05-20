
import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
  _counter?: number; // Added for numbered list counter support
  table_width?: number;
  has_row_header?: boolean;
  has_column_header?: boolean;
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
    if (!text) return null;
    
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

  // Improved function to render nested lists recursively
  const renderNestedContent = (block: NotionBlock, index: number, depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    const { children } = block;
    
    // Special case for paragraphs that are direct children of list items
    // Apply special styling to make them consistent with the list appearance
    if (block.type === "paragraph" && block.text && depth > 0) {
      return (
        <div key={`paragraph-${index}`} className="pl-0 my-1">
          {block.annotations ? renderAnnotatedText(block.text, block.annotations) : block.text}
        </div>
      );
    }
    
    // First render the current block
    const blockContent = renderBlockContent(block, index, depth, listPath);
    
    // If there are no children, just return the block content
    if (!children || children.length === 0) {
      return blockContent;
    }
    
    // Process children based on their types
    const childrenElements: React.ReactNode[] = [];
    let currentChildListType: string | null = null;
    let childListItems: React.ReactNode[] = [];
    const childListPath = `${listPath}-${index}`;
    
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
        if (listType === "numbered_list") {
          (child as NotionBlock & { _counter: number })._counter = counter || 0;
        }
        
        const itemContent = (
          <React.Fragment>
            {child.text && (child.annotations ? renderAnnotatedText(child.text, child.annotations) : child.text)}
            {child.children && child.children.length > 0 && renderNestedContent({ type: "div", children: child.children }, i, depth + 1, `${childListPath}-${i}`)}
          </React.Fragment>
        );
        
        childListItems.push(
          <li key={`${childListPath}-item-${i}`} className="my-1">
            {itemContent}
          </li>
        );
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
          {blockContent}
          {childrenElements.length > 0 && <div className="pl-4 mt-1">{childrenElements}</div>}
        </li>
      );
    } else {
      return (
        <React.Fragment key={`${listPath}-frag-${index}`}>
          {blockContent}
          {childrenElements.length > 0 && <div className={depth > 0 ? "pl-4 mt-1" : ""}>{childrenElements}</div>}
        </React.Fragment>
      );
    }
  };

  // Helper to render list groups
  const renderListGroup = (listType: string | null, items: React.ReactNode[], depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    if (!listType || items.length === 0) return null;
    
    const className = `pl-${4 + depth} my-2`;
    
    if (listType === "numbered_list") {
      return <ol key={`numbered-list-${listPath}`} className={`list-decimal ${className}`}>{items}</ol>;
    } else if (listType === "bulleted_list") {
      return <ul key={`bulleted-list-${listPath}`} className={`list-disc ${className}`}>{items}</ul>;
    }
    
    return null;
  };

  // Render just the content of a single block, without handling children
  const renderBlockContent = (block: NotionBlock, index: number, depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    const { type, text, checked, media_url, media_type, caption, language } = block;
    
    // Handle both formats: older format uses media_url, newer format might use url
    const imageUrl = media_url || block.url;
    const videoUrl = media_url || block.url;
    
    // Process list items separately to group them
    if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      // We handle list items at a higher level
      if (text) {
        return block.annotations ? renderAnnotatedText(text, block.annotations) : text;
      }
      return null;
    }

    // Handle media blocks (unified media approach)
    if (media_type === "image" || type === "image" || (type === "media" && block.media_type === "image")) {
      try {
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
                
                // If it's a HEIC file, add a notice
                if ((media_url || imageUrl)?.toLowerCase().endsWith('.heic')) {
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
            {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
          </h1>
        );
      case "heading_2":
        return (
          <h2 key={`h2-${listPath}-${index}`} className="text-2xl font-bold mt-6 mb-3">
            {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
          </h2>
        );
      case "heading_3":
        return (
          <h3 key={`h3-${listPath}-${index}`} className="text-xl font-bold mt-5 mb-2">
            {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
          </h3>
        );
      case "paragraph":
        // Enhanced styling for paragraphs inside lists to match indentation
        // Note the change here to not add text-muted-foreground for paragraphs inside lists
        const isNestedParagraph = depth > 0;
        return (
          <p key={`p-${listPath}-${index}`} className={cn(
            "my-3", 
            isNestedParagraph && "pl-4"
          )}>
            {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
          </p>
        );
      case "quote":
        return (
          <blockquote key={`quote-${listPath}-${index}`} className="border-l-4 border-muted pl-4 py-1 my-4 italic">
            {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
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
              {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
            </span>
          </div>
        );
      case "divider":
        return <hr key={`divider-${listPath}-${index}`} className="my-6 border-t border-muted" />;
      case "callout":
        return (
          <div key={`callout-${listPath}-${index}`} className="bg-muted p-4 rounded-md my-4 flex gap-3 items-start">
            {block.icon && <div>{block.icon}</div>}
            <div>{block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}</div>
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
        return (
          <details key={`toggle-${listPath}-${index}`} className="my-2 border border-muted rounded-md">
            <summary className="p-3 cursor-pointer font-medium hover:bg-muted/50">
              {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
            </summary>
          </details>
        );
      case "table":
        return (
          <div key={`table-${listPath}-${index}`} className="my-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              {block.children && block.children.map((row, rowIndex) => (
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
                        {cell.text && (cell.annotations ? 
                          renderAnnotatedText(cell.text, cell.annotations) : 
                          cell.text
                        )}
                      </CellTag>
                    );
                  })}
                </tr>
              ))}
            </table>
          </div>
        );
      case "div":
        // Special container type for nesting
        return null;
      default:
        if (text) {
          return (
            <div key={`default-${listPath}-${index}`} className="my-2">
              {block.annotations && text ? renderAnnotatedText(text, block.annotations) : text}
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
    
    // Fix the numbering in nested numbered lists
    const processBlock = (block: NotionBlock) => {
      // Process children if they exist
      if (block.children?.length) {
        // Collect numbered list items by their parent
        const numberedListGroups: Record<string, NotionBlock[]> = {};
        
        // Group numbered list items
        block.children.forEach(child => {
          if (child.type === "numbered_list_item" || 
              (child.is_list_item && child.list_type === "numbered_list")) {
            // Create a key based on the parent and list type
            const key = `numbered_list`;
            if (!numberedListGroups[key]) {
              numberedListGroups[key] = [];
            }
            numberedListGroups[key].push(child);
          }
          
          // Process this child's children recursively
          processBlock(child);
        });
        
        // Fix the number attribute for each group
        Object.values(numberedListGroups).forEach(group => {
          // Add a counter attribute to each item that will be used for rendering
          group.forEach((item, index) => {
            // Use TypeScript assertion to add _counter to the item
            (item as NotionBlock & { _counter: number })._counter = index + 1;
          });
        });
      }
    };
    
    // Process all top-level blocks
    fixedContent.forEach(processBlock);
    
    return fixedContent;
  };

  // Render all blocks at the top level
  const renderContent = () => {
    // Fix numbering issues
    const fixedBlocks = fixNumberedLists(blocks);
    
    // Group list items first
    const renderedContent: React.ReactNode[] = [];
    let currentListType: string | null = null;
    let listItems: React.ReactNode[] = [];
    let currentListPath = 'root-list';
    
    for (let i = 0; i < fixedBlocks.length; i++) {
      const block = fixedBlocks[i];
      
      // Check if this is a list item
      if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
        const listType = block.list_type || (block.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        // If starting a new list or changing list type
        if (currentListType !== listType) {
          // Render any existing list before starting a new one
          if (listItems.length > 0) {
            renderedContent.push(renderListGroup(currentListType, listItems, 0, currentListPath));
            listItems = [];
          }
          
          currentListType = listType;
          currentListPath = `root-list-${i}`;
          
          // Reset counter for new list
          if (listType === "numbered_list") {
            listCounters.resetCounter(currentListPath);
          }
        }
        
        // Set the counter for the item if it's a numbered list
        if (listType === "numbered_list") {
          const counter = listCounters.getNextCount(currentListPath);
          (block as NotionBlock & { _counter: number })._counter = counter;
        }
        
        // Render the list item with its content and children
        listItems.push(renderNestedContent(block, i, 0, `${currentListPath}-item-${i}`));
      } else {
        // If we hit a non-list item and have existing list items, render the list first
        if (listItems.length > 0) {
          renderedContent.push(renderListGroup(currentListType, listItems, 0, currentListPath));
          listItems = [];
          currentListType = null;
        }
        
        // Render the non-list block with its content and children
        renderedContent.push(renderNestedContent(block, i, 0, `root-block-${i}`));
      }
    }
    
    // Render any remaining list items
    if (listItems.length > 0) {
      renderedContent.push(renderListGroup(currentListType, listItems, 0, currentListPath));
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
