
import React from "react";
import { cn } from "@/lib/utils";
import { NotionAnnotation } from "../types";

// Render annotated text with formatting
export const renderAnnotatedText = (text: string, annotations?: NotionAnnotation[]) => {
  if (!text) return null;
  
  // Handle line breaks in text
  if (text.includes('\n')) {
    const segments = text.split('\n').map((segment, index, array) => {
      return (
        <React.Fragment key={`segment-${index}`}>
          {renderAnnotatedTextSegment(segment, annotations)}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      );
    });
    return segments;
  }
  
  return renderAnnotatedTextSegment(text, annotations);
};

// Helper function to render a single text segment with annotations
const renderAnnotatedTextSegment = (text: string, annotations?: NotionAnnotation[]) => {
  if (!annotations || annotations.length === 0) {
    return text;
  }

  // Filter and validate annotations
  const validAnnotations = annotations.filter(annotation => {
    // Check if annotation has valid start/end positions
    return typeof annotation.start === 'number' && 
           typeof annotation.end === 'number' &&
           annotation.start >= 0 && 
           annotation.end <= text.length && 
           annotation.start < annotation.end;
  });
  
  if (validAnnotations.length === 0) {
    // If no valid positional annotations, try text-based matching
    const textBasedAnnotations = annotations.filter(annotation => {
      return annotation.text && typeof annotation.text === 'string' && text.includes(annotation.text);
    });
    
    if (textBasedAnnotations.length > 0) {
      return renderTextBasedAnnotations(text, textBasedAnnotations);
    }
    
    return text;
  }
  
  // Sort annotations by start position to handle overlapping correctly
  validAnnotations.sort((a, b) => (a.start || 0) - (b.start || 0));
  
  // Build segments based on positional annotations
  const segments: React.ReactNode[] = [];
  let currentPosition = 0;
  
  for (let i = 0; i < validAnnotations.length; i++) {
    const ann = validAnnotations[i];
    const start = ann.start || 0;
    const end = ann.end || 0;
    
    // Add unstyled text before this annotation
    if (start > currentPosition) {
      segments.push(text.substring(currentPosition, start));
    }
    
    // Add the styled segment
    segments.push(
      createStyledNode(
        text.substring(start, end), 
        ann,
        `pos-${i}-${start}-${end}`
      )
    );
    
    // Update current position
    currentPosition = Math.max(currentPosition, end);
  }
  
  // Add any remaining unstyled text
  if (currentPosition < text.length) {
    segments.push(text.substring(currentPosition));
  }
  
  return segments;
};

// Helper function for text-based annotation matching
const renderTextBasedAnnotations = (text: string, annotations: NotionAnnotation[]) => {
  let result = text;
  let offset = 0;
  const segments: React.ReactNode[] = [];
  
  // Process each annotation
  for (let i = 0; i < annotations.length; i++) {
    const annotation = annotations[i];
    const annotationText = annotation.text || "";
    
    if (!annotationText) continue;
    
    const index = result.indexOf(annotationText);
    if (index === -1) continue;
    
    // Add text before annotation
    if (index > 0) {
      segments.push(result.substring(0, index));
    }
    
    // Add styled annotation
    segments.push(
      createStyledNode(annotationText, annotation, `text-${i}-${Date.now()}`)
    );
    
    // Update result for next iteration
    result = result.substring(index + annotationText.length);
  }
  
  // Add remaining text
  if (result.length > 0) {
    segments.push(result);
  }
  
  return segments.length > 0 ? segments : text;
};

// Create a styled React node for a text segment based on its annotation
const createStyledNode = (text: string, annotation: NotionAnnotation, key: string): React.ReactNode => {
  const { bold, italic, underline, strikethrough, code, color, background_color, href } = annotation;
  
  // Get style classes
  const colorClass = getColorClass(color);
  const bgColorClass = getBackgroundColorClass(background_color);
  
  const styles = cn(
    bold && "font-bold",
    italic && "italic",
    underline && "underline",
    strikethrough && "line-through",
    code && "font-mono bg-muted rounded px-1 py-0.5",
    colorClass,
    bgColorClass
  );
  
  const content = (
    <span key={key} className={styles}>
      {text}
    </span>
  );
  
  // If this is a link, wrap in an anchor tag
  if (href) {
    // Clean the href if needed (remove angle brackets)
    const cleanHref = href.replace(/^<|>$/g, '');
    return (
      <a 
        key={`link-${key}`} 
        href={cleanHref} 
        className="text-blue-500 hover:underline" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }
  
  return content;
};

// Helper function to get the correct text color class based on the color string
const getColorClass = (color?: string): string => {
  if (!color || color === "default") return '';
  
  switch (color) {
    case "red": return "text-red-500";
    case "blue": return "text-blue-500";
    case "green": return "text-green-500";
    case "yellow": return "text-yellow-500";
    case "orange": return "text-orange-500";
    case "purple": return "text-purple-500";
    case "pink": return "text-pink-500";
    case "gray": return "text-gray-500";
    case "brown": return "text-amber-500";
    default: return "";
  }
};

// FIXED: Helper function to get the correct background color class
const getBackgroundColorClass = (background_color?: string): string => {
  if (!background_color) return '';
  
  switch (background_color) {
    case "red": return "bg-red-100";
    case "blue": return "bg-blue-100";
    case "green": return "bg-green-100";
    case "yellow": return "bg-yellow-100";
    case "orange": return "bg-orange-100";
    case "purple": return "bg-purple-100";
    case "pink": return "bg-pink-100";
    case "gray": return "bg-gray-100";
    case "brown": return "bg-amber-100";
    default: return "bg-gray-100";
  }
};

// Helper function to safely render an icon
export const renderIcon = (icon: any) => {
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

// Helper function to render text with line breaks
export const renderTextWithLineBreaks = (block: any) => {
  return block.annotations && block.text ? 
    renderAnnotatedText(block.text, block.annotations) : 
    renderAnnotatedText(block.text || "");
};
