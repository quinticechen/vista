
import React from "react";
import { cn } from "@/lib/utils";

// Define the types for Notion blocks
type NotionAnnotation = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  text: string;
  start: number;
  end: number;
  href?: string;
};

type NotionBlock = {
  id?: string;
  type: string;
  text: string;
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

    // Sort annotations by start position
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);
    
    // Create an array of text spans with their formatting
    return sortedAnnotations.map((annotation, index) => {
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
            {annotations ? renderAnnotatedText(text, annotations) : text}
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
            {annotations ? renderAnnotatedText(text, annotations) : text}
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

    switch (type) {
      case "heading_1":
        return (
          <h1 key={index} className="text-3xl font-bold mt-8 mb-4">
            {annotations ? renderAnnotatedText(text, annotations) : text}
          </h1>
        );
      case "heading_2":
        return (
          <h2 key={index} className="text-2xl font-bold mt-6 mb-3">
            {annotations ? renderAnnotatedText(text, annotations) : text}
          </h2>
        );
      case "heading_3":
        return (
          <h3 key={index} className="text-xl font-bold mt-5 mb-2">
            {annotations ? renderAnnotatedText(text, annotations) : text}
          </h3>
        );
      case "paragraph":
        return (
          <p key={index} className="my-3">
            {annotations ? renderAnnotatedText(text, annotations) : text}
          </p>
        );
      case "quote":
        return (
          <blockquote key={index} className="border-l-4 border-muted pl-4 py-1 my-4 italic">
            {annotations ? renderAnnotatedText(text, annotations) : text}
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
              {annotations ? renderAnnotatedText(text, annotations) : text}
            </span>
          </div>
        );
      case "divider":
        return <hr key={index} className="my-6 border-t border-muted" />;
      case "callout":
        return (
          <div key={index} className="bg-muted p-4 rounded-md my-4 flex gap-3 items-start">
            {block.icon && <div>{block.icon}</div>}
            <div>{annotations ? renderAnnotatedText(text, annotations) : text}</div>
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
              {annotations ? renderAnnotatedText(text, annotations) : text}
            </summary>
            {children && children.length > 0 && (
              <div className="p-3 pt-0">
                {children.map((child, childIndex) => renderBlock(child, childIndex))}
              </div>
            )}
          </details>
        );
      case "media":
        if (media_type === "image" && media_url) {
          return (
            <figure key={index} className="my-4">
              <img 
                src={media_url} 
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
        } else if (media_type === "video" && media_url) {
          return (
            <figure key={index} className="my-4">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  src={media_url}
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
        } else if (media_type === "embed" && media_url) {
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
        }
        return null;
      default:
        return (
          <div key={index} className="my-2">
            {annotations ? renderAnnotatedText(text, annotations) : text}
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
};

export default NotionRenderer;
