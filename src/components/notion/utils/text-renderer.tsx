
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

  // Filter valid annotations based on text property first
  const textBasedAnnotations = annotations.filter(annotation => {
    return annotation.text && typeof annotation.text === 'string';
  });
  
  // If we have text-based annotations, apply them
  if (textBasedAnnotations.length > 0) {
    // Process text matching annotations
    let result = text;
    const segments: React.ReactNode[] = [];
    
    // For each annotation, find and replace its text with styled version
    for (const annotation of textBasedAnnotations) {
      const annotationText = annotation.text || "";
      
      // Skip if no text to match
      if (!annotationText) continue;
      
      // Find all occurrences of this text
      let lastIndex = 0;
      let index = result.indexOf(annotationText, lastIndex);
      
      while (index !== -1) {
        // Add text before this occurrence
        if (index > lastIndex) {
          segments.push(result.substring(lastIndex, index));
        }
        
        // Add styled text
        segments.push(
          createStyledNode(annotationText, annotation, segments.length)
        );
        
        // Update indices
        lastIndex = index + annotationText.length;
        index = result.indexOf(annotationText, lastIndex);
      }
      
      // Add any remaining text
      if (lastIndex < result.length) {
        segments.push(result.substring(lastIndex));
      }
      
      // Update result for next annotation
      result = segments.join("");
      segments.length = 0;
    }
    
    return result;
  }
  
  // If no text-based annotations, try positional annotations
  const positionalAnnotations = annotations.filter(annotation => {
    return typeof annotation.start === 'number' && 
           typeof annotation.end === 'number' &&
           annotation.start >= 0 && 
           annotation.end <= text.length && 
           annotation.start < annotation.end;
  });
  
  if (positionalAnnotations.length === 0) return text;
  
  // Sort annotations by start position
  positionalAnnotations.sort((a, b) => (a.start || 0) - (b.start || 0));
  
  // Build segments based on positional annotations
  const segments: React.ReactNode[] = [];
  let currentPosition = 0;
  
  for (let i = 0; i < positionalAnnotations.length; i++) {
    const ann = positionalAnnotations[i];
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
        i
      )
    );
    
    // Update current position
    currentPosition = end;
  }
  
  // Add any remaining unstyled text
  if (currentPosition < text.length) {
    segments.push(text.substring(currentPosition));
  }
  
  return segments;
};

// Create a styled React node for a text segment based on its annotation
const createStyledNode = (text: string, annotation: NotionAnnotation, index: number): React.ReactNode => {
  const { bold, italic, underline, strikethrough, code, color, href } = annotation;
  const uniqueKey = `styled-${text}-${index}-${Date.now()}`;
  
  // Get style classes
  const colorClass = getColorClass(color);
  const bgColorClass = getBackgroundColorClass(color);
  
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
    <span key={uniqueKey} className={styles}>
      {text}
    </span>
  );
  
  // If this is a link, wrap in an anchor tag
  if (href) {
    // Clean the href if needed (remove angle brackets)
    const cleanHref = href.replace(/^<|>$/g, '');
    return (
      <a 
        key={`link-${uniqueKey}`} 
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
  if (!color || color === "default" || color.includes("_background")) return '';
  
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

// Helper function to get the correct background color class based on the color string
const getBackgroundColorClass = (color?: string): string => {
  if (!color || !color.includes("_background")) return '';
  
  const colorName = color.replace('_background', '');
  switch (colorName) {
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
